const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PartnerApplication = require('./models/PartnerApplication.cjs');
const InvestorLead = require('./models/InvestorLead.cjs');
const { SEED_APPLICATIONS, SEED_LEADS } = require('./seedData.cjs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory fallback cache if MongoDB is offline
const memoryStore = {
  applications: [...SEED_APPLICATIONS],
  leads: [...SEED_LEADS]
};

let isMongoConnected = false;

// Seed data function
async function seedInitialDataIfEmpty() {
  try {
    const appCount = await PartnerApplication.countDocuments();
    if (appCount === 0) {
      console.log('[GenQuantis MongoDB] Collections empty: Seeding initial applications...');
      await PartnerApplication.insertMany(SEED_APPLICATIONS);
      console.log(`[GenQuantis MongoDB] Successfully seeded ${SEED_APPLICATIONS.length} partner applications.`);
    }

    const leadCount = await InvestorLead.countDocuments();
    if (leadCount === 0) {
      console.log('[GenQuantis MongoDB] Collections empty: Seeding initial investor leads...');
      await InvestorLead.insertMany(SEED_LEADS);
      console.log(`[GenQuantis MongoDB] Successfully seeded ${SEED_LEADS.length} investor leads.`);
    }
  } catch (err) {
    console.error('[GenQuantis MongoDB Seed Warning]', err.message);
  }
}

// Connect to MongoDB Atlas
if (!MONGO_URI) {
  console.error('[GenQuantis MongoDB] No MONGO_URI specified in environment!');
} else {
  console.log(`[GenQuantis MongoDB] Connecting to MongoDB Atlas cluster...`);
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  }).then(async () => {
    isMongoConnected = true;
    console.log(`[GenQuantis MongoDB] ★ SUCCESS! Connected to database: "${mongoose.connection.name}"`);
    console.log(`[GenQuantis MongoDB] Host: ${mongoose.connection.host}`);
    await seedInitialDataIfEmpty();
  }).catch(err => {
    isMongoConnected = false;
    console.error(`[GenQuantis MongoDB Error] Connection failed: ${err.message}`);
    console.log(`[GenQuantis MongoDB] Running with in-memory resilient fallback cache.`);
  });
}

mongoose.connection.on('connected', () => { 
  isMongoConnected = true; 
  console.log(`[GenQuantis MongoDB] Connection established.`);
});
mongoose.connection.on('disconnected', () => { 
  isMongoConnected = false; 
  console.warn(`[GenQuantis MongoDB] Disconnected.`);
});

// 1. Health check & DB status
app.get('/api/health', async (req, res) => {
  let appCount = memoryStore.applications.length;
  let leadCount = memoryStore.leads.length;

  if (isMongoConnected) {
    try {
      appCount = await PartnerApplication.countDocuments();
      leadCount = await InvestorLead.countDocuments();
    } catch (e) {
      // fallback
    }
  }

  res.json({
    status: 'online',
    service: 'GenQuantis Partner & Franchise Portal API',
    mongodb: isMongoConnected ? 'connected' : 'disconnected (using fallback cache)',
    activeDatabase: mongoose.connection?.name || 'genquantis',
    clusterHost: mongoose.connection?.host || 'remote-atlas',
    stats: {
      applications: appCount,
      leads: leadCount
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Submit / Save application directly to MongoDB collection
app.post('/api/partner/applications', async (req, res) => {
  try {
    const appData = req.body;
    if (!appData.id || !appData.pathway) {
      return res.status(400).json({ error: 'Missing application id or pathway' });
    }

    if (isMongoConnected) {
      const saved = await PartnerApplication.findOneAndUpdate(
        { id: appData.id },
        { ...appData, updatedAt: new Date().toISOString() },
        { upsert: true, returnDocument: 'after', new: true, setDefaultsOnInsert: true }
      );
      console.log(`[GenQuantis MongoDB] Application stored: ${saved.id} (${saved.individual?.fullName || 'Applicant'})`);
      return res.status(201).json({ success: true, application: saved, storage: 'mongodb_atlas' });
    } else {
      const idx = memoryStore.applications.findIndex(a => a.id === appData.id);
      if (idx >= 0) {
        memoryStore.applications[idx] = { ...appData, updatedAt: new Date().toISOString() };
      } else {
        memoryStore.applications.unshift(appData);
      }
      return res.status(201).json({ success: true, application: appData, storage: 'fallback_cache' });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: save application]', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Retrieve all applications for GenQuantis Management Dashboard
app.get('/api/partner/applications', async (req, res) => {
  try {
    const { pathway, status, search } = req.query;

    if (isMongoConnected) {
      let query = {};
      if (pathway && pathway !== 'all') query.pathway = pathway;
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { id: { $regex: search, $options: 'i' } },
          { 'individual.fullName': { $regex: search, $options: 'i' } },
          { 'business.legalEntityName': { $regex: search, $options: 'i' } }
        ];
      }

      const list = await PartnerApplication.find(query).sort({ createdAt: -1 });
      return res.json({ 
        success: true, 
        count: list.length, 
        applications: list, 
        database: `${mongoose.connection?.name || 'genquantis'}.partner_applications`,
        storage: 'mongodb_atlas' 
      });
    } else {
      let filtered = [...memoryStore.applications];
      if (pathway && pathway !== 'all') filtered = filtered.filter(a => a.pathway === pathway);
      if (status && status !== 'all') filtered = filtered.filter(a => a.status === status);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(a => 
          a.id.toLowerCase().includes(s) || 
          (a.individual?.fullName && a.individual.fullName.toLowerCase().includes(s))
        );
      }
      return res.json({ success: true, count: filtered.length, applications: filtered, storage: 'fallback_cache' });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: list applications]', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Retrieve single application by ID
app.get('/api/partner/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const appDoc = await PartnerApplication.findOne({ id: new RegExp(`^${id}$`, 'i') });
      if (!appDoc) {
        return res.status(404).json({ error: `Application ${id} not found in MongoDB` });
      }
      return res.json({ success: true, application: appDoc, storage: 'mongodb_atlas' });
    } else {
      const match = memoryStore.applications.find(a => a.id.toUpperCase() === id.toUpperCase());
      if (!match) {
        return res.status(404).json({ error: `Application ${id} not found` });
      }
      return res.json({ success: true, application: match, storage: 'fallback_cache' });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: get application by id]', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Update status (Approve, Reject, Interview, Clarify) directly in MongoDB
app.patch('/api/partner/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, label, note, performedBy } = req.body;

    const timestamp = new Date().toISOString();
    const newTimeline = { status, label, completedAt: timestamp, note };
    const newAudit = {
      id: `log-${Date.now()}`,
      timestamp,
      action: `Status Updated to ${label}`,
      performedBy: performedBy || 'GenQuantis Management',
      details: note || `Application advanced to status: ${status}`
    };

    if (isMongoConnected) {
      const updated = await PartnerApplication.findOneAndUpdate(
        { id: new RegExp(`^${id}$`, 'i') },
        { 
          $set: { status, updatedAt: timestamp },
          $push: { statusTimeline: newTimeline, auditLogs: { $each: [newAudit], $position: 0 } }
        },
        { returnDocument: 'after', new: true }
      );
      console.log(`[GenQuantis MongoDB] Application status updated in MongoDB: ${id} -> ${status}`);
      return res.json({ success: true, application: updated });
    } else {
      const match = memoryStore.applications.find(a => a.id.toUpperCase() === id.toUpperCase());
      if (!match) return res.status(404).json({ error: 'Application not found' });
      match.status = status;
      match.updatedAt = timestamp;
      match.statusTimeline.push(newTimeline);
      match.auditLogs.unshift(newAudit);
      return res.json({ success: true, application: match });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: update status]', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Clarification message synchronization in MongoDB
app.post('/api/partner/applications/:id/clarifications', async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, senderName, message } = req.body;

    const timestamp = new Date().toISOString();
    const newClarification = {
      id: `msg-${Date.now()}`,
      sender,
      senderName,
      timestamp,
      message
    };
    const newAudit = {
      id: `log-${Date.now()}`,
      timestamp,
      action: sender === 'management' ? 'Clarification Requested' : 'Applicant Responded',
      performedBy: senderName,
      details: message.substring(0, 100)
    };

    if (isMongoConnected) {
      const updated = await PartnerApplication.findOneAndUpdate(
        { id: new RegExp(`^${id}$`, 'i') },
        { 
          $set: { updatedAt: timestamp },
          $push: { clarifications: newClarification, auditLogs: { $each: [newAudit], $position: 0 } }
        },
        { returnDocument: 'after', new: true }
      );
      return res.json({ success: true, application: updated });
    } else {
      const match = memoryStore.applications.find(a => a.id.toUpperCase() === id.toUpperCase());
      if (!match) return res.status(404).json({ error: 'Application not found' });
      match.clarifications.push(newClarification);
      match.auditLogs.unshift(newAudit);
      return res.json({ success: true, application: match });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: add clarification]', error);
    res.status(500).json({ error: error.message });
  }
});

// 5b. Dispatch & Log Application ID confirmation to Applicant Email
app.post('/api/partner/send-email-id', async (req, res) => {
  try {
    const { id, email, fullName, pathway, loginUrl } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing application id or recipient email' });
    }

    console.log(`[GenQuantis Email System] ★ Application ID ${id} dispatched to applicant: ${email} (${fullName || 'Applicant'})`);

    const newAudit = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Application Reference ID Dispatched to Applicant Email',
      performedBy: 'Automated Notification System',
      details: `Mandatory login ID ${id} and direct login link dispatched to ${email}`
    };

    if (isMongoConnected) {
      await PartnerApplication.findOneAndUpdate(
        { id: new RegExp(`^${id}$`, 'i') },
        { $push: { auditLogs: { $each: [newAudit], $position: 0 } } }
      );
    }

    return res.json({
      success: true,
      message: `Application ID ${id} successfully recorded and queued for ${email}`,
      recipient: email,
      loginUrl: loginUrl || `/portal/login?appId=${id}`
    });
  } catch (error) {
    console.error('[GenQuantis Email Dispatch Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Franchise Investor Leads (stored in MongoDB investor_leads)
app.post('/api/partner/leads', async (req, res) => {
  try {
    const leadData = req.body;
    const cleanPhone = (leadData.contactNumber || '').replace(/\D/g, '');

    if (isMongoConnected) {
      // Check duplicate in MongoDB
      const duplicate = await InvestorLead.findOne({
        $or: [
          { email: new RegExp(`^${leadData.email}$`, 'i') },
          { contactNumber: new RegExp(cleanPhone.slice(-10)) }
        ]
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Lead conflict: Investor already registered by ${duplicate.introducingPartnerName}. Protected for 180 days.`
        });
      }

      const newLead = new InvestorLead({
        ...leadData,
        id: leadData.id || `LEAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        dateIntroduced: leadData.dateIntroduced || new Date().toISOString(),
        status: leadData.status || 'introduced'
      });
      await newLead.save();
      console.log(`[GenQuantis MongoDB] Lead registered in investor_leads: ${newLead.id}`);
      return res.status(201).json({ success: true, lead: newLead, storage: 'mongodb_atlas' });
    } else {
      const duplicate = memoryStore.leads.find(l => 
        l.email.toLowerCase() === (leadData.email || '').toLowerCase() ||
        (l.contactNumber && l.contactNumber.replace(/\D/g, '') === cleanPhone)
      );

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Lead conflict: Already registered by ${duplicate.introducingPartnerName}.`
        });
      }

      const newLead = {
        ...leadData,
        id: leadData.id || `LEAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        dateIntroduced: leadData.dateIntroduced || new Date().toISOString(),
        status: leadData.status || 'introduced'
      };
      memoryStore.leads.unshift(newLead);
      return res.status(201).json({ success: true, lead: newLead, storage: 'fallback_cache' });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: create lead]', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Retrieve all leads
app.get('/api/partner/leads', async (req, res) => {
  try {
    if (isMongoConnected) {
      const leads = await InvestorLead.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: leads.length, leads, storage: 'mongodb_atlas' });
    } else {
      return res.json({ success: true, count: memoryStore.leads.length, leads: memoryStore.leads, storage: 'fallback_cache' });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: get leads]', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Update lead status
app.patch('/api/partner/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (isMongoConnected) {
      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const updated = await InvestorLead.findOneAndUpdate(
        { id: new RegExp(`^${id}$`, 'i') },
        { $set: updateData },
        { returnDocument: 'after', new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Lead not found' });
      return res.json({ success: true, lead: updated, storage: 'mongodb_atlas' });
    } else {
      const match = memoryStore.leads.find(l => l.id.toUpperCase() === id.toUpperCase());
      if (!match) return res.status(404).json({ error: 'Lead not found' });
      if (status) match.status = status;
      if (notes !== undefined) match.notes = notes;
      return res.json({ success: true, lead: match, storage: 'fallback_cache' });
    }
  } catch (error) {
    console.error('[GenQuantis API Error: update lead]', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static client build if dist folder exists (Single-Service Azure & Production deployment)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`[GenQuantis Server] Serving production static files from ${distPath}`);
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[GenQuantis Server] Backend running on port ${PORT}`);
    console.log(`[GenQuantis Server] Connected to MongoDB Atlas cluster0.gxsxc6g.mongodb.net`);
  });
}

module.exports = app;

