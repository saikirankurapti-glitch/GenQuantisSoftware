import { PartnerApplication, InvestorLead, AuditLogEntry } from '@/types/partnerPortal';

const STORAGE_KEY_APPLICATIONS = 'genquantis_partner_applications_v1';
const STORAGE_KEY_LEADS = 'genquantis_investor_leads_v1';

// Base API URL configuration
export const getApiBaseUrl = (): string => {
  // When running locally in browser, ALWAYS use relative path so requests route through Vite dev proxy without CORS blocking
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Production Azure Backend
  return 'https://genquantissoftwarebackend-bseqe5e6e6fgdncx.westus3-01.azurewebsites.net';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api/partner`;

// Strip large base64 file data URLs before caching in localStorage (5MB browser quota protection)
function sanitizeApplicationForStorage(app: PartnerApplication): PartnerApplication {
  return {
    ...app,
    documents: (app.documents || []).map(doc => {
      const sanitized = { ...doc };
      if ((sanitized as any).fileDataUrl) {
        delete (sanitized as any).fileDataUrl;
      }
      return sanitized;
    })
  };
}

// Resilient localStorage write that catches QuotaExceededError and prevents app crash
function safeSetStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.number === -2147024882) {
      console.warn('[LocalStorage] Storage quota reached. Trimming cache to prevent crashes.');
      try {
        if (Array.isArray(data)) {
          // Keep only the 2 most recent dockets
          const trimmed = data.slice(0, 2);
          localStorage.setItem(key, JSON.stringify(trimmed));
        } else {
          localStorage.removeItem(key);
        }
      } catch (innerErr) {
        console.warn('[LocalStorage] Could not write trimmed cache. Continuing safely.', innerErr);
      }
    } else {
      console.warn('[LocalStorage Save]', err);
    }
  }
}

const SEED_APPLICATIONS: PartnerApplication[] = [
  {
    id: 'CQ-2026-904128',
    pathway: 'pan-india',
    createdAt: '2026-09-20T11:30:00Z',
    updatedAt: '2026-09-23T14:45:00Z',
    status: 'interview_scheduled',
    statusTimeline: [
      { status: 'submitted', label: 'Application Submitted', completedAt: '2026-09-20T11:30:00Z' },
      { status: 'screening', label: 'Initial Screening Passed', completedAt: '2026-09-21T10:00:00Z' },
      { status: 'document_verification', label: 'Documents Scrutinized', completedAt: '2026-09-22T16:15:00Z' },
      { status: 'due_diligence', label: 'Commercial Due Diligence', completedAt: '2026-09-23T09:30:00Z' },
      { status: 'interview_scheduled', label: 'Management Interview Scheduled', completedAt: '2026-09-23T14:45:00Z', note: 'Executive Interview scheduled with Dr. Dharani on Sept 25, 2026 at 3:00 PM IST.' }
    ],
    individual: {
      fullName: 'Vikramaditya Sengupta',
      nameAsPerGovtId: 'Vikramaditya Sengupta',
      dob: '1981-06-14',
      gender: 'Male',
      nationality: 'Indian',
      mobile: '+91 98450 12890',
      whatsapp: '+91 98450 12890',
      email: 'vikram.sengupta@apollomediagroup.in',
      residentialAddress: 'Tower B, 1402, Prestige Golfshire, Bangalore North',
      correspondenceAddress: 'Tower B, 1402, Prestige Golfshire, Bangalore North',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      pincode: '562110',
      educationalQualification: 'B.Tech (IIT Madras), MBA (ISB Hyderabad)',
      professionalQualification: 'Fellow Healthcare Leadership Council, Certified PMP',
      currentOccupation: 'Managing Director, Apex MedTech Ventures',
      totalExperienceYears: 22,
      businessExperienceYears: 16,
      healthcareExperienceYears: 12,
      franchiseExperienceYears: 8,
      channelPartnerExperienceYears: 10,
      existingBusinessInterests: 'Distribution of diagnostic imaging and AI ultrasound consoles in South & West India.',
      linkedinProfile: 'https://linkedin.com/in/vikram-sengupta-medtech',
      reference1Name: 'Dr. R. K. Natarajan',
      reference1Contact: '+91 98400 99881',
      reference1Relation: 'Former Vice President, Manipal Hospitals Group',
      reference2Name: 'Ananya Sharma',
      reference2Contact: '+91 99100 44552'
    },
    business: {
      isApplyingAsEntity: true,
      legalEntityName: 'Apex MedTech Solutions Private Limited',
      tradeBrandName: 'Apex Healthcare Distribution',
      entityType: 'Pvt Ltd',
      dateOfIncorporation: '2014-04-12',
      registeredOffice: '88/4, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
      operatingOffice: 'Bangalore, Mumbai, and Delhi Regional Offices',
      website: 'https://apexmedtechsolutions.in',
      corporateEmail: 'director@apexmedtechsolutions.in',
      telephone: '080-49210088',
      principalActivities: 'Pan-India medical devices, radiology PACS, and diagnostic clinic chains.',
      yearsInOperation: 12,
      promotersDirectors: 'Vikramaditya Sengupta (65%), Sunita Sengupta (35%)',
      keyManagement: 'Chief Operating Officer, Head of Regulatory Affairs, 4 Zonal VPs',
      teamStrength: 85,
      existingLocations: 'Bengaluru, Mumbai, New Delhi, Chennai, Hyderabad',
      healthcareDiagnosticExperience: 'Supplied diagnostics instrumentation to 420+ hospitals across India.',
      franchiseExperience: 'Operated regional diagnostic collection network with 60 centers.',
      channelPartnerExperience: 'Tier-1 master distributor for Philips Healthcare and Roche Diagnostics.',
      geographicPresence: 'Pan-India presence across all 6 geographical zones.',
      existingBusinessNetwork: 'Over 1,200 clinical touchpoints and 85 corporate hospital networks.',
      proposedTeamStrength: 35,
      infrastructureCapability: '4 regional warehousing hubs, temperature-controlled transit, 24/7 technical call center.',
      investmentCapacity: '₹10 Crores - ₹25 Crores',
      authorisedSignatoryName: 'Vikramaditya Sengupta',
      authorisedSignatoryDesignation: 'Managing Director',
      gstin: '29AAACA8821P1Z9',
      cinOrPan: 'U85110KA2014PTC073911'
    },
    territory: {
      isPanIndia: true,
      selectedStates: ['All Indian States & Union Territories'],
      notes: 'Applying for master Pan-India Channel Partnership across all zones.'
    },
    documents: [
      { id: 'doc-1', name: 'PAN Card (Corporate & Individual)', category: 'identity', fileName: 'Apex_PAN_Cards_Merged.pdf', fileSize: '2.1 MB', uploadedAt: '2026-09-20', status: 'verified', isMandatory: true },
      { id: 'doc-2', name: 'Aadhaar / Passport of Signatory', category: 'identity', fileName: 'Vikram_Passport_Copy.pdf', fileSize: '3.4 MB', uploadedAt: '2026-09-20', status: 'verified', isMandatory: true },
      { id: 'doc-3', name: 'Certificate of Incorporation & MOA', category: 'business', fileName: 'Apex_COI_MOA_AOA.pdf', fileSize: '8.2 MB', uploadedAt: '2026-09-20', status: 'verified', isMandatory: true },
      { id: 'doc-4', name: 'Audited Financials (Last 3 FYs)', category: 'business', fileName: 'Apex_Audited_FY23_FY25.pdf', fileSize: '14.5 MB', uploadedAt: '2026-09-20', status: 'verified', isMandatory: true },
      { id: 'doc-5', name: 'GST Registration Certificate', category: 'compliance', fileName: 'GST_Reg_Certificate.pdf', fileSize: '1.2 MB', uploadedAt: '2026-09-20', status: 'verified', isMandatory: true },
      { id: 'doc-6', name: 'Existing Channel Partnership Track Record', category: 'experience', fileName: 'Past_Performance_Accreditation.pdf', fileSize: '4.8 MB', uploadedAt: '2026-09-20', status: 'verified', isMandatory: false }
    ],
    clarifications: [
      {
        id: 'msg-1',
        sender: 'management',
        senderName: 'GenQuantis™ Scrutiny Board',
        timestamp: '2026-09-22T14:10:00Z',
        message: 'Dear Vikramaditya, please note that our executive interview will focus on your proposed Zonal Regional Channel Partner rollout schedule and the cold-chain logistics readiness for Tier-2 cities.'
      },
      {
        id: 'msg-2',
        sender: 'applicant',
        senderName: 'Vikramaditya Sengupta',
        timestamp: '2026-09-22T15:20:00Z',
        message: 'Understood. We have prepared an executive deck detailing our 18-month rollout roadmap across South and Western corridors. Looking forward to the interview.'
      }
    ],
    auditLogs: [
      { id: 'log-1', timestamp: '2026-09-20T11:30:00Z', action: 'Application Submitted', performedBy: 'Applicant', details: 'Pan-India Channel Partner application initiated with 6 supporting documents.' },
      { id: 'log-2', timestamp: '2026-09-21T10:00:00Z', action: 'Screening Passed', performedBy: 'Dr. Dharani (System)', details: 'Applicant meets Tier-1 eligibility thresholds.' },
      { id: 'log-3', timestamp: '2026-09-22T16:15:00Z', action: 'Documents Verified', performedBy: 'Legal Compliance Team', details: 'All corporate registrations and financial audits verified with MCA & GSTN.' },
      { id: 'log-4', timestamp: '2026-09-23T14:45:00Z', action: 'Interview Scheduled', performedBy: 'Ashwin Kumaar T', details: 'Executive interview calendar invitation dispatched.' }
    ],
    paymentStatus: 'pending',
    paymentDetails: {
      amount: 250000,
      taxes: 45000,
      totalAmount: 295000,
      invoiceNo: 'CQ/INV/2026/0891'
    },
    trainingStatus: 'modules_assigned',
    agreementStatus: 'drafting'
  },
  {
    id: 'CQ-2026-771904',
    pathway: 'regional',
    createdAt: '2026-09-18T09:15:00Z',
    updatedAt: '2026-09-23T16:00:00Z',
    status: 'partner_activated',
    statusTimeline: [
      { status: 'submitted', label: 'Application Submitted', completedAt: '2026-09-18T09:15:00Z' },
      { status: 'screening', label: 'Screening Completed', completedAt: '2026-09-19T11:00:00Z' },
      { status: 'document_verification', label: 'Documents Approved', completedAt: '2026-09-20T14:00:00Z' },
      { status: 'approved', label: 'Appointment Approved by GenQuantis™', completedAt: '2026-09-21T17:00:00Z' },
      { status: 'payment_completed', label: '₹2.5L Onboarding Fee Settled', completedAt: '2026-09-22T10:30:00Z' },
      { status: 'training_in_progress', label: 'Executive Training Completed', completedAt: '2026-09-23T12:00:00Z' },
      { status: 'partner_activated', label: 'Regional Partner Activated', completedAt: '2026-09-23T16:00:00Z', note: 'Authorized for Tamil Nadu & Puducherry Region.' }
    ],
    individual: {
      fullName: 'Dr. Meenakshi Sundaram',
      nameAsPerGovtId: 'Meenakshi Sundaram S',
      dob: '1984-11-23',
      gender: 'Female',
      nationality: 'Indian',
      mobile: '+91 94440 33819',
      whatsapp: '+91 94440 33819',
      email: 'dr.meenakshi@quantismedical.co.in',
      residentialAddress: '42, Boat Club Road, R.A. Puram, Chennai',
      correspondenceAddress: '42, Boat Club Road, R.A. Puram, Chennai',
      state: 'Tamil Nadu',
      district: 'Chennai',
      pincode: '600028',
      educationalQualification: 'MBBS, MD (Radiology), MBA Hospital Management',
      professionalQualification: 'Member Indian Radiological & Imaging Association',
      currentOccupation: 'Director, Sundaram Diagnostic Network',
      totalExperienceYears: 18,
      businessExperienceYears: 12,
      healthcareExperienceYears: 18,
      franchiseExperienceYears: 5,
      channelPartnerExperienceYears: 6,
      existingBusinessInterests: 'Chain of 8 automated pathology and ultrasound centers in Southern Tamil Nadu.',
      linkedinProfile: 'https://linkedin.com/in/dr-meenakshi-sundaram',
      reference1Name: 'Prof. K. Chandrasekhar',
      reference1Contact: '+91 98410 11223',
      reference1Relation: 'Head of Radiology, Madras Medical College'
    },
    business: {
      isApplyingAsEntity: true,
      legalEntityName: 'Sundaram Health Diagnostics LLP',
      tradeBrandName: 'Sundaram Quantis Diagnostics',
      entityType: 'LLP',
      dateOfIncorporation: '2018-02-14',
      registeredOffice: 'Plot 18, Old Mahabalipuram Road, Perungudi, Chennai 600096',
      operatingOffice: 'Chennai & Coimbatore',
      website: 'https://sundaramdiagnostics.com',
      corporateEmail: 'partner@sundaramdiagnostics.com',
      telephone: '044-24567890',
      principalActivities: 'Diagnostic imaging, molecular pathology, and preventive health screenings.',
      yearsInOperation: 8,
      teamStrength: 45,
      existingLocations: 'Chennai, Coimbatore, Madurai, Salem',
      healthcareDiagnosticExperience: 'Serving over 20,000 diagnostic patients monthly.',
      infrastructureCapability: 'Complete digital imaging setup with high-speed PACS backbone.',
      investmentCapacity: '₹3 Crores - ₹5 Crores',
      authorisedSignatoryName: 'Dr. Meenakshi Sundaram',
      authorisedSignatoryDesignation: 'Designated Partner',
      gstin: '33AABCS1234F1Z5',
      cinOrPan: 'AABCS1234F'
    },
    territory: {
      isPanIndia: false,
      selectedStates: ['Tamil Nadu', 'Puducherry'],
      notes: 'Regional Channel Partner appointment covering Tamil Nadu and Puducherry UT.'
    },
    documents: [
      { id: 'doc-1', name: 'PAN Card & Aadhaar', category: 'identity', fileName: 'Meenakshi_KYC.pdf', fileSize: '1.8 MB', uploadedAt: '2026-09-18', status: 'verified', isMandatory: true },
      { id: 'doc-2', name: 'LLP Agreement & Incorporation', category: 'business', fileName: 'LLP_Agreement_Incorporation.pdf', fileSize: '4.2 MB', uploadedAt: '2026-09-18', status: 'verified', isMandatory: true },
      { id: 'doc-3', name: 'PCPNDT & AERB Diagnostic Licences', category: 'compliance', fileName: 'Diagnostic_Registrations.pdf', fileSize: '6.5 MB', uploadedAt: '2026-09-18', status: 'verified', isMandatory: true }
    ],
    clarifications: [],
    auditLogs: [
      { id: 'log-10', timestamp: '2026-09-18T09:15:00Z', action: 'Application Filed', performedBy: 'Applicant', details: 'Regional Channel Partner application for Tamil Nadu & Puducherry.' },
      { id: 'log-11', timestamp: '2026-09-21T17:00:00Z', action: 'Appointment Approved', performedBy: 'GenQuantis™ Executive Board', details: 'Formally appointed as Regional Channel Partner.' },
      { id: 'log-12', timestamp: '2026-09-22T10:30:00Z', action: 'Payment Received', performedBy: 'Payment Gateway', details: '₹2,95,000 (Incl. 18% GST) settled successfully via HDFC PG. TransID: CQPG_9918237.' },
      { id: 'log-13', timestamp: '2026-09-23T16:00:00Z', action: 'Partner Activated', performedBy: 'Ashwin Kumaar T', details: 'Portal onboarding kit and Franchise Investor lead generator unlocked.' }
    ],
    paymentStatus: 'completed',
    paymentDetails: {
      amount: 250000,
      taxes: 45000,
      totalAmount: 295000,
      transactionId: 'CQPG_9918237_HDFC',
      paidAt: '2026-09-22T10:30:00Z',
      invoiceNo: 'CQ/INV/2026/0742'
    },
    trainingStatus: 'certified',
    agreementStatus: 'executed'
  },
  {
    id: 'CQ-2026-620184',
    pathway: 'franchise',
    createdAt: '2026-09-22T14:00:00Z',
    updatedAt: '2026-09-23T17:30:00Z',
    status: 'due_diligence',
    statusTimeline: [
      { status: 'submitted', label: 'Application Submitted', completedAt: '2026-09-22T14:00:00Z' },
      { status: 'screening', label: 'Preliminary Scrutiny Passed', completedAt: '2026-09-23T11:00:00Z' },
      { status: 'due_diligence', label: 'Commercial & Property Due Diligence', completedAt: '2026-09-23T17:30:00Z', note: 'Evaluating 3,200 sq.ft clinic site at Jubilee Hills, Hyderabad.' }
    ],
    individual: {
      fullName: 'Rajeshwar Reddy K',
      nameAsPerGovtId: 'Rajeshwar Reddy K',
      dob: '1978-08-19',
      gender: 'Male',
      nationality: 'Indian',
      mobile: '+91 99890 55412',
      whatsapp: '+91 99890 55412',
      email: 'rreddy@reddyproperties.in',
      residentialAddress: 'Villa 14, Boulder Hills, Gachibowli, Hyderabad',
      correspondenceAddress: 'Villa 14, Boulder Hills, Gachibowli, Hyderabad',
      state: 'Telangana',
      district: 'Hyderabad',
      pincode: '500032',
      educationalQualification: 'MS Computer Science, B.E.',
      professionalQualification: 'Real Estate Developer & Healthcare Angel Investor',
      currentOccupation: 'Chairman, Reddy Infrastructure & Healthcare Assets',
      totalExperienceYears: 24,
      businessExperienceYears: 20,
      healthcareExperienceYears: 7,
      franchiseExperienceYears: 6,
      channelPartnerExperienceYears: 2,
      existingBusinessInterests: 'Owns commercial medical complexes and primary health center leases in Hyderabad.',
      reference1Name: 'Dr. G. Venkat Rao',
      reference1Contact: '+91 98490 66778',
      reference1Relation: 'Chief of Surgical Gastroenterology, AIG Hospitals'
    },
    business: {
      isApplyingAsEntity: true,
      legalEntityName: 'Reddy Medi-Infra Private Limited',
      tradeBrandName: 'GenQuantis Smart Clinic Hyderabad',
      entityType: 'Pvt Ltd',
      dateOfIncorporation: '2019-09-10',
      registeredOffice: 'Road No 36, Jubilee Hills, Hyderabad 500033',
      operatingOffice: 'Jubilee Hills, Hyderabad',
      teamStrength: 18,
      infrastructureCapability: '3,200 sq.ft ground-floor corner commercial property on main arterial road with 15-car parking.',
      investmentCapacity: '₹1.5 Crores - ₹2.5 Crores',
      authorisedSignatoryName: 'Rajeshwar Reddy K',
      authorisedSignatoryDesignation: 'Director',
      gstin: '36AABCR9912K1Z0'
    },
    territory: {
      isPanIndia: false,
      selectedStates: ['Telangana'],
      notes: 'Targeting GenQuantis Flagship AI Diagnostic & Smart Clinic Franchise in Jubilee Hills / Banjara Hills cluster.'
    },
    documents: [
      { id: 'doc-1', name: 'PAN & Aadhaar', category: 'identity', fileName: 'Rajeshwar_KYC.pdf', fileSize: '2.0 MB', uploadedAt: '2026-09-22', status: 'verified', isMandatory: true },
      { id: 'doc-2', name: 'Property Ownership / Long Lease Deed', category: 'business', fileName: 'Jubilee_Hills_Lease_Deed.pdf', fileSize: '9.1 MB', uploadedAt: '2026-09-22', status: 'verified', isMandatory: true },
      { id: 'doc-3', name: 'Bank Solvency & Net Worth Certificate', category: 'compliance', fileName: 'Bank_Solvency_Certificate.pdf', fileSize: '1.4 MB', uploadedAt: '2026-09-22', status: 'verified', isMandatory: true }
    ],
    clarifications: [],
    auditLogs: [
      { id: 'log-21', timestamp: '2026-09-22T14:00:00Z', action: 'Franchise Application Received', performedBy: 'Applicant', details: 'Targeting Hyderabad Tier-1 Diagnostic Franchise center.' }
    ],
    paymentStatus: 'exempt', // Franchise investor agreements are handled directly by GenQuantis corporate
    trainingStatus: 'not_started',
    agreementStatus: 'drafting'
  }
];

const SEED_LEADS: InvestorLead[] = [
  {
    id: 'LEAD-2026-001',
    investorName: 'Kishore Kumar Agarwal',
    entityName: 'Agarwal Diagnostics Care',
    contactNumber: '+91 98310 44521',
    email: 'kishore@agarwalmed.com',
    territory: 'Kolkata Central & Salt Lake',
    dateIntroduced: '2026-09-22T10:00:00Z',
    status: 'screening',
    introducingPartnerId: 'CQ-2026-904128',
    introducingPartnerName: 'Apex MedTech Solutions (Vikramaditya Sengupta)',
    investmentBudget: '₹1.5 Crores',
    notes: 'Existing ultrasound and blood collection chain looking to upgrade to GenQuantis AI Diagnostics.'
  },
  {
    id: 'LEAD-2026-002',
    investorName: 'Dr. Anand Kumar Swaminathan',
    entityName: 'Swaminathan Healthcare Assets',
    contactNumber: '+91 94432 77810',
    email: 'anand@swaminathanhealth.org',
    territory: 'Coimbatore & Tiruppur',
    dateIntroduced: '2026-09-23T11:30:00Z',
    status: 'due_diligence',
    introducingPartnerId: 'CQ-2026-771904',
    introducingPartnerName: 'Sundaram Health Diagnostics (Dr. Meenakshi)',
    investmentBudget: '₹2.0 Crores',
    notes: 'High net-worth orthopaedic surgical center seeking integrated AI diagnostics wing.'
  }
];

export const PartnerStore = {
  getApplications: (): PartnerApplication[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading applications from localStorage', e);
    }
    // Seed if empty
    safeSetStorage(STORAGE_KEY_APPLICATIONS, SEED_APPLICATIONS);
    return SEED_APPLICATIONS;
  },

  getApplicationById: (id: string): PartnerApplication | undefined => {
    const list = PartnerStore.getApplications();
    return list.find(app => app.id.toUpperCase() === id.toUpperCase());
  },

  saveApplication: (app: PartnerApplication): void => {
    const sanitizedApp = sanitizeApplicationForStorage(app);
    const list = PartnerStore.getApplications();
    const index = list.findIndex(item => item.id === app.id);
    if (index >= 0) {
      list[index] = { ...sanitizedApp, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(sanitizedApp);
    }
    safeSetStorage(STORAGE_KEY_APPLICATIONS, list);

    // Asynchronously synchronize full docket with MongoDB Atlas (fire & forget)
    fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    }).catch(() => {
      // Backend may be offline during dev; silent fallback
    });
  },

  saveApplicationAsync: async (app: PartnerApplication): Promise<{ success: boolean; storage: string }> => {
    // Save sanitized copy locally without throwing QuotaExceededError
    PartnerStore.saveApplication(app);

    try {
      const res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, storage: data.storage || 'mongodb_atlas' };
      }
    } catch (e) {
      // Backend server is not running on port 5000; safely acknowledge local storage
    }
    return { success: true, storage: 'local_cache' };
  },

  fetchApplicationByIdFromMongoDB: async (id: string): Promise<PartnerApplication | null> => {
    try {
      const res = await fetch(`${API_URL}/applications/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.application) {
          const localList = PartnerStore.getApplications();
          const idx = localList.findIndex(a => a.id.toUpperCase() === id.toUpperCase());
          const sanitized = sanitizeApplicationForStorage(data.application);
          if (idx >= 0) {
            localList[idx] = sanitized;
          } else {
            localList.unshift(sanitized);
          }
          safeSetStorage(STORAGE_KEY_APPLICATIONS, localList);
          // Return FULL application including fileDataUrl so admin can view documents
          return data.application;
        }
      }
    } catch (e) {
      // silent fallback
    }
    return null;
  },

  fetchFromMongoDB: async (): Promise<PartnerApplication[]> => {
    try {
      const res = await fetch(`${API_URL}/applications`);
      if (res.ok) {
        const data = await res.json();
        if (data.applications && Array.isArray(data.applications) && data.applications.length > 0) {
          const localList = PartnerStore.getApplications();
          const mergedMap = new Map<string, PartnerApplication>();
          localList.forEach(a => mergedMap.set(a.id, a));
          
          // Keep raw MongoDB application with fileDataUrl intact in memory
          data.applications.forEach((a: PartnerApplication) => {
            const existing = mergedMap.get(a.id);
            if (existing) {
              const mergedDocs = (a.documents || []).map(doc => {
                const existDoc = (existing.documents || []).find(d => d.id === doc.id);
                return {
                  ...doc,
                  fileDataUrl: doc.fileDataUrl || existDoc?.fileDataUrl
                };
              });
              mergedMap.set(a.id, { ...a, documents: mergedDocs });
            } else {
              mergedMap.set(a.id, a);
            }
          });
          
          const merged = Array.from(mergedMap.values());
          // Only sanitize when writing to localStorage to prevent QuotaExceededError
          safeSetStorage(STORAGE_KEY_APPLICATIONS, merged.map(sanitizeApplicationForStorage));
          return merged;
        }
      }
    } catch (e) {
      // Backend offline; safely fallback to local cache
    }
    return PartnerStore.getApplications();
  },

  updateStatus: (appId: string, status: PartnerApplication['status'], label: string, note?: string, performedBy = 'GenQuantis Management'): PartnerApplication | null => {
    const app = PartnerStore.getApplicationById(appId);
    if (!app) return null;

    const timestamp = new Date().toISOString();
    app.status = status;
    app.updatedAt = timestamp;
    app.statusTimeline.push({
      status,
      label,
      completedAt: timestamp,
      note
    });

    app.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      action: `Status Updated to ${label}`,
      performedBy,
      details: note || `Application advanced to status: ${status}`
    });

    PartnerStore.saveApplication(app);

    // Push update to MongoDB
    fetch(`${API_URL}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, label, note, performedBy })
    }).catch(err => console.warn('[MongoDB Status Sync]', err.message));

    return app;
  },

  addClarification: (appId: string, sender: 'management' | 'applicant', senderName: string, message: string): PartnerApplication | null => {
    const app = PartnerStore.getApplicationById(appId);
    if (!app) return null;

    const timestamp = new Date().toISOString();
    app.clarifications.push({
      id: `msg-${Date.now()}`,
      sender,
      senderName,
      timestamp,
      message
    });

    app.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      action: sender === 'management' ? 'Clarification Requested' : 'Applicant Responded',
      performedBy: senderName,
      details: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    });

    PartnerStore.saveApplication(app);

    // Push clarification to MongoDB
    fetch(`${API_URL}/applications/${appId}/clarifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, senderName, message })
    }).catch(err => console.warn('[MongoDB Clarification Sync]', err.message));

    return app;
  },

  completePayment: (appId: string, transactionId: string): PartnerApplication | null => {
    const app = PartnerStore.getApplicationById(appId);
    if (!app) return null;

    const timestamp = new Date().toISOString();
    app.paymentStatus = 'completed';
    app.paymentDetails = {
      amount: 250000,
      taxes: 45000,
      totalAmount: 295000,
      transactionId,
      utrNumber: transactionId,
      paidAt: timestamp,
      invoiceNo: `CQ/INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
    };

    app.status = 'payment_completed';
    app.statusTimeline.push({
      status: 'payment_completed',
      label: '₹2.5L Onboarding Fee Settled',
      completedAt: timestamp,
      note: `Transaction ID: ${transactionId}. Onboarding materials and partner training curriculum unlocked.`
    });

    app.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      action: 'Onboarding Fee Paid',
      performedBy: 'Finance Directorate (SBI Manual Verification)',
      details: `Settlement of ₹2,95,000 (Incl. 18% GST). Txn/UTR: ${transactionId}`
    });

    PartnerStore.saveApplication(app);
    return app;
  },

  submitPaymentProof: (
    appId: string, 
    details: {
      utrNumber: string;
      paymentMode: string;
      payerName: string;
      payerBank?: string;
      paymentProofUrl?: string;
      paymentProofName?: string;
    }
  ): PartnerApplication | null => {
    const app = PartnerStore.getApplicationById(appId);
    if (!app) return null;

    const timestamp = new Date().toISOString();
    app.paymentStatus = 'submitted';
    app.paymentDetails = {
      ...(app.paymentDetails || {
        amount: 250000,
        taxes: 45000,
        totalAmount: 295000,
      }),
      transactionId: details.utrNumber,
      utrNumber: details.utrNumber,
      paymentMode: details.paymentMode,
      payerName: details.payerName,
      payerBank: details.payerBank,
      submittedAt: timestamp,
      paymentProofUrl: details.paymentProofUrl,
      paymentProofName: details.paymentProofName,
      adminNote: undefined
    };

    app.statusTimeline.push({
      status: 'payment_pending',
      label: 'Onboarding Payment Submitted for Verification',
      completedAt: timestamp,
      note: `Bank transfer of ₹2,95,000 submitted via ${details.paymentMode}. UTR: ${details.utrNumber}. Verification pending by Finance Directorate.`
    });

    app.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      action: 'Payment Submitted by Applicant',
      performedBy: details.payerName || app.individual.fullName || 'Applicant',
      details: `Submitted payment UTR ${details.utrNumber} (${details.paymentMode}) for ₹2,95,000 into SBI A/C 45216693371.`
    });

    PartnerStore.saveApplication(app);
    return app;
  },

  verifyPayment: (appId: string, adminName: string = 'Finance Directorate', note?: string): PartnerApplication | null => {
    const app = PartnerStore.getApplicationById(appId);
    if (!app) return null;

    const timestamp = new Date().toISOString();
    app.paymentStatus = 'completed';
    const invoiceNo = `CQ/INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

    app.paymentDetails = {
      ...(app.paymentDetails || {
        amount: 250000,
        taxes: 45000,
        totalAmount: 295000,
      }),
      paidAt: timestamp,
      verifiedAt: timestamp,
      verifiedBy: adminName,
      invoiceNo,
      adminNote: note
    };

    app.status = 'payment_completed';
    app.statusTimeline.push({
      status: 'payment_completed',
      label: '₹2.5L Onboarding Fee Verified & Settled',
      completedAt: timestamp,
      note: `Payment of ₹2,95,000 manually reconciled and verified in State Bank of India A/C 45216693371. Invoice: ${invoiceNo}.`
    });

    app.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      action: 'Payment Manually Verified by Admin',
      performedBy: adminName,
      details: `Reconciled ₹2,95,000 in SBI A/C 45216693371. UTR: ${app.paymentDetails.utrNumber || app.paymentDetails.transactionId}. Invoice: ${invoiceNo}.`
    });

    PartnerStore.saveApplication(app);
    return app;
  },

  rejectPayment: (appId: string, reason: string, adminName: string = 'Finance Directorate'): PartnerApplication | null => {
    const app = PartnerStore.getApplicationById(appId);
    if (!app) return null;

    const timestamp = new Date().toISOString();
    app.paymentStatus = 'rejected';
    if (app.paymentDetails) {
      app.paymentDetails.adminNote = reason;
    }

    app.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      action: 'Payment Discrepancy Flagged',
      performedBy: adminName,
      details: `Payment reference rejected/flagged. Reason: ${reason}`
    });

    PartnerStore.saveApplication(app);
    return app;
  },

  // Leads
  getLeads: (): InvestorLead[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEADS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading leads from localStorage', e);
    }
    safeSetStorage(STORAGE_KEY_LEADS, SEED_LEADS);
    return SEED_LEADS;
  },

  registerLead: (lead: Omit<InvestorLead, 'id' | 'dateIntroduced' | 'status'>): { success: boolean; message: string; lead?: InvestorLead } => {
    const leads = PartnerStore.getLeads();
    
    // Anti-duplication check by phone or email
    const duplicate = leads.find(l => 
      l.contactNumber.replace(/\D/g, '') === lead.contactNumber.replace(/\D/g, '') ||
      l.email.toLowerCase() === lead.email.toLowerCase()
    );

    if (duplicate) {
      return {
        success: false,
        message: `Lead conflict detected: This investor was already registered by ${duplicate.introducingPartnerName} on ${new Date(duplicate.dateIntroduced).toLocaleDateString()}. Under GenQuantis lead protection rules, duplicate registrations are protected for 180 days.`
      };
    }

    const newLead: InvestorLead = {
      ...lead,
      id: `LEAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dateIntroduced: new Date().toISOString(),
      status: 'introduced'
    };

    leads.unshift(newLead);
    safeSetStorage(STORAGE_KEY_LEADS, leads);

    // Push to MongoDB
    fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead)
    }).catch(() => {
      // offline fallback
    });

    return {
      success: true,
      message: `Franchise Investor Lead successfully registered with Reference ${newLead.id}. Priority territory rights logged for GenQuantis review.`,
      lead: newLead
    };
  },

  updateLeadStatus: (
    leadId: string, 
    status: InvestorLead['status'], 
    notes?: string
  ): InvestorLead | null => {
    const leads = PartnerStore.getLeads();
    const idx = leads.findIndex(l => l.id.toUpperCase() === leadId.toUpperCase());
    if (idx === -1) return null;

    leads[idx].status = status;
    if (notes !== undefined) {
      leads[idx].notes = notes;
    }

    safeSetStorage(STORAGE_KEY_LEADS, leads);

    // Synchronize lead status with MongoDB Atlas
    fetch(`${API_URL}/leads/${encodeURIComponent(leadId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    }).catch(() => {
      // offline fallback
    });

    return leads[idx];
  },

  fetchLeadsFromMongoDB: async (): Promise<InvestorLead[]> => {
    try {
      const res = await fetch(`${API_URL}/leads`);
      if (res.ok) {
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          const localLeads = PartnerStore.getLeads();
          const leadMap = new Map<string, InvestorLead>();
          localLeads.forEach(l => leadMap.set(l.id, l));
          data.leads.forEach((l: InvestorLead) => leadMap.set(l.id, l));
          const merged = Array.from(leadMap.values());
          safeSetStorage(STORAGE_KEY_LEADS, merged);
          return merged;
        }
      }
    } catch (e) {
      // offline fallback
    }
    return PartnerStore.getLeads();
  },

  checkMongoDBHealth: async (): Promise<{ online: boolean; mongodb?: string; database?: string; count?: { applications: number; leads: number } }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          mongodb: data.mongodb,
          database: data.activeDatabase,
          count: data.stats
        };
      }
    } catch (e) {
      // Backend server is starting or not currently reachable
    }
    return { online: false };
  }
};
