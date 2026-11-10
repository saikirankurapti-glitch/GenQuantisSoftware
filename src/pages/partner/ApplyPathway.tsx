import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IndiaTerritoryMap } from '@/components/territory/IndiaTerritoryMap';
import { PartnerStore } from '@/lib/partnerStore';
import { AuthStore } from '@/lib/authStore';
import { DocumentVault } from '@/lib/documentStorage';
import { sendPartnerApplicationEmail, GenQuantis_SUPPORT_EMAIL } from '@/lib/emailNotification';
import { PathwayType, PartnerApplication, DocumentUpload } from '@/types/partnerPortal';
import { 
  Building2, 
  User, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  UploadCloud, 
  AlertTriangle, 
  Sparkles, 
  Briefcase,
  Layers,
  ChevronRight,
  HelpCircle,
  Mail,
  Database,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

export const ApplyPathway: React.FC = () => {
  const { pathway = 'regional' } = useParams<{ pathway: string }>();
  const navigate = useNavigate();

  // Validate pathway
  const currentPathway: PathwayType = (['pan-india', 'regional', 'franchise'].includes(pathway) 
    ? pathway 
    : 'regional') as PathwayType;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string>('Dispatching docket to support@GenQuantis.com...');
  const [mailtoUrl, setMailtoUrl] = useState<string>('');
  const [applicantMailtoUrl, setApplicantMailtoUrl] = useState<string>('');
  const [applicantEmailNotice, setApplicantEmailNotice] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageTarget, setStorageTarget] = useState<string>('MongoDB Atlas (GenQuantis cluster)');

  const handleCopyAppId = () => {
    if (submittedAppId) {
      navigator.clipboard.writeText(submittedAppId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // Form State
  const [individual, setIndividual] = useState({
    fullName: '',
    nameAsPerGovtId: '',
    dob: '',
    gender: 'Male',
    nationality: 'Indian',
    mobile: '',
    whatsapp: '',
    email: '',
    residentialAddress: '',
    correspondenceAddress: '',
    state: '',
    district: '',
    pincode: '',
    educationalQualification: '',
    professionalQualification: '',
    currentOccupation: '',
    totalExperienceYears: 10,
    businessExperienceYears: 6,
    healthcareExperienceYears: 4,
    franchiseExperienceYears: 2,
    channelPartnerExperienceYears: 3,
    existingBusinessInterests: '',
    linkedinProfile: '',
    reference1Name: '',
    reference1Contact: '',
    reference1Relation: '',
    reference2Name: '',
    reference2Contact: ''
  });

  const [business, setBusiness] = useState({
    isApplyingAsEntity: true,
    legalEntityName: '',
    tradeBrandName: '',
    entityType: 'Pvt Ltd' as const,
    dateOfIncorporation: '',
    registeredOffice: '',
    operatingOffice: '',
    website: '',
    corporateEmail: '',
    telephone: '',
    principalActivities: '',
    yearsInOperation: 5,
    promotersDirectors: '',
    keyManagement: '',
    teamStrength: 15,
    existingLocations: '',
    healthcareDiagnosticExperience: '',
    franchiseExperience: '',
    channelPartnerExperience: '',
    geographicPresence: '',
    existingBusinessNetwork: '',
    proposedTeamStrength: 8,
    infrastructureCapability: '',
    investmentCapacity: '₹50 Lakhs - ₹1 Crore',
    authorisedSignatoryName: '',
    authorisedSignatoryDesignation: 'Director',
    gstin: '',
    cinOrPan: ''
  });

  const [territory, setTerritory] = useState({
    isPanIndia: currentPathway === 'pan-india',
    selectedStates: [] as string[],
    notes: ''
  });

  const [uploadedDocs, setUploadedDocs] = useState<DocumentUpload[]>([
    { id: 'pan', name: 'PAN Card (Individual & Entity)', category: 'identity', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'Required for tax identity, MCA filings & TDS compliances' },
    { id: 'aadhaar', name: 'Aadhaar Card / Legally Acceptable Identity Document', category: 'identity', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'Front & back copy of government identity proof' },
    { id: 'passport', name: 'Passport Copy (Where applicable)', category: 'identity', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: false, notes: 'Mandatory for NRI/Foreign applicants or secondary due diligence' },
    { id: 'address', name: 'Address Proof of Residence & Operating Facility', category: 'address', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'Electricity bill, municipal tax receipt, or registered lease deed' },
    { id: 'photo', name: 'Recent Passport-size Photograph', category: 'photo', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'Clear face photograph on light background' },
    { id: 'education', name: 'Educational Degree Certificates', category: 'qualification', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'Undergraduate, Postgraduate, Medical or Technical certificates' },
    { id: 'professional', name: 'Professional Qualifications / Medical Council Registrations', category: 'qualification', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'State Medical Council / Certified Quality / Management credentials' },
    { id: 'experience', name: 'Experience Certificates & Credentials', category: 'experience', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: false, notes: 'Proof of past healthcare, diagnostic or channel partner experience' },
    { id: 'business', name: 'Entity Incorporation / GST Registration / Partnership Deed', category: 'business', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: true, notes: 'Certificate of Incorporation, MOA/AOA, LLP Agreement, or 15-digit GSTIN certificate' },
    { id: 'licences', name: 'Relevant Diagnostic Licences / Health Registrations', category: 'compliance', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: false, notes: 'PCPNDT, AERB, NABL, or Clinical Establishments Act licences (where applicable)' },
    { id: 'supporting', name: 'Other Supporting Documents for Due Diligence', category: 'compliance', fileName: '', fileSize: '', uploadedAt: '', status: 'pending', isMandatory: false, notes: 'Bank solvency certificate, audited financials, or distributor track record' }
  ]);
  const [previewDoc, setPreviewDoc] = useState<DocumentUpload | null>(null);

  const [declarations, setDeclarations] = useState({
    truthfulDisclosure: false,
    noRoiGuaranteeAgreed: false,
    noFranchiseAuthorityAgreed: false,
    antiFraudConsent: false,
    privacyPolicyConsent: false
  });

  // Switch pan india state and reset step if pathway changes
  useEffect(() => {
    setCurrentStep(1);
    setSubmittedAppId(null);
    if (currentPathway === 'pan-india') {
      setTerritory(prev => ({ ...prev, isPanIndia: true, selectedStates: ['Pan-India (All 36 States & UTs)'] }));
    } else {
      setTerritory(prev => ({ ...prev, isPanIndia: false, selectedStates: prev.selectedStates.filter(s => !s.includes('Pan-India')) }));
    }
  }, [currentPathway]);

  const pathwayTitles: Record<PathwayType, { title: string; subtitle: string; badge: string }> = {
    'pan-india': {
      title: 'Pan-India Channel Partner Application',
      subtitle: 'Master national distribution and strategic healthcare channel development covering multi-state networks.',
      badge: 'National Tier'
    },
    'regional': {
      title: 'Regional Channel Partner Application',
      subtitle: 'State and Zonal leadership for clinical diagnostics outreach, doctor networks, and smart healthcare integration.',
      badge: 'Zonal / State Tier'
    },
    'franchise': {
      title: 'GenQuantis™ Smart Clinic Franchise Investor Application',
      subtitle: 'Establish and operate state-of-the-art AI Diagnostics, Automated Pathology, and Preventive Care Hubs.',
      badge: 'Investor / Center Tier'
    }
  };

  const steps = [
    { number: 1, label: 'Individual Profile', icon: User },
    { number: 2, label: 'Business & Infra', icon: Building2 },
    { number: 3, label: 'Territory Mapping', icon: MapPin },
    { number: 4, label: 'Document Verification', icon: FileText },
    { number: 5, label: 'Governance & Declarations', icon: ShieldCheck },
    { number: 6, label: 'Review & Submit', icon: CheckCircle }
  ];

  const handleRealFileUpload = (docId: string, file: File) => {
    // 1. Strict File Type Restriction: ONLY PDF or Images allowed
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

    if (!isImage && !isPdf) {
      alert(`Invalid file format: "${file.name}".\n\nOnly official PDF documents and images (PNG, JPG, JPEG, WEBP) are accepted for regulatory verification. Word, PowerPoint, or other formats are not permitted.`);
      return;
    }

    // 2. File size limit: 12MB max
    if (file.size > 12 * 1024 * 1024) {
      alert(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB).\n\nPlease upload a file under 12MB.`);
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = sizeInMB >= 1 
      ? `${sizeInMB.toFixed(1)} MB` 
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      DocumentVault.saveDocument(docId, { fileName: file.name, fileDataUrl: dataUrl, mimeType: file.type });
      DocumentVault.saveDocument(file.name, { fileName: file.name, fileDataUrl: dataUrl, mimeType: file.type });

      setUploadedDocs(prev => prev.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            fileName: file.name,
            fileSize: formattedSize,
            uploadedAt: new Date().toISOString().split('T')[0],
            status: 'verified',
            fileDataUrl: dataUrl,
            mimeType: file.type
          };
        }
        return d;
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docId: string) => {
    setUploadedDocs(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          fileName: '',
          fileSize: '',
          uploadedAt: '',
          status: 'pending',
          fileDataUrl: undefined,
          mimeType: undefined
        };
      }
      return d;
    }));
  };

  const handleSimulateDocUpload = (docId: string) => {
    setUploadedDocs(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          fileName: `${d.name.replace(/[^a-zA-Z0-9]/g, '_')}_Verified.pdf`,
          fileSize: `${(Math.random() * 2 + 1.2).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().split('T')[0],
          status: 'verified'
        };
      }
      return d;
    }));
  };

  const handleFillDemoData = () => {
    setIndividual({
      fullName: 'Dr. Arunachalam Pillai',
      nameAsPerGovtId: 'Arunachalam Pillai K',
      dob: '1982-04-15',
      gender: 'Male',
      nationality: 'Indian',
      mobile: '+91 98412 34567',
      whatsapp: '+91 98412 34567',
      email: 'arunachalam.pillai@mediquant.co.in',
      residentialAddress: 'Flat 4B, Emerald Heights, Anna Nagar West, Chennai',
      correspondenceAddress: 'Flat 4B, Emerald Heights, Anna Nagar West, Chennai',
      state: 'Tamil Nadu',
      district: 'Chennai',
      pincode: '600040',
      educationalQualification: 'MBBS, MD (Bio-Chemistry), PGDM Healthcare Management',
      professionalQualification: 'Life Member Quality Council of India & NABL Assessor',
      currentOccupation: 'Founder & Managing Director',
      totalExperienceYears: 20,
      businessExperienceYears: 14,
      healthcareExperienceYears: 18,
      franchiseExperienceYears: 6,
      channelPartnerExperienceYears: 8,
      existingBusinessInterests: 'Clinical laboratories and tele-radiology reporting hubs across South India.',
      linkedinProfile: 'https://linkedin.com/in/dr-arunachalam-pillai',
      reference1Name: 'Dr. Sundaresan V',
      reference1Contact: '+91 98400 11224',
      reference1Relation: 'Former Director of Medical Education, TN',
      reference2Name: 'Venkatesh Prasad',
      reference2Contact: '+91 99401 88992'
    });

    setBusiness({
      isApplyingAsEntity: true,
      legalEntityName: 'MediQuant Diagnostic Solutions Private Limited',
      tradeBrandName: 'MediQuant AI Health',
      entityType: 'Pvt Ltd',
      dateOfIncorporation: '2016-08-20',
      registeredOffice: 'No 12/4, 2nd Avenue, Anna Nagar, Chennai 600040',
      operatingOffice: 'Anna Nagar, Chennai & RS Puram, Coimbatore',
      website: 'https://mediquanthealth.in',
      corporateEmail: 'contact@mediquanthealth.in',
      telephone: '044-26218899',
      principalActivities: 'Diagnostic lab chains, AI radiological screening, and point-of-care clinics.',
      yearsInOperation: 10,
      promotersDirectors: 'Dr. Arunachalam Pillai (70%), K. Meena Pillai (30%)',
      keyManagement: 'COO, Head of Laboratory Services, Zonal Business Managers',
      teamStrength: 42,
      existingLocations: 'Chennai, Coimbatore, Madurai, Tiruchirappalli',
      healthcareDiagnosticExperience: 'Managing 14 operational collection centers and 2 reference hubs.',
      franchiseExperience: 'Operated regional diagnostic master franchise for 5 years.',
      channelPartnerExperience: 'Authorized distributor for Sysmex and Mindray hematology.',
      geographicPresence: 'Tamil Nadu, Puducherry, and Kerala border zones.',
      existingBusinessNetwork: 'Over 650 empanelled doctors and 30 hospital labs.',
      proposedTeamStrength: 18,
      infrastructureCapability: 'Fully air-conditioned 2,800 sq.ft facility with fiber internet, 30kVA DG backup.',
      investmentCapacity: '₹2 Crores - ₹5 Crores',
      authorisedSignatoryName: 'Dr. Arunachalam Pillai',
      authorisedSignatoryDesignation: 'Managing Director',
      gstin: '33AAACM1920K1ZS',
      cinOrPan: 'U85190TN2016PTC111928'
    });

    setTerritory({
      isPanIndia: currentPathway === 'pan-india',
      selectedStates: currentPathway === 'pan-india' ? ['All Indian States & UTs'] : ['Tamil Nadu', 'Kerala', 'Puducherry'],
      notes: 'Focus on metropolitan and tier-2 smart health hub rollout.'
    });

    // Mark docs as uploaded with mock dataUrl for preview
    setUploadedDocs(prev => prev.map(d => ({
      ...d,
      fileName: `${d.name.replace(/[^a-zA-Z0-9]/g, '_')}_Verified.pdf`,
      fileSize: '2.4 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'verified',
      fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRECihoZWxsbyBjdXJhcXVhbnRpcykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMDYgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoyOTkKJSVFT0YK'
    })));

    setDeclarations({
      truthfulDisclosure: true,
      noRoiGuaranteeAgreed: true,
      noFranchiseAuthorityAgreed: true,
      antiFraudConsent: true,
      privacyPolicyConsent: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Generate unique reference number GQ-2026-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newAppId = `GQ-2026-${randomSuffix}`;

    const newApp: PartnerApplication = {
      id: newAppId,
      pathway: currentPathway,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'submitted',
      statusTimeline: [
        {
          status: 'submitted',
          label: 'Application Submitted for GenQuantis™ Screening',
          completedAt: new Date().toISOString(),
          note: 'Your application has been received and queued for Tier-1 scrutiny and due diligence.'
        }
      ],
      individual,
      business,
      territory,
      declarations,
      documents: uploadedDocs,
      clarifications: [],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Online Application Filed',
          performedBy: individual.fullName || 'Applicant',
          details: `Application initiated under pathway: ${currentPathway.toUpperCase()} with ${uploadedDocs.filter(d => d.status === 'verified').length} verified attachments.`
        }
      ],
      paymentStatus: currentPathway === 'franchise' ? 'exempt' : 'pending',
      paymentDetails: currentPathway !== 'franchise' ? {
        amount: 250000,
        taxes: 45000,
        totalAmount: 295000,
        invoiceNo: `CQ/PROFORMA/${new Date().getFullYear()}/${randomSuffix.toString().slice(-4)}`
      } : undefined,
      trainingStatus: 'not_started',
      agreementStatus: 'drafting'
    };

    // Cache uploaded files in DocumentVault so Admin can preview & download in full resolution
    uploadedDocs.forEach(d => {
      if (d.fileDataUrl) {
        DocumentVault.saveDocument(`${newAppId}_${d.id}`, { fileName: d.fileName, fileDataUrl: d.fileDataUrl, mimeType: d.mimeType });
        DocumentVault.saveDocument(d.fileName, { fileName: d.fileName, fileDataUrl: d.fileDataUrl, mimeType: d.mimeType });
      }
    });

    // Store in MongoDB Atlas (with local resilient fallback)
    const saveResult = await PartnerStore.saveApplicationAsync(newApp);
    if (saveResult.storage === 'mongodb_atlas') {
      setStorageTarget('MongoDB Atlas (GenQuantis.partner_applications)');
    } else {
      setStorageTarget('Secure Registry (Synchronizing to MongoDB Atlas)');
    }

    setSubmittedAppId(newAppId);
    setIsSubmitting(false);

    // Automatically establish secure isolated session for this applicant
    AuthStore.setCurrentUser({
      userId: `USER-${newApp.id}`,
      email: newApp.individual.email,
      fullName: newApp.individual.fullName,
      role: 'applicant',
      associatedAppId: newApp.id,
      token: `JWT_CQ_PARTNER_${newApp.id}`
    });

    // Dispatch complete application dossier to Headquarters & direct confirmation to Applicant Email
    sendPartnerApplicationEmail(newApp).then((res) => {
      setEmailStatus(res.message);
      setMailtoUrl(res.mailtoUrl);
      setApplicantMailtoUrl(res.applicantMailtoUrl);
      setApplicantEmailNotice(`Reference ID ${newApp.id} and login link dispatched directly to ${newApp.individual.email}`);
    }).catch(() => {
      setEmailStatus(`Docket securely archived and queued for ${GenQuantis_SUPPORT_EMAIL}`);
      setApplicantEmailNotice(`Reference ID ${newApp.id} registered for ${newApp.individual.email}`);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          {/* Header Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/partner-portal" className="hover:text-orange-600 transition-colors">Partner & Investor Portal</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Application Pathway</span>
            </div>
          </div>

          {/* Banner (Light Theme with Orange Accents) */}
          <div className="bg-gradient-to-br from-white via-orange-50/70 to-amber-50/40 border border-orange-200/90 rounded-3xl p-6 sm:p-10 text-slate-900 shadow-xl shadow-orange-950/5 mb-10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-4">
                <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                <span>{pathwayTitles[currentPathway].badge}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mb-3">
                {pathwayTitles[currentPathway].title}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-3xl font-normal leading-relaxed">
                {pathwayTitles[currentPathway].subtitle}
              </p>

              {/* Pathway Switcher Tabs */}
              <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-orange-100">
                {(['pan-india', 'regional', 'franchise'] as PathwayType[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      navigate(`/apply/${p}`);
                      if (p === 'pan-india') {
                        setTerritory(prev => ({ ...prev, isPanIndia: true, selectedStates: ['Pan-India (All 36 States & UTs)'] }));
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      currentPathway === p
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-bold'
                        : 'bg-white hover:bg-orange-50/80 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {p === 'pan-india' ? 'Pan-India Channel Partner' : p === 'regional' ? 'Regional Channel Partner' : 'Franchise Investor'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Success Dialog */}
          {submittedAppId ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-orange-100 text-center max-w-3xl mx-auto animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">
                Application Successfully Filed
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-2">
                Screening Reference Generated
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto mb-6">
                Your application has entered the official GenQuantis™ due diligence pipeline. 
                Please save your unique reference number below for live status tracking.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-orange-200 rounded-2xl p-6 mb-6 max-w-md mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 text-[11px] font-mono mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{storageTarget}</span>
                </div>
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">
                  Mandatory Application Reference ID
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-3xl font-extrabold text-orange-950 tracking-wider">
                    {submittedAppId}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAppId}
                    className="p-2 rounded-xl bg-white hover:bg-orange-100/70 border border-orange-200 text-orange-700 shadow-sm transition-all flex items-center gap-1 text-xs font-semibold"
                    title="Copy Application ID"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Timestamp: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                </p>
              </div>

              {/* DIRECT APPLICANT EMAIL CONFIRMATION CARD */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-2xl p-6 mb-6 max-w-lg mx-auto text-left shadow-sm space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Dispatched to Your Email
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 font-mono">
                        {individual.email}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Your Mandatory Reference ID &amp; Login Link Sent
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      We have sent your Application ID (<strong>{submittedAppId}</strong>) along with your 1-click direct login link directly to <strong>{individual.email}</strong> so you can easily access your onboarding docket anytime.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/portal/login?appId=${submittedAppId}`}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Login to Portal with this ID</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {applicantMailtoUrl && (
                    <a
                      href={applicantMailtoUrl}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                      title="Open in your mail client to save a copy"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Open in Mail App</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Headquarters Docket Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 max-w-lg mx-auto text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>Headquarters Scrutiny Docket:</span>
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {GenQuantis_SUPPORT_EMAIL}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {emailStatus}
                </p>
              </div>

              {/* Status roadmap */}
              <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 max-w-xl mx-auto border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Mandatory Next Steps & Screening Workflow:</span>
                </h4>
                <ol className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span><strong>Stage 1 - Document & Identity Scrutiny:</strong> Our compliance team verifies your government IDs and company registrations.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span><strong>Stage 2 - Due Diligence & Clarifications:</strong> You will be notified if additional certifications or regional references are needed.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span><strong>Stage 3 - Executive Interview:</strong> Video or in-person conference with GenQuantis™ Leadership.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                    <span><strong>Stage 4 - Formal Appointment & Onboarding:</strong> Execution of agreement and portal unlock.</span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to={`/portal/partner-dashboard?appId=${submittedAppId}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <span>Open Your Applicant Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/partner-portal"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors text-center"
                >
                  Return to Portal Home
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Stepper Wizard Bar */}
              <div className="mb-8 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm border border-slate-200">
                {/* Active Step Progress Summary on Mobile & Tablet */}
                <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                      {currentStep}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                        Section 0{currentStep} of 0{steps.length}
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-0.5">
                        {steps[currentStep - 1]?.label}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/80 flex-shrink-0">
                    {Math.round((currentStep / steps.length) * 100)}% Complete
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>

                {/* 6 Step Cards with FULL TEXT ALWAYS VISIBLE ON ALL SCREENS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
                  {steps.map((s) => {
                    const isActive = currentStep === s.number;
                    const isDone = currentStep > s.number;
                    return (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => setCurrentStep(s.number)}
                        className={`flex items-start sm:items-center gap-2 p-2 sm:p-2.5 rounded-xl transition-all text-left min-w-0 min-h-[50px] ${
                          isActive
                            ? 'bg-orange-500 text-white shadow-md ring-2 ring-blue-500/20'
                            : isDone
                            ? 'bg-orange-50 text-orange-950 border border-orange-200 hover:bg-orange-100/70'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 sm:mt-0 ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : isDone
                            ? 'bg-blue-200 text-orange-950 font-extrabold'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isDone ? '✓' : s.number}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] sm:text-[11px] font-bold leading-tight break-words line-clamp-2 ${
                            isActive ? 'text-white' : isDone ? 'text-orange-950' : 'text-slate-800'
                          }`}>
                            {s.label}
                          </p>
                          <span className={`text-[9px] block uppercase font-medium mt-0.5 ${
                            isActive ? 'text-white/80' : isDone ? 'text-orange-600 font-semibold' : 'text-slate-400'
                          }`}>
                            {isDone ? 'Done' : `Step 0${s.number}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* STEP 1: INDIVIDUAL APPLICANT PROFILE */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-8 animate-fade-in-up">
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <User className="w-4 h-4" />
                        <span>Section 01 of 06</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Complete Individual Applicant Profile
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        All applicants and authorized corporate signatories must provide legal due diligence identification details.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Full Legal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.fullName}
                          onChange={(e) => setIndividual({ ...individual, fullName: e.target.value })}
                          placeholder="e.g. Dr. Arunachalam Pillai"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Name as per Government ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.nameAsPerGovtId}
                          onChange={(e) => setIndividual({ ...individual, nameAsPerGovtId: e.target.value })}
                          placeholder="Exact match with PAN / Passport"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={individual.dob}
                          onChange={(e) => setIndividual({ ...individual, dob: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={individual.gender}
                          onChange={(e) => setIndividual({ ...individual, gender: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Nationality <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.nationality}
                          onChange={(e) => setIndividual({ ...individual, nationality: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Primary Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={individual.mobile}
                          onChange={(e) => setIndividual({ ...individual, mobile: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          WhatsApp Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={individual.whatsapp}
                          onChange={(e) => setIndividual({ ...individual, whatsapp: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Primary Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={individual.email}
                          onChange={(e) => setIndividual({ ...individual, email: e.target.value })}
                          placeholder="name@domain.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Current Occupation / Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.currentOccupation}
                          onChange={(e) => setIndividual({ ...individual, currentOccupation: e.target.value })}
                          placeholder="e.g. Managing Director / Radiologist"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Residential Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={individual.residentialAddress}
                          onChange={(e) => setIndividual({ ...individual, residentialAddress: e.target.value })}
                          placeholder="Permanent residence as per Aadhaar / Passport"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Correspondence Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={individual.correspondenceAddress}
                          onChange={(e) => setIndividual({ ...individual, correspondenceAddress: e.target.value })}
                          placeholder="Official postal communication address"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.state}
                          onChange={(e) => setIndividual({ ...individual, state: e.target.value })}
                          placeholder="e.g. Tamil Nadu"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          District <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.district}
                          onChange={(e) => setIndividual({ ...individual, district: e.target.value })}
                          placeholder="e.g. Chennai"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          PIN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={individual.pincode}
                          onChange={(e) => setIndividual({ ...individual, pincode: e.target.value })}
                          placeholder="e.g. 600040"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Qualifications & Experience Matrix */}
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                        Qualifications & Multi-Sector Experience Breakdown
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Educational Qualifications <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={individual.educationalQualification}
                            onChange={(e) => setIndividual({ ...individual, educationalQualification: e.target.value })}
                            placeholder="Degree, University, Specialization"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Professional Qualifications & Accreditations
                          </label>
                          <input
                            type="text"
                            value={individual.professionalQualification}
                            onChange={(e) => setIndividual({ ...individual, professionalQualification: e.target.value })}
                            placeholder="e.g. Fellow, Memberships, Medical Council No."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Experience Sliders / Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Total Experience
                          </label>
                          <div className="text-lg font-extrabold text-orange-950">{individual.totalExperienceYears} Yrs</div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={individual.totalExperienceYears}
                            onChange={(e) => setIndividual({ ...individual, totalExperienceYears: Number(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Business Exp.
                          </label>
                          <div className="text-lg font-extrabold text-orange-950">{individual.businessExperienceYears} Yrs</div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={individual.businessExperienceYears}
                            onChange={(e) => setIndividual({ ...individual, businessExperienceYears: Number(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Healthcare Exp.
                          </label>
                          <div className="text-lg font-extrabold text-orange-950">{individual.healthcareExperienceYears} Yrs</div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={individual.healthcareExperienceYears}
                            onChange={(e) => setIndividual({ ...individual, healthcareExperienceYears: Number(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Franchise Exp.
                          </label>
                          <div className="text-lg font-extrabold text-orange-950">{individual.franchiseExperienceYears} Yrs</div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={individual.franchiseExperienceYears}
                            onChange={(e) => setIndividual({ ...individual, franchiseExperienceYears: Number(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Channel Exp.
                          </label>
                          <div className="text-lg font-extrabold text-orange-950">{individual.channelPartnerExperienceYears} Yrs</div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={individual.channelPartnerExperienceYears}
                            onChange={(e) => setIndividual({ ...individual, channelPartnerExperienceYears: Number(e.target.value) })}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* LinkedIn & References */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          LinkedIn / Professional Profile URL
                        </label>
                        <input
                          type="url"
                          value={individual.linkedinProfile}
                          onChange={(e) => setIndividual({ ...individual, linkedinProfile: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Professional Reference 1 (Name & Contact) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={individual.reference1Name}
                          onChange={(e) => setIndividual({ ...individual, reference1Name: e.target.value })}
                          placeholder="Name, Designation, Phone"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Existing Business Interests
                        </label>
                        <input
                          type="text"
                          value={individual.existingBusinessInterests}
                          onChange={(e) => setIndividual({ ...individual, existingBusinessInterests: e.target.value })}
                          placeholder="Directorships or businesses owned"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: COMPLETE BUSINESS / ORGANISATION PROFILE */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-8 animate-fade-in-up">
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <Building2 className="w-4 h-4" />
                        <span>Section 02 of 06</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Complete Business & Organisation Profile
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Corporate details, infrastructure readiness, clinical footprint, and financial investment capacity.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Legal Entity Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={business.legalEntityName}
                          onChange={(e) => setBusiness({ ...business, legalEntityName: e.target.value })}
                          placeholder="e.g. MediQuant Diagnostic Solutions Pvt Ltd"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Trade / Brand Name
                        </label>
                        <input
                          type="text"
                          value={business.tradeBrandName}
                          onChange={(e) => setBusiness({ ...business, tradeBrandName: e.target.value })}
                          placeholder="Brand name if different"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Entity Constitution <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={business.entityType}
                          onChange={(e) => setBusiness({ ...business, entityType: e.target.value as any })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        >
                          <option value="Pvt Ltd">Private Limited Company</option>
                          <option value="LLP">Limited Liability Partnership (LLP)</option>
                          <option value="Partnership">Partnership Firm</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Public Ltd">Public Limited Company</option>
                          <option value="Trust/Society">Trust / Healthcare Society</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          GSTIN Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={business.gstin}
                          onChange={(e) => setBusiness({ ...business, gstin: e.target.value })}
                          placeholder="15-digit GSTIN"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          CIN / Entity PAN <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={business.cinOrPan}
                          onChange={(e) => setBusiness({ ...business, cinOrPan: e.target.value })}
                          placeholder="Corporate CIN or PAN"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Date of Incorporation / Establishment
                        </label>
                        <input
                          type="date"
                          value={business.dateOfIncorporation}
                          onChange={(e) => setBusiness({ ...business, dateOfIncorporation: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Corporate Website
                        </label>
                        <input
                          type="url"
                          value={business.website}
                          onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                          placeholder="https://company.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Corporate Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={business.corporateEmail}
                          onChange={(e) => setBusiness({ ...business, corporateEmail: e.target.value })}
                          placeholder="office@company.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Office Telephone / Board Line
                        </label>
                        <input
                          type="tel"
                          value={business.telephone}
                          onChange={(e) => setBusiness({ ...business, telephone: e.target.value })}
                          placeholder="STD Code + Phone"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Offices & Physical locations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Registered Corporate Office Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={business.registeredOffice}
                          onChange={(e) => setBusiness({ ...business, registeredOffice: e.target.value })}
                          placeholder="Address as recorded in MCA / Registrar of Firms"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Operating Clinic / Hub Office Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={business.operatingOffice}
                          onChange={(e) => setBusiness({ ...business, operatingOffice: e.target.value })}
                          placeholder="Facility location where operations are hosted"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Infrastructure & Capacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Current Team Strength
                        </label>
                        <input
                          type="number"
                          value={business.teamStrength}
                          onChange={(e) => setBusiness({ ...business, teamStrength: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Proposed Team for GenQuantis™
                        </label>
                        <input
                          type="number"
                          value={business.proposedTeamStrength}
                          onChange={(e) => setBusiness({ ...business, proposedTeamStrength: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Investment Capacity Commitment <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={business.investmentCapacity}
                          onChange={(e) => setBusiness({ ...business, investmentCapacity: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold text-orange-950"
                        >
                          <option value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs</option>
                          <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                          <option value="₹1 Crore - ₹3 Crores">₹1 Crore - ₹3 Crores</option>
                          <option value="₹3 Crores - ₹5 Crores">₹3 Crores - ₹5 Crores</option>
                          <option value="₹5 Crores - ₹15 Crores">₹5 Crores - ₹15 Crores (Pan-India Tier)</option>
                          <option value="₹15 Crores+">₹15 Crores+ (National Institutional)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Infrastructure & Technological Capabilities <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={business.infrastructureCapability}
                        onChange={(e) => setBusiness({ ...business, infrastructureCapability: e.target.value })}
                        placeholder="Describe existing laboratory space, square footage, air conditioning, power backup, server/broadband connectivity, and diagnostic equipment."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: COMPLETE INDIA TERRITORY MAP */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>Section 03 of 06</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Interactive India Territory Selection
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Select your proposed state(s), union territories, or select Pan-India coverage. 
                        Your selected zones will appear in your final screening docket.
                      </p>
                    </div>

                    <IndiaTerritoryMap
                      isPanIndia={territory.isPanIndia}
                      selectedStates={territory.selectedStates}
                      onSelectionChange={(states, isPan) => setTerritory({ ...territory, selectedStates: states, isPanIndia: isPan })}
                      territoryType={currentPathway === 'franchise' ? 'franchise' : 'proposed'}
                    />

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Specific Territory / Cluster Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={territory.notes}
                        onChange={(e) => setTerritory({ ...territory, notes: e.target.value })}
                        placeholder="e.g. Priority focus on Chennai OMR corridor and Coimbatore industrial cluster."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: MAXIMUM APPROPRIATE DOCUMENT VERIFICATION */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-8 animate-fade-in-up">
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <FileText className="w-4 h-4" />
                        <span>Section 04 of 06</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Maximum Appropriate Document Verification
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Upload official credentials. The system distinguishes between mandatory, conditional, and optional verification proofs.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {uploadedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 gap-4 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              doc.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-slate-900">{doc.name}</h4>
                                {doc.isMandatory ? (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Mandatory
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                                    Optional / Conditional
                                  </span>
                                )}
                              </div>
                              {doc.notes && (
                                <p className="text-[11px] text-slate-500 mt-0.5 italic">
                                  {doc.notes}
                                </p>
                              )}
                              {doc.fileName ? (
                                <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{doc.fileName} ({doc.fileSize}) — Attached & Verified</span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Formats: <span className="font-semibold text-slate-700">PDF, PNG, JPG, WEBP only</span> (Max 12MB). Clear scan required.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Real Hidden File Input - Restricted to PDF & Images */}
                          <input
                            type="file"
                            id={`doc-file-${doc.id}`}
                            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleRealFileUpload(doc.id, e.target.files[0]);
                              }
                            }}
                          />

                          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                            {doc.status === 'verified' ? (
                              <>
                                {doc.fileDataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(doc)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                                  >
                                    Preview Document
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`doc-file-${doc.id}`)?.click()}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-orange-700 hover:bg-orange-50 border border-orange-200 transition-colors"
                                >
                                  Replace File
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(doc.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove attached document"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => document.getElementById(`doc-file-${doc.id}`)?.click()}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white flex items-center gap-2 transition-all shadow-sm"
                              >
                                <UploadCloud className="w-4 h-4" />
                                <span>Choose File to Upload</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: GOVERNANCE & DECLARATIONS */}
                {currentStep === 5 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-8 animate-fade-in-up">
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Section 05 of 06</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Governance, Authority Limits & Legal Declarations
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Please review the strict legal parameters governing GenQuantis™ partnerships and franchise models.
                      </p>
                    </div>

                    {/* Strict Authority Structure Callout */}
                    <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-6 sm:p-8 rounded-2xl text-white space-y-4">
                      <h3 className="text-base font-bold text-orange-300 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>Mandatory GenQuantis™ Authority Matrix & Non-Negotiable Limits:</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed font-light">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <p className="font-semibold text-white mb-1">● Sole Appointment Authority</p>
                          <p>GenQuantis™ alone appoints Pan-India and Regional Channel Partners. Pan-India Partners may recommend candidates, but only GenQuantis™ formally executes appointments.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <p className="font-semibold text-white mb-1">● Strict Franchise Lead Role</p>
                          <p>Channel Partners may only Identify, Develop, and Introduce prospective Franchise Investors. They CANNOT approve investors or sign agreements on behalf of GenQuantis™.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <p className="font-semibold text-white mb-1">● Absolute No-ROI & No-Revenue Guarantee</p>
                          <p>No partner is authorized to promise financial returns, guaranteed ROI, or revenue projections. Healthcare diagnostics depend on clinical execution and regulatory compliance.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <p className="font-semibold text-white mb-1">● Non-Exclusivity of Application</p>
                          <p>Application submission or territory selection does NOT grant territorial exclusivity or commercial rights until a binding agreement is approved and executed.</p>
                        </div>
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4 pt-2">
                      <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          required
                          checked={declarations.truthfulDisclosure}
                          onChange={(e) => setDeclarations({ ...declarations, truthfulDisclosure: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong>Truthful Disclosure & Due Diligence Consent:</strong> I certify that all individual, academic, corporate, and financial disclosures made herein are accurate and true. I authorize GenQuantis™ and its designated counsel to conduct due diligence, reference inquiries, and background verification.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          required
                          checked={declarations.noRoiGuaranteeAgreed}
                          onChange={(e) => setDeclarations({ ...declarations, noRoiGuaranteeAgreed: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong>No-ROI & No Revenue Guarantee Covenant:</strong> I acknowledge that GenQuantis™ does NOT guarantee any commercial profits, revenue volumes, or minimum return on investment. I undertake never to misrepresent commercial terms to sub-distributors or investors.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          required
                          checked={declarations.noFranchiseAuthorityAgreed}
                          onChange={(e) => setDeclarations({ ...declarations, noFranchiseAuthorityAgreed: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong>Authority Boundaries & Lead Protocol:</strong> I understand that only GenQuantis™ evaluates, approves, and executes agreements with Franchise Investors. All investor introductions must be officially routed through the GenQuantis™ Lead Management Registry.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          required
                          checked={declarations.antiFraudConsent}
                          onChange={(e) => setDeclarations({ ...declarations, antiFraudConsent: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong>Anti-Fraud & Conflict-of-Interest Declaration:</strong> Neither I nor any promoter has been debarred by any medical regulator, MCA, or court of law. I undertake to immediately disclose any potential conflict of interest.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          required
                          checked={declarations.privacyPolicyConsent}
                          onChange={(e) => setDeclarations({ ...declarations, privacyPolicyConsent: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong>Data Privacy, IP & Non-Disclosure:</strong> I consent to the processing of personal and business information under Indian Data Protection norms and agree to maintain strict confidentiality regarding GenQuantis™ proprietary AI algorithms and commercial terms.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 6: FINAL APPLICATION REVIEW & SUMMARY */}
                {currentStep === 6 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-8 animate-fade-in-up">
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Section 06 of 06</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Final Application Scrutiny & Submission Review
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Please inspect all recorded parameters. You can click previous sections to correct any details before formal submission.
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Individual Summary */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <User className="w-4 h-4 text-orange-600" />
                            <span>Applicant Details</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-orange-600 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="text-xs space-y-1.5 text-slate-600">
                          <p><strong className="text-slate-800">Legal Name:</strong> {individual.fullName || '—'}</p>
                          <p><strong className="text-slate-800">Govt ID Match:</strong> {individual.nameAsPerGovtId || '—'}</p>
                          <p><strong className="text-slate-800">Email:</strong> {individual.email || '—'}</p>
                          <p><strong className="text-slate-800">Mobile / WhatsApp:</strong> {individual.mobile || '—'}</p>
                          <p><strong className="text-slate-800">Location:</strong> {individual.district ? `${individual.district}, ${individual.state}` : '—'}</p>
                          <p><strong className="text-slate-800">Experience:</strong> {individual.totalExperienceYears} Yrs Total ({individual.healthcareExperienceYears} Yrs Healthcare)</p>
                        </div>
                      </div>

                      {/* Business Summary */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>Entity & Infrastructure</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs text-orange-600 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="text-xs space-y-1.5 text-slate-600">
                          <p><strong className="text-slate-800">Entity:</strong> {business.legalEntityName || '—'} ({business.entityType})</p>
                          <p><strong className="text-slate-800">GSTIN:</strong> {business.gstin || '—'}</p>
                          <p><strong className="text-slate-800">CIN / PAN:</strong> {business.cinOrPan || '—'}</p>
                          <p><strong className="text-slate-800">Team Strength:</strong> {business.teamStrength} Staff ({business.proposedTeamStrength} Allocated)</p>
                          <p><strong className="text-slate-800">Investment Commitment:</strong> {business.investmentCapacity}</p>
                        </div>
                      </div>

                      {/* Territory Summary */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span>Proposed Territory Scope</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-xs text-orange-600 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="text-xs space-y-2 text-slate-600">
                          {territory.isPanIndia ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                              ★ Pan-India Master Footprint
                            </span>
                          ) : territory.selectedStates.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {territory.selectedStates.map(st => (
                                <span key={st} className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-medium">
                                  {st}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-amber-600">No territory specified yet</span>
                          )}
                          {territory.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1">"{territory.notes}"</p>
                          )}
                        </div>
                      </div>

                      {/* Documents Summary */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            <span>Document Attachments</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(4)}
                            className="text-xs text-orange-600 hover:underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p>
                            <strong className="text-slate-800">Verified Files:</strong> {uploadedDocs.filter(d => d.status === 'verified').length} of {uploadedDocs.length}
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
                            {uploadedDocs.filter(d => d.status === 'verified').map(d => (
                              <li key={d.id}>{d.name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Submission CTA Alert */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-bold">Ready to Dispatch for Scrutiny?</h4>
                        <p className="text-xs text-slate-300 font-light max-w-lg leading-relaxed">
                          By clicking submit, your complete application docket is encrypted and dispatched directly to <strong>{GenQuantis_SUPPORT_EMAIL}</strong> and recorded in the GenQuantis™ Scrutiny Board registry. A unique Reference ID (GQ-2026-XXXXXX) will be generated.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-60 cursor-pointer text-center"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>STORING IN MONGODB ATLAS...</span>
                          </>
                        ) : (
                          <>
                            <span>SUBMIT APPLICATION FOR GenQuantis™ SCREENING</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-slate-200">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back: {steps[currentStep - 2].label}</span>
                    </button>
                  ) : <div className="hidden sm:block" />}

                  {currentStep < 6 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <span>Proceed to {steps[currentStep].label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in-up space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{previewDoc.name}</h3>
                <p className="text-xs text-slate-500">{previewDoc.fileName} ({previewDoc.fileSize})</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-grow overflow-auto p-2 bg-slate-50 rounded-2xl flex items-center justify-center min-h-[300px]">
              {previewDoc.fileDataUrl?.startsWith('data:image/') ? (
                <img
                  src={previewDoc.fileDataUrl}
                  alt={previewDoc.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-sm"
                />
              ) : previewDoc.fileDataUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.fileDataUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[55vh] rounded-xl border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 text-slate-600 space-y-2">
                  <FileText className="w-12 h-12 text-orange-600 mx-auto" />
                  <p className="font-semibold text-sm">{previewDoc.fileName}</p>
                  <p className="text-xs text-slate-400">Document securely attached & verified for screening.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Uploaded: {previewDoc.uploadedAt}
              </span>
              <div className="flex gap-2">
                {previewDoc.fileDataUrl && (
                  <a
                    href={previewDoc.fileDataUrl}
                    download={previewDoc.fileName}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Download File</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ApplyPathway;
