export type PathwayType = 'pan-india' | 'regional' | 'franchise';

export type ApplicationStatus = 
  | 'submitted'
  | 'screening'
  | 'document_verification'
  | 'due_diligence'
  | 'clarification_requested'
  | 'interview_scheduled'
  | 'management_review'
  | 'approved'
  | 'rejected'
  | 'agreement_pending'
  | 'payment_pending'
  | 'payment_completed'
  | 'training_in_progress'
  | 'partner_activated';

export interface TerritorySelection {
  isPanIndia: boolean;
  selectedStates: string[];
  notes?: string;
}

export interface DocumentUpload {
  id: string;
  name: string;
  category: 'identity' | 'address' | 'qualification' | 'experience' | 'business' | 'compliance' | 'photo';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected' | 'clarification_needed';
  isMandatory: boolean;
  notes?: string;
  rejectionReason?: string;
  fileDataUrl?: string;
  mimeType?: string;
}

export interface IndividualProfile {
  fullName: string;
  nameAsPerGovtId: string;
  dob: string;
  gender: string;
  nationality: string;
  photoUrl?: string;
  mobile: string;
  whatsapp: string;
  email: string;
  residentialAddress: string;
  correspondenceAddress: string;
  state: string;
  district: string;
  pincode: string;
  educationalQualification: string;
  professionalQualification: string;
  currentOccupation: string;
  totalExperienceYears: number;
  businessExperienceYears: number;
  healthcareExperienceYears: number;
  franchiseExperienceYears: number;
  channelPartnerExperienceYears: number;
  existingBusinessInterests: string;
  linkedinProfile?: string;
  reference1Name: string;
  reference1Contact: string;
  reference1Relation: string;
  reference2Name?: string;
  reference2Contact?: string;
}

export interface BusinessProfile {
  isApplyingAsEntity: boolean;
  legalEntityName?: string;
  tradeBrandName?: string;
  entityType?: 'Pvt Ltd' | 'LLP' | 'Partnership' | 'Sole Proprietorship' | 'Public Ltd' | 'Trust/Society' | 'Other';
  dateOfIncorporation?: string;
  registeredOffice?: string;
  operatingOffice?: string;
  website?: string;
  corporateEmail?: string;
  telephone?: string;
  principalActivities?: string;
  yearsInOperation?: number;
  promotersDirectors?: string;
  keyManagement?: string;
  teamStrength?: number;
  existingLocations?: string;
  healthcareDiagnosticExperience?: string;
  franchiseExperience?: string;
  channelPartnerExperience?: string;
  geographicPresence?: string;
  existingBusinessNetwork?: string;
  proposedTeamStrength?: number;
  infrastructureCapability?: string;
  investmentCapacity?: string;
  authorisedSignatoryName?: string;
  authorisedSignatoryDesignation?: string;
  gstin?: string;
  cinOrPan?: string;
}

export interface ClarificationMessage {
  id: string;
  sender: 'management' | 'applicant';
  senderName: string;
  timestamp: string;
  message: string;
  attachmentName?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
}

export interface InvestorLead {
  id: string;
  investorName: string;
  entityName?: string;
  contactNumber: string;
  email: string;
  territory: string;
  dateIntroduced: string;
  status: 'introduced' | 'screening' | 'due_diligence' | 'genquantis_review' | 'approved' | 'rejected' | 'agreement_signed';
  introducingPartnerId: string;
  introducingPartnerName: string;
  investmentBudget: string;
  notes?: string;
}

export interface PartnerApplication {
  id: string; // e.g. CQ-2026-889102
  pathway: PathwayType;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  statusTimeline: {
    status: ApplicationStatus;
    label: string;
    completedAt?: string;
    note?: string;
  }[];
  individual: IndividualProfile;
  business: BusinessProfile;
  territory: TerritorySelection;
  documents: DocumentUpload[];
  declarations?: {
    truthfulDisclosure: boolean;
    noRoiGuaranteeAgreed: boolean;
    noFranchiseAuthorityAgreed: boolean;
    antiFraudConsent: boolean;
    privacyPolicyConsent: boolean;
  };
  clarifications: ClarificationMessage[];
  auditLogs: AuditLogEntry[];
  paymentStatus: 'unbilled' | 'pending' | 'submitted' | 'completed' | 'rejected' | 'exempt';
  paymentDetails?: {
    amount: number;
    taxes: number;
    totalAmount: number;
    transactionId?: string;
    utrNumber?: string;
    paymentMode?: string;
    payerName?: string;
    payerBank?: string;
    paidAt?: string;
    submittedAt?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    invoiceNo?: string;
    paymentProofUrl?: string;
    paymentProofName?: string;
    adminNote?: string;
  };
  trainingStatus?: 'not_started' | 'modules_assigned' | 'in_progress' | 'certified';
  agreementStatus?: 'drafting' | 'sent_for_signature' | 'executed';
  assignedRegionalPartnersCount?: number;
}

export interface OfficialBankDetails {
  accountNumber: string;
  bankName: string;
  holderName: string;
  ifscCode: string;
  branch: string;
  contactNumber: string;
  accountType: string;
}

export const OFFICIAL_BANK_DETAILS: OfficialBankDetails = {
  accountNumber: '45216693371',
  bankName: 'State Bank of India',
  holderName: 'GENQUANTIS PRIVATE LIMITED',
  ifscCode: 'SBIN0032241',
  branch: 'KPHB, HYDERABAD - 500072',
  contactNumber: '7036951155',
  accountType: 'Current Account'
};
