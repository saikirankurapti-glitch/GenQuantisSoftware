const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
  fileName: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  uploadedAt: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  isMandatory: { type: Boolean, default: false },
  notes: { type: String },
  rejectionReason: { type: String },
  fileDataUrl: { type: String },
  mimeType: { type: String }
}, { _id: false });

const TimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  label: { type: String, required: true },
  completedAt: { type: String },
  note: { type: String }
}, { _id: false });

const ClarificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, enum: ['management', 'applicant'], required: true },
  senderName: { type: String, required: true },
  timestamp: { type: String, required: true },
  message: { type: String, required: true }
}, { _id: false });

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  timestamp: { type: String, required: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  details: { type: String, required: true }
}, { _id: false });

const PartnerApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  pathway: { 
    type: String, 
    enum: ['pan-india', 'regional', 'franchise'], 
    required: true, 
    index: true 
  },
  status: { 
    type: String, 
    default: 'submitted',
    index: true
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  statusTimeline: [TimelineSchema],
  
  individual: {
    fullName: { type: String, required: true },
    nameAsPerGovtId: { type: String },
    dob: { type: String },
    gender: { type: String },
    nationality: { type: String },
    mobile: { type: String, required: true },
    whatsapp: { type: String },
    email: { type: String, required: true, index: true },
    residentialAddress: { type: String },
    correspondenceAddress: { type: String },
    state: { type: String },
    district: { type: String },
    pincode: { type: String },
    educationalQualification: { type: String },
    professionalQualification: { type: String },
    currentOccupation: { type: String },
    totalExperienceYears: { type: Number, default: 0 },
    businessExperienceYears: { type: Number, default: 0 },
    healthcareExperienceYears: { type: Number, default: 0 },
    franchiseExperienceYears: { type: Number, default: 0 },
    channelPartnerExperienceYears: { type: Number, default: 0 },
    existingBusinessInterests: { type: String },
    linkedinProfile: { type: String },
    reference1Name: { type: String },
    reference1Contact: { type: String },
    reference1Relation: { type: String },
    reference2Name: { type: String },
    reference2Contact: { type: String }
  },

  business: {
    isApplyingAsEntity: { type: Boolean, default: true },
    legalEntityName: { type: String },
    tradeBrandName: { type: String },
    entityType: { type: String },
    dateOfIncorporation: { type: String },
    registeredOffice: { type: String },
    operatingOffice: { type: String },
    website: { type: String },
    corporateEmail: { type: String },
    telephone: { type: String },
    principalActivities: { type: String },
    yearsInOperation: { type: Number, default: 0 },
    promotersDirectors: { type: String },
    keyManagement: { type: String },
    teamStrength: { type: Number, default: 0 },
    existingLocations: { type: String },
    healthcareDiagnosticExperience: { type: String },
    franchiseExperience: { type: String },
    channelPartnerExperience: { type: String },
    geographicPresence: { type: String },
    existingBusinessNetwork: { type: String },
    proposedTeamStrength: { type: Number, default: 0 },
    infrastructureCapability: { type: String },
    investmentCapacity: { type: String },
    authorisedSignatoryName: { type: String },
    authorisedSignatoryDesignation: { type: String },
    gstin: { type: String },
    cinOrPan: { type: String }
  },

  territory: {
    isPanIndia: { type: Boolean, default: false },
    selectedStates: [{ type: String }],
    notes: { type: String }
  },

  documents: [DocumentSchema],
  declarations: {
    truthfulDisclosure: { type: Boolean, default: true },
    noRoiGuaranteeAgreed: { type: Boolean, default: true },
    noFranchiseAuthorityAgreed: { type: Boolean, default: true },
    antiFraudConsent: { type: Boolean, default: true },
    privacyPolicyConsent: { type: Boolean, default: true }
  },
  clarifications: [ClarificationSchema],
  auditLogs: [AuditLogSchema],

  paymentStatus: { 
    type: String, 
    enum: ['unbilled', 'pending', 'completed', 'exempt'],
    default: 'pending'
  },
  paymentDetails: {
    amount: { type: Number },
    taxes: { type: Number },
    totalAmount: { type: Number },
    transactionId: { type: String },
    paidAt: { type: String },
    invoiceNo: { type: String }
  },
  trainingStatus: { type: String, default: 'not_started' },
  agreementStatus: { type: String, default: 'drafting' }
}, {
  timestamps: true,
  collection: 'partner_applications'
});

module.exports = mongoose.model('PartnerApplication', PartnerApplicationSchema);
