import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PartnerStore } from '@/lib/partnerStore';
import { AuthStore } from '@/lib/authStore';
import { IndiaTerritoryMap } from '@/components/territory/IndiaTerritoryMap';
import { PartnerApplication, ApplicationStatus, InvestorLead, OFFICIAL_BANK_DETAILS } from '@/types/partnerPortal';
import { buildMailtoUrl, GenQuantis_SUPPORT_EMAIL } from '@/lib/emailNotification';
import { DocumentVault } from '@/lib/documentStorage';
import { 
  ShieldCheck, 
  Users, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Send, 
  Layers, 
  Calendar,
  CreditCard,
  Building,
  Building2,
  TrendingUp,
  FileSignature,
  Download,
  AlertTriangle,
  Mail,
  LogOut,
  Phone,
  Check,
  X,
  UserCheck,
  Eye,
  Loader2,
  ExternalLink,
  FileCheck,
  FileCheck2,
  UploadCloud,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Landmark,
  Copy,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Printer,
  CheckSquare,
  Shield,
  FileSpreadsheet
} from 'lucide-react';

export const ManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [leads, setLeads] = useState<InvestorLead[]>([]);
  
  // Mobile sub-tab switcher for applications view: 'list' | 'detail'
  const [mobileSubTab, setMobileSubTab] = useState<'list' | 'detail'>('list');
  
  // Filters
  const [filterPathway, setFilterPathway] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'applications' | 'territory-map' | 'leads' | 'audit-log'>('applications');

  // Action Drawer State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'interview' | 'clarify'>('approve');
  const [actionNote, setActionNote] = useState('');
  const [adminName, setAdminName] = useState('Dr. Dharani (Executive Board)');

  // Lead Review Modal state
  const [selectedLeadForReview, setSelectedLeadForReview] = useState<InvestorLead | null>(null);
  const [leadReviewStatus, setLeadReviewStatus] = useState<InvestorLead['status']>('introduced');
  const [leadReviewNotes, setLeadReviewNotes] = useState<string>('');
  const [leadUpdateFeedback, setLeadUpdateFeedback] = useState<string>('');

  // Document Inspection Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    name: string;
    fileName: string;
    fileSize?: string;
    uploadedAt?: string;
    fileDataUrl?: string;
    mimeType?: string;
    status: string;
    rejectionReason?: string;
  } | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  // High-Resolution Inspection & Rejection Controls
  const [imgZoom, setImgZoom] = useState<number>(1);
  const [imgRotation, setImgRotation] = useState<number>(0);
  const [isRejectingDoc, setIsRejectingDoc] = useState<boolean>(false);
  const [docRejectReason, setDocRejectReason] = useState<string>('');

  // Payment Manual Verification State
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);
  const [isRejectingPayment, setIsRejectingPayment] = useState<boolean>(false);
  const [paymentRejectReason, setPaymentRejectReason] = useState<string>('');
  const [paymentActionFeedback, setPaymentActionFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<boolean>(false);

  // Detailed Docket Monitoring Sub-Tabs ('profile' | 'entity' | 'territory' | 'declarations' | 'documents' | 'financials' | 'audit' | 'all')
  const [docketSubTab, setDocketSubTab] = useState<'profile' | 'entity' | 'territory' | 'declarations' | 'documents' | 'financials' | 'audit' | 'all'>('profile');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyField = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const handleAdminVerifyPayment = (appId: string) => {
    setIsVerifyingPayment(true);
    setTimeout(() => {
      const updated = PartnerStore.verifyPayment(appId, adminName);
      if (updated) {
        setSelectedApp({ ...updated });
        loadData();
        setPaymentActionFeedback({
          success: true,
          message: `Payment of ₹2,95,000 for ${updated.individual.fullName || updated.business.legalEntityName} manually verified in SBI A/C 45216693371. Invoice ${updated.paymentDetails?.invoiceNo} issued.`
        });
        setTimeout(() => setPaymentActionFeedback(null), 6000);
      }
      setIsVerifyingPayment(false);
    }, 500);
  };

  const handleAdminRejectPayment = (appId: string) => {
    if (!paymentRejectReason.trim()) {
      alert('Please select or enter the discrepancy reason for flagging this payment.');
      return;
    }

    const updated = PartnerStore.rejectPayment(appId, paymentRejectReason.trim(), adminName);
    if (updated) {
      setSelectedApp({ ...updated });
      loadData();
      setIsRejectingPayment(false);
      setPaymentRejectReason('');
      setPaymentActionFeedback({
        success: false,
        message: `Payment reference flagged as discrepancy. Applicant docket has been notified to re-submit proof.`
      });
      setTimeout(() => setPaymentActionFeedback(null), 6000);
    }
  };

  const handlePreviewPaymentProof = () => {
    if (!selectedApp?.paymentDetails?.paymentProofUrl) return;
    setImgZoom(1);
    setImgRotation(0);
    setIsRejectingDoc(false);
    setPreviewDoc({
      id: 'payment-proof',
      name: 'Bank Transfer Payment Advice / Receipt',
      fileName: selectedApp.paymentDetails.paymentProofName || 'Payment_Proof.png',
      fileDataUrl: selectedApp.paymentDetails.paymentProofUrl,
      status: 'submitted',
      uploadedAt: selectedApp.paymentDetails.submittedAt
    });
  };

  const handlePreviewDocument = async (doc: any) => {
    setLoadingDocId(doc.id);
    setImgZoom(1);
    setImgRotation(0);
    setIsRejectingDoc(false);
    setDocRejectReason('');

    let dataUrl = doc.fileDataUrl;
    let mime = doc.mimeType;

    // 1. If not yet in memory, fetch full application directly from MongoDB
    if (!dataUrl && selectedApp) {
      try {
        const fullApp = await PartnerStore.fetchApplicationByIdFromMongoDB(selectedApp.id);
        if (fullApp) {
          const remoteDoc = (fullApp.documents || []).find(d => d.id === doc.id);
          if (remoteDoc?.fileDataUrl) {
            dataUrl = remoteDoc.fileDataUrl;
            mime = remoteDoc.mimeType || mime;
          }
        }
      } catch (e) {
        console.warn('Could not read from MongoDB endpoint', e);
      }
    }

    // 2. Search DocumentVault (IndexedDB) with robust key resolution
    if (!dataUrl && selectedApp) {
      try {
        const cached = await DocumentVault.findDocument([
          `${selectedApp.id}_${doc.id}`,
          doc.id,
          doc.fileName,
          doc.name
        ]);

        if (cached?.fileDataUrl) {
          dataUrl = cached.fileDataUrl;
          mime = cached.mimeType || mime;
        }
      } catch (e) {
        console.warn('Could not read from vault', e);
      }
    }

    setLoadingDocId(null);
    setPreviewDoc({
      id: doc.id,
      name: doc.name,
      fileName: doc.fileName || `${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: doc.fileSize || 'Attached File',
      uploadedAt: doc.uploadedAt || new Date().toISOString().split('T')[0],
      fileDataUrl: dataUrl,
      mimeType: mime,
      status: doc.status || 'verified',
      rejectionReason: doc.rejectionReason
    });
  };

  const handleUpdateDocumentStatus = (docId: string, newStatus: 'verified' | 'pending' | 'rejected', reason?: string) => {
    if (!selectedApp) return;

    const docItem = selectedApp.documents.find(d => d.id === docId);
    const docName = docItem?.name || previewDoc?.name || 'Document';

    const finalReason = newStatus === 'rejected' 
      ? (reason || docRejectReason || 'Verification rejected by administrator during compliance audit') 
      : undefined;

    const auditText = newStatus === 'verified'
      ? `Document Scrutinized & Verified: ${docName}`
      : newStatus === 'rejected'
      ? `Document Rejected: ${docName} — Reason: ${finalReason}`
      : `Document Marked Pending: ${docName}`;

    const newAudit = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: newStatus === 'verified' ? 'Document Verified' : newStatus === 'rejected' ? 'Document Rejected' : 'Document Marked Pending',
      performedBy: adminName || 'Compliance Directorate',
      details: auditText
    };

    const updatedDocs = selectedApp.documents.map(d => {
      if (d.id === docId) {
        return { 
          ...d, 
          status: newStatus,
          rejectionReason: finalReason
        };
      }
      return d;
    });

    const updatedApp: PartnerApplication = {
      ...selectedApp,
      documents: updatedDocs,
      auditLogs: [newAudit, ...(selectedApp.auditLogs || [])],
      updatedAt: new Date().toISOString()
    };

    setSelectedApp(updatedApp);
    PartnerStore.saveApplication(updatedApp);
    setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));

    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc(prev => prev ? { 
        ...prev, 
        status: newStatus,
        rejectionReason: finalReason
      } : null);
    }

    setIsRejectingDoc(false);
    setDocRejectReason('');
  };

  useEffect(() => {
    // Executive authentication guard
    const user = AuthStore.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/portal/login?tab=admin&returnUrl=/portal/admin');
      return;
    }
    if (user.fullName) {
      setAdminName(user.fullName);
    }

    loadData();
    // Asynchronously pull latest from MongoDB (with full documents & dataUrls intact)
    PartnerStore.fetchFromMongoDB().then((remoteApps) => {
      if (remoteApps && remoteApps.length > 0) {
        setApplications([...remoteApps]);
        setSelectedApp(prev => {
          if (!prev) return remoteApps[0];
          const found = remoteApps.find(a => a.id === prev.id);
          return found || remoteApps[0];
        });
      }
    });

    PartnerStore.fetchLeadsFromMongoDB().then((remoteLeads) => {
      if (remoteLeads && remoteLeads.length > 0) {
        setLeads([...remoteLeads]);
      }
    });
  }, []);

  const loadData = () => {
    const apps = PartnerStore.getApplications();
    setApplications(apps);
    if (!selectedApp && apps.length > 0) {
      setSelectedApp(apps[0]);
    } else if (selectedApp) {
      const refreshed = apps.find(a => a.id === selectedApp.id);
      if (refreshed) setSelectedApp(refreshed);
    }
    setLeads(PartnerStore.getLeads());
  };

  const handleExecuteAction = () => {
    if (!selectedApp) return;

    if (actionType === 'approve') {
      PartnerStore.updateStatus(
        selectedApp.id, 
        'approved', 
        'Appointment Approved by GenQuantis™', 
        actionNote || 'Full due diligence completed and approved by Executive Scrutiny Board.',
        adminName
      );
    } else if (actionType === 'reject') {
      PartnerStore.updateStatus(
        selectedApp.id, 
        'rejected', 
        'Application Not Approved', 
        actionNote || 'Does not meet current clinical infrastructure or demographic thresholds.',
        adminName
      );
    } else if (actionType === 'interview') {
      PartnerStore.updateStatus(
        selectedApp.id, 
        'interview_scheduled', 
        'Executive Due Diligence Interview Scheduled', 
        actionNote || 'Executive Board interview scheduled via Video Conference.',
        adminName
      );
    } else if (actionType === 'clarify') {
      PartnerStore.addClarification(
        selectedApp.id,
        'management',
        adminName,
        actionNote
      );
      PartnerStore.updateStatus(
        selectedApp.id,
        'clarification_requested',
        'Official Clarification Requested',
        actionNote,
        adminName
      );
    }

    setIsActionModalOpen(false);
    setActionNote('');
    loadData();
  };

  const handleOpenLeadReview = (lead: InvestorLead) => {
    setSelectedLeadForReview(lead);
    setLeadReviewStatus(lead.status);
    setLeadReviewNotes(lead.notes || '');
    setLeadUpdateFeedback('');
  };

  const handleSaveLeadReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForReview) return;

    const updated = PartnerStore.updateLeadStatus(
      selectedLeadForReview.id,
      leadReviewStatus,
      leadReviewNotes
    );

    if (updated) {
      setSelectedLeadForReview({ ...updated });
      setLeads(PartnerStore.getLeads());
      setLeadUpdateFeedback('Lead review dossier and stage updated successfully.');
      setTimeout(() => setLeadUpdateFeedback(''), 3000);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesPathway = filterPathway === 'all' || app.pathway === filterPathway;
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'payment_submitted'
        ? app.paymentStatus === 'submitted'
        : app.status === filterStatus;
    const matchesSearch = app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.individual.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (app.business.legalEntityName && app.business.legalEntityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          app.territory.selectedStates.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPathway && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: applications.length,
    panIndia: applications.filter(a => a.pathway === 'pan-india').length,
    regional: applications.filter(a => a.pathway === 'regional').length,
    franchise: applications.filter(a => a.pathway === 'franchise').length,
    pendingScrutiny: applications.filter(a => ['submitted', 'screening', 'due_diligence'].includes(a.status)).length,
    approved: applications.filter(a => ['approved', 'partner_activated', 'payment_completed'].includes(a.status)).length,
    pendingPayment: applications.filter(a => a.paymentStatus === 'submitted').length
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Header Banner (Light Theme with Orange Accents) */}
          <div className="bg-gradient-to-br from-white via-orange-50/70 to-amber-50/40 border border-orange-200/90 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xl shadow-orange-950/5 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  <span>Confidential Management Scrutiny Board</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  GenQuantis™ National Command Center
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 font-normal">
                  Strict due diligence, document verification, authority matrix enforcement, and territory allocation.
                </p>
              </div>

              {/* Authorized Personnel Badge & Sign Out */}
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2.5 rounded-2xl border border-orange-200/80 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-300 text-orange-700 flex items-center justify-center font-bold text-xs">
                    HQ
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px]">Logged in as:</span>
                    <span className="font-semibold text-slate-900">{adminName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    AuthStore.logout();
                    navigate('/portal/login?tab=admin');
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Sign out of Scrutiny Board"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar (Light Theme with Crisp Contrast) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mt-8 pt-6 border-t border-orange-200/80 text-xs">
              <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-200 transition-all">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Total Dockets</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{stats.total}</span>
              </div>
              <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-200 transition-all">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Pan-India</span>
                <span className="text-2xl font-extrabold text-indigo-700 mt-0.5 block">{stats.panIndia}</span>
              </div>
              <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-200 transition-all">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Regional</span>
                <span className="text-2xl font-extrabold text-orange-600 mt-0.5 block">{stats.regional}</span>
              </div>
              <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-200 transition-all">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Franchise</span>
                <span className="text-2xl font-extrabold text-amber-700 mt-0.5 block">{stats.franchise}</span>
              </div>
              <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-200 transition-all">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Pending Scrutiny</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">{stats.pendingScrutiny}</span>
              </div>
              <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-200 transition-all">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Approved</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">{stats.approved}</span>
              </div>
              <div className={`p-3 rounded-2xl border transition-all col-span-2 sm:col-span-1 shadow-xs ${
                stats.pendingPayment > 0 
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                  : 'bg-white/90 border-orange-100'
              }`}>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">SBI Verification</span>
                <span className={`text-2xl font-extrabold mt-0.5 block ${stats.pendingPayment > 0 ? 'text-amber-700 animate-pulse' : 'text-slate-700'}`}>
                  {stats.pendingPayment}
                </span>
              </div>
            </div>

            {/* Top Navigation Tabs - Horizontally scrollable on mobile */}
            <div className="flex items-center gap-2 mt-6 text-xs overflow-x-auto pb-2 scrollbar-none sm:flex-wrap">
              {[
                { id: 'applications', label: `Application Dockets (${filteredApps.length})`, icon: FileText },
                { id: 'territory-map', label: 'National Territory Density', icon: MapPin },
                { id: 'leads', label: `Investor Lead Registry (${leads.length})`, icon: Users },
                { id: 'audit-log', label: 'Compliance Audit Trail', icon: ShieldCheck }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all flex-shrink-0 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 font-bold'
                        : 'bg-white hover:bg-orange-50 text-slate-700 border border-slate-200/90 shadow-xs'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: APPLICATIONS & SCRUTINY WORKFLOW */}
          {activeTab === 'applications' && (
            <div>
              {/* Mobile Sub-Navigation Pill (Applications List vs Selected Docket Details) */}
              <div className="lg:hidden flex items-center p-1 bg-slate-200/90 rounded-2xl mb-4 border border-slate-300 text-xs font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setMobileSubTab('list')}
                  className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mobileSubTab === 'list'
                      ? 'bg-orange-500 text-white shadow-sm font-extrabold'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Dockets List ({filteredApps.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSubTab('detail')}
                  className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mobileSubTab === 'detail'
                      ? 'bg-orange-500 text-white shadow-sm font-extrabold'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="truncate">
                    {selectedApp ? `Docket: ${selectedApp.id}` : 'Scrutiny Detail'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Applications List (Left 5 Cols) */}
                <div className={`lg:col-span-5 space-y-4 ${mobileSubTab === 'detail' ? 'hidden lg:block' : 'block'}`}>
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ref ID, name, territory..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={filterPathway}
                      onChange={(e) => setFilterPathway(e.target.value)}
                      className="w-1/2 text-xs py-1.5 px-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="all">All Pathways</option>
                      <option value="pan-india">Pan-India</option>
                      <option value="regional">Regional</option>
                      <option value="franchise">Franchise Investor</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-1/2 text-xs py-1.5 px-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="all">All Statuses</option>
                      <option value="payment_submitted">💳 Payment Pending Verification ({stats.pendingPayment})</option>
                      <option value="submitted">Submitted</option>
                      <option value="screening">Screening</option>
                      <option value="due_diligence">Due Diligence</option>
                      <option value="interview_scheduled">Interview</option>
                      <option value="approved">Approved</option>
                      <option value="partner_activated">Activated</option>
                    </select>
                  </div>
                </div>

                {/* List Cards */}
                <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                  {filteredApps.map(app => {
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedApp(app);
                          setMobileSubTab('detail');
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-orange-50/80 border-orange-400 ring-2 ring-blue-500/20 shadow-md'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-orange-950 bg-orange-100 px-2 py-0.5 rounded">
                              {app.id}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">
                              {app.individual.fullName}
                            </h4>
                            <p className="text-xs text-slate-500 truncate max-w-[220px]">
                              {app.business.legalEntityName || app.individual.currentOccupation}
                            </p>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            ['approved', 'partner_activated'].includes(app.status)
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Payment Verification Badges */}
                        {app.paymentStatus === 'submitted' && (
                          <div className="mt-2.5 flex items-center gap-1.5 bg-amber-500/10 border border-amber-300 rounded-lg px-2.5 py-1 text-amber-900">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-bold">
                              ₹2.95L Bank Payment Pending Verification
                            </span>
                          </div>
                        )}
                        {app.paymentStatus === 'completed' && (
                          <div className="mt-2.5 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-medium">
                              Fee Reconciled & Settled
                            </span>
                          </div>
                        )}
                        {app.paymentStatus === 'rejected' && (
                          <div className="mt-2.5 flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-0.5 text-rose-800">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span className="text-[10px] font-medium">
                              Payment Proof Flagged
                            </span>
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="capitalize">{app.pathway.replace('-', ' ')}</span>
                          <span className="truncate max-w-[150px]">
                            {app.territory.isPanIndia ? 'Pan-India' : app.territory.selectedStates.join(', ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scrutiny Detail Inspector (Right 7 Cols) */}
              <div className={`lg:col-span-7 ${mobileSubTab === 'list' ? 'hidden lg:block' : 'block'}`}>
                {selectedApp ? (
                  <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    {/* Mobile Back Button to return to list */}
                    <button
                      type="button"
                      onClick={() => setMobileSubTab('list')}
                      className="lg:hidden w-full px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 shadow-xs mb-2 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-orange-600" />
                      <span>← Back to Dockets List ({filteredApps.length} Applications)</span>
                    </button>

                    {/* Top Scrutiny Action Header */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded">
                            {selectedApp.id}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            Pathway: <strong>{selectedApp.pathway.replace('-', ' ')}</strong>
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 break-words">
                          {selectedApp.business.legalEntityName || selectedApp.individual.fullName}
                        </h2>
                      </div>

                      {/* Administrative Action Trigger - Full wrap responsive */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActionType('approve');
                            setActionNote('');
                            setIsActionModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-center min-w-[125px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Partner</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionType('clarify');
                            setActionNote('');
                            setIsActionModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-center min-w-[130px]"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Clarification</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionType('interview');
                            setActionNote('Executive Interview scheduled with Dr. Dharani on Sept 28, 2026 at 4:00 PM IST.');
                            setIsActionModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-center min-w-[130px]"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Interview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionType('reject');
                            setActionNote('');
                            setIsActionModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-center"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <a
                          href={buildMailtoUrl(selectedApp)}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-center"
                          title={`Email complete application docket to ${GenQuantis_SUPPORT_EMAIL}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-orange-600" />
                          <span>Email Docket</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-center cursor-pointer"
                          title="Print or export comprehensive due diligence dossier"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Print Dossier</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-Navigation Tabs for Scrutiny Monitoring */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
                      {[
                        { id: 'profile', label: 'Applicant & KYC', icon: Users, count: `${selectedApp.individual.totalExperienceYears}y exp` },
                        { id: 'entity', label: 'Corporate Entity', icon: Building2, count: selectedApp.business.isApplyingAsEntity ? selectedApp.business.entityType || 'Entity' : 'Individual' },
                        { id: 'territory', label: 'Territory Scope', icon: MapPin, count: selectedApp.territory.isPanIndia ? 'Pan-India' : `${selectedApp.territory.selectedStates.length} States` },
                        { id: 'declarations', label: 'Statutory Declarations', icon: ShieldCheck, count: '5 Signed' },
                        { id: 'documents', label: 'Document Vault', icon: FileCheck, count: `${selectedApp.documents.filter(d => d.status === 'verified').length}/${selectedApp.documents.length}` },
                        { id: 'financials', label: 'Fee Reconcilement', icon: CreditCard, count: selectedApp.paymentStatus.toUpperCase() },
                        { id: 'audit', label: 'Audit Trail', icon: Clock, count: selectedApp.auditLogs?.length || 0 },
                        { id: 'all', label: 'Full Dossier (All Data)', icon: FileText, count: 'Complete' }
                      ].map(t => {
                        const Icon = t.icon;
                        const isCurrent = docketSubTab === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setDocketSubTab(t.id as any)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                              isCurrent
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm font-bold'
                                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-orange-600'}`} />
                            <span>{t.label}</span>
                            {t.count && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                                isCurrent ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                              }`}>
                                {t.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* SECTION 1: APPLICANT IDENTITY & KYC */}
                    {(docketSubTab === 'profile' || docketSubTab === 'all') && (
                      <div className="space-y-4 animate-fade-in">
                        {docketSubTab === 'all' && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                            <Users className="w-4 h-4 text-orange-600" />
                            <span>1. Individual Profile & KYC Scrutiny</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Personal Identity Card */}
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Users className="w-3.5 h-3.5 text-orange-600" />
                              <span>Personal Identification & Biometrics</span>
                            </h4>
                            <div className="space-y-1.5 text-slate-700">
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Legal Full Name:</span>
                                <span className="font-bold text-slate-900">{selectedApp.individual.fullName}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Govt ID Match Name:</span>
                                <span className="font-semibold text-slate-900">{selectedApp.individual.nameAsPerGovtId || selectedApp.individual.fullName}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Date of Birth / Gender:</span>
                                <span className="font-medium text-slate-800">{selectedApp.individual.dob || '—'} ({selectedApp.individual.gender || '—'})</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Nationality:</span>
                                <span className="font-medium text-slate-800">{selectedApp.individual.nationality || 'Indian'}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500">Current Occupation:</span>
                                <span className="font-semibold text-slate-900">{selectedApp.individual.currentOccupation || '—'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Contact & Residential Coordinates Card */}
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Phone className="w-3.5 h-3.5 text-orange-600" />
                              <span>Verified Communication & Address</span>
                            </h4>
                            <div className="space-y-1.5 text-slate-700">
                              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Mobile Phone:</span>
                                <div className="flex items-center gap-1.5">
                                  <a href={`tel:${selectedApp.individual.mobile}`} className="font-bold text-orange-700 hover:underline">
                                    {selectedApp.individual.mobile}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyField(selectedApp.individual.mobile, 'mobile')}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                                    title="Copy mobile number"
                                  >
                                    {copiedField === 'mobile' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">WhatsApp:</span>
                                <span className="font-semibold text-slate-800">{selectedApp.individual.whatsapp || selectedApp.individual.mobile}</span>
                              </div>
                              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Email Address:</span>
                                <div className="flex items-center gap-1.5">
                                  <a href={`mailto:${selectedApp.individual.email}`} className="font-bold text-orange-700 hover:underline">
                                    {selectedApp.individual.email}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyField(selectedApp.individual.email, 'email')}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                                    title="Copy email"
                                  >
                                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                              <div className="py-1 border-b border-slate-50">
                                <span className="text-slate-500 block">Permanent Residence:</span>
                                <span className="font-medium text-slate-800 mt-0.5 block">{selectedApp.individual.residentialAddress || '—'}</span>
                              </div>
                              <div className="py-1">
                                <span className="text-slate-500 block">Correspondence Address:</span>
                                <span className="font-medium text-slate-800 mt-0.5 block">{selectedApp.individual.correspondenceAddress || selectedApp.individual.residentialAddress || '—'}</span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  {selectedApp.individual.district ? `${selectedApp.individual.district}, ` : ''}{selectedApp.individual.state || ''} {selectedApp.individual.pincode ? `• PIN: ${selectedApp.individual.pincode}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Qualifications & Experience Matrix */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
                            <span>Academic Qualifications & Professional Experience Breakdown</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Educational Qualifications</span>
                              <p className="font-semibold text-slate-900 leading-relaxed">
                                {selectedApp.individual.educationalQualification || 'Not specified'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Professional & Medical Council Registrations</span>
                              <p className="font-semibold text-slate-900 leading-relaxed">
                                {selectedApp.individual.professionalQualification || 'None declared'}
                              </p>
                            </div>
                          </div>

                          {/* 5-Pillar Experience Matrix */}
                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                              5-Pillar Experience Scorecard:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
                                <span className="text-xl font-extrabold text-orange-600 block">{selectedApp.individual.totalExperienceYears}</span>
                                <span className="text-[10px] font-semibold text-slate-600 uppercase block mt-0.5">Total Years</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                <span className="text-xl font-extrabold text-emerald-600 block">{selectedApp.individual.healthcareExperienceYears}</span>
                                <span className="text-[10px] font-semibold text-slate-600 uppercase block mt-0.5">Healthcare Exp</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                                <span className="text-xl font-extrabold text-blue-600 block">{selectedApp.individual.businessExperienceYears}</span>
                                <span className="text-[10px] font-semibold text-slate-600 uppercase block mt-0.5">Business Exp</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                                <span className="text-xl font-extrabold text-amber-600 block">{selectedApp.individual.franchiseExperienceYears}</span>
                                <span className="text-[10px] font-semibold text-slate-600 uppercase block mt-0.5">Franchise Exp</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                                <span className="text-xl font-extrabold text-purple-600 block">{selectedApp.individual.channelPartnerExperienceYears}</span>
                                <span className="text-[10px] font-semibold text-slate-600 uppercase block mt-0.5">Distribution Exp</span>
                              </div>
                            </div>
                          </div>

                          {/* Existing Business Interests & Social Profile */}
                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-100">
                            <div>
                              <span className="text-slate-500 font-medium block">Existing Commercial Interests:</span>
                              <p className="font-medium text-slate-800 mt-0.5">
                                {selectedApp.individual.existingBusinessInterests || 'No other commercial enterprises declared.'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500 font-medium block">Professional Profile URL:</span>
                              {selectedApp.individual.linkedinProfile ? (
                                <a
                                  href={selectedApp.individual.linkedinProfile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-orange-600 hover:underline inline-flex items-center gap-1 mt-0.5 break-all"
                                >
                                  <span>{selectedApp.individual.linkedinProfile}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className="text-slate-400 mt-0.5 block">Not provided</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Professional & Character References */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                            <span>Professional Due Diligence References</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-orange-600 block">Primary Reference</span>
                              <p className="font-bold text-slate-900">{selectedApp.individual.reference1Name || 'Not supplied'}</p>
                              <div className="flex items-center gap-2 text-slate-600">
                                <span className="text-[11px]">Contact:</span>
                                <a href={`tel:${selectedApp.individual.reference1Contact}`} className="font-mono font-semibold text-orange-700 hover:underline">
                                  {selectedApp.individual.reference1Contact || '—'}
                                </a>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                <strong>Relationship:</strong> {selectedApp.individual.reference1Relation || 'Not specified'}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Secondary Reference</span>
                              <p className="font-bold text-slate-900">{selectedApp.individual.reference2Name || 'None provided'}</p>
                              {selectedApp.individual.reference2Contact && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <span className="text-[11px]">Contact:</span>
                                  <a href={`tel:${selectedApp.individual.reference2Contact}`} className="font-mono font-semibold text-orange-700 hover:underline">
                                    {selectedApp.individual.reference2Contact}
                                  </a>
                                </div>
                              )}
                              <p className="text-[11px] text-slate-500">
                                Secondary referee for clinical background verification.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: CORPORATE ENTITY & LEGAL PROFILE */}
                    {(docketSubTab === 'entity' || docketSubTab === 'all') && (
                      <div className="space-y-4 animate-fade-in">
                        {docketSubTab === 'all' && (
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 text-sm font-bold text-slate-900">
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>2. Corporate Entity, MCA & Tax Scrutiny</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Corporate Constitution */}
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Building className="w-3.5 h-3.5 text-orange-600" />
                              <span>Entity Constitution & Registration</span>
                            </h4>
                            <div className="space-y-1.5 text-slate-700">
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Applying Mode:</span>
                                <span className="font-bold text-slate-900">{selectedApp.business.isApplyingAsEntity ? 'Registered Business Entity' : 'Individual / Proprietor'}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Legal Entity Name:</span>
                                <span className="font-bold text-slate-900">{selectedApp.business.legalEntityName || 'Individual Applicant'}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Trade / Brand Name:</span>
                                <span className="font-semibold text-slate-800">{selectedApp.business.tradeBrandName || selectedApp.business.legalEntityName || '—'}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Constitution / Entity Type:</span>
                                <span className="font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[11px]">{selectedApp.business.entityType || '—'}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Date of Incorporation:</span>
                                <span className="font-medium text-slate-800">{selectedApp.business.dateOfIncorporation || '—'}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500">Years in Active Operation:</span>
                                <span className="font-bold text-slate-900">{selectedApp.business.yearsInOperation || 0} Years</span>
                              </div>
                            </div>
                          </div>

                          {/* Tax Identifiers & Signatory */}
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <FileCheck2 className="w-3.5 h-3.5 text-orange-600" />
                              <span>Statutory Tax & Regulatory IDs</span>
                            </h4>
                            <div className="space-y-1.5 text-slate-700">
                              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">15-Digit GSTIN:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-900">{selectedApp.business.gstin || 'Not registered'}</span>
                                  {selectedApp.business.gstin && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyField(selectedApp.business.gstin || '', 'gstin')}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                                      title="Copy GSTIN"
                                    >
                                      {copiedField === 'gstin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">CIN / Entity PAN:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-900">{selectedApp.business.cinOrPan || '—'}</span>
                                  {selectedApp.business.cinOrPan && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyField(selectedApp.business.cinOrPan || '', 'cin')}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                                      title="Copy CIN/PAN"
                                    >
                                      {copiedField === 'cin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Authorised Signatory:</span>
                                <span className="font-bold text-slate-900">{selectedApp.business.authorisedSignatoryName || selectedApp.individual.fullName}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-500">Corporate Designation:</span>
                                <span className="font-semibold text-slate-800">{selectedApp.business.authorisedSignatoryDesignation || 'Director'}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500">Investment Commitment:</span>
                                <span className="font-extrabold text-orange-600">{selectedApp.business.investmentCapacity || '—'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Addresses & Web Channels */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-xs">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" />
                            <span>Corporate Locations & Web Footprint</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-slate-500 font-medium block">Registered Corporate Office:</span>
                              <p className="font-medium text-slate-900 leading-relaxed">
                                {selectedApp.business.registeredOffice || selectedApp.individual.residentialAddress || '—'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-500 font-medium block">Operating Clinics & Facilities:</span>
                              <p className="font-medium text-slate-900 leading-relaxed">
                                {selectedApp.business.operatingOffice || 'Identical to registered office'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                            <div>
                              <span className="text-slate-500 block">Corporate Website:</span>
                              {selectedApp.business.website ? (
                                <a href={selectedApp.business.website} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-600 hover:underline inline-flex items-center gap-1 mt-0.5">
                                  <span>{selectedApp.business.website}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-400 mt-0.5 block">None</span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500 block">Corporate Email:</span>
                              <a href={`mailto:${selectedApp.business.corporateEmail || selectedApp.individual.email}`} className="font-bold text-slate-800 hover:underline mt-0.5 block">
                                {selectedApp.business.corporateEmail || selectedApp.individual.email}
                              </a>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Telephone / Board Line:</span>
                              <span className="font-medium text-slate-800 mt-0.5 block font-mono">
                                {selectedApp.business.telephone || selectedApp.individual.mobile}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ownership, Directors & Staff Allocation */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <Users className="w-3.5 h-3.5 text-orange-600" />
                            <span>Shareholding, Leadership & Human Capital</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Promoters & Directors (Equity Breakdown)</span>
                              <p className="font-semibold text-slate-900 leading-relaxed">
                                {selectedApp.business.promotersDirectors || 'Sole Promotorship (100%)'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Key Management & Executive Leads</span>
                              <p className="font-semibold text-slate-900 leading-relaxed">
                                {selectedApp.business.keyManagement || 'Direct Promoters Execution'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                              <span className="text-slate-600 font-medium">Current Total Workforce:</span>
                              <span className="text-base font-extrabold text-slate-900">{selectedApp.business.teamStrength || 0} Staff</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/80 border border-orange-200/80">
                              <span className="text-orange-950 font-medium">Proposed Dedicated GenQuantis Staff:</span>
                              <span className="text-base font-extrabold text-orange-600">{selectedApp.business.proposedTeamStrength || 0} Personnel</span>
                            </div>
                          </div>
                        </div>

                        {/* Healthcare Diagnostics Capabilities & Footprint */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                            <span>Healthcare Capabilities & Clinical Footprint</span>
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <span className="text-slate-500 font-medium block">Principal Business Activities:</span>
                              <p className="font-medium text-slate-900 mt-0.5 leading-relaxed">
                                {selectedApp.business.principalActivities || 'Clinical laboratory operations, preventive diagnostic health checks, and doctor distribution networks.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Existing Locations & Facilities</span>
                                <p className="font-medium text-slate-800">
                                  {selectedApp.business.existingLocations || 'Primary city presence'}
                                </p>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Geographic Network Presence</span>
                                <p className="font-medium text-slate-800">
                                  {selectedApp.business.geographicPresence || 'Statewide clinical reach'}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-200/60 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-orange-800 block">Clinical Infrastructure & Diagnostic Equipment Capabilities:</span>
                              <p className="text-slate-700 leading-relaxed">
                                {selectedApp.business.infrastructureCapability || 'Fully compliant with clinical pathology, AI automated diagnostic screening, and cold-chain sample logistics.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 3: PROPOSED TERRITORY & NETWORK */}
                    {(docketSubTab === 'territory' || docketSubTab === 'all') && (
                      <div className="space-y-4 animate-fade-in">
                        {docketSubTab === 'all' && (
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 text-sm font-bold text-slate-900">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span>3. Proposed Healthcare Territory Scope</span>
                          </div>
                        )}

                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                                <span>Operational Territory Allocation</span>
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Defined geographical boundary for GenQuantis™ diagnostic clinics and distribution rights.
                              </p>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                              selectedApp.territory.isPanIndia 
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              {selectedApp.territory.isPanIndia ? 'Pan-India Master Territory' : `Regional: ${selectedApp.territory.selectedStates.length} States / UTs`}
                            </span>
                          </div>

                          {/* State Badges Grid */}
                          <div>
                            <span className="text-slate-500 font-semibold block mb-2 text-[11px]">
                              {selectedApp.territory.isPanIndia 
                                ? 'Master Coverage: All 36 States & Union Territories of India' 
                                : `Assigned States & Union Territories (${selectedApp.territory.selectedStates.length}):`}
                            </span>

                            {selectedApp.territory.isPanIndia ? (
                              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 flex items-center gap-3">
                                <Globe className="w-8 h-8 text-orange-600 flex-shrink-0" />
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">All-India Distribution & Strategic Partnership</p>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    Authorised to introduce, appoint, and oversee regional franchise clinics across North, South, East, West, and Central India.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {selectedApp.territory.selectedStates.length > 0 ? (
                                  selectedApp.territory.selectedStates.map((st) => (
                                    <span
                                      key={st}
                                      className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 font-semibold text-xs border border-orange-200 flex items-center gap-1.5"
                                    >
                                      <MapPin className="w-3 h-3 text-orange-500" />
                                      <span>{st}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">No specific states pre-selected. Defaulting to headquarters zonal allocation.</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Strategy & Notes */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Proposed Footprint & Regional Logistics Strategy:
                            </span>
                            <p className="text-slate-700 leading-relaxed font-medium">
                              {selectedApp.territory.notes || 'Operating within clinical infrastructure guidelines with prioritized expansion into tier-2/3 diagnostic deserts.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 4: STATUTORY DECLARATIONS & LEGAL COMPLIANCE */}
                    {(docketSubTab === 'declarations' || docketSubTab === 'all') && (
                      <div className="space-y-4 animate-fade-in">
                        {docketSubTab === 'all' && (
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 text-sm font-bold text-slate-900">
                            <ShieldCheck className="w-4 h-4 text-orange-600" />
                            <span>4. Statutory Compliance & Digitally Signed Declarations</span>
                          </div>
                        )}

                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-orange-600" />
                                <span>Statutory Declarations & Integrity Covenant</span>
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Digitally consented and logged by the applicant during submission.
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 inline-flex items-center gap-1 self-start sm:self-auto">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>5/5 Complied & Executed</span>
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {[
                              {
                                title: 'Truthful & Transparent Disclosure Declaration',
                                desc: 'Affirmed under statutory accountability that all personal credentials, medical qualifications, business financial figures, and corporate documents submitted are genuine, complete, and verifiable.'
                              },
                              {
                                title: 'Speculative ROI Non-Guarantee Acknowledgment',
                                desc: 'Formally acknowledged that clinical diagnostics revenues depend on doctor adoption, lab throughput, and quality operations, with no fixed or guaranteed financial returns promised by GenQuantis™.'
                              },
                              {
                                title: 'Prohibition on Unauthorized Sub-Franchise Granting',
                                desc: 'Agreed that authority to appoint channel partners, grant clinical territory licenses, and sign diagnostic memorandums rests exclusively with GenQuantis Headquarters.'
                              },
                              {
                                title: 'Anti-Fraud & Healthcare Regulatory Compliance',
                                desc: 'Pledged strict compliance with the Clinical Establishments Act, AERB/PCPNDT diagnostic regulations, ICMR ethical standards, and zero tolerance for doctor kickbacks.'
                              },
                              {
                                title: 'Comprehensive Due Diligence & MCA Verification Consent',
                                desc: 'Granted unconditional consent to the GenQuantis Scrutiny Board to verify bank records, MCA filings, court records, and conduct reference checks with declared institutions.'
                              }
                            ].map((item, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 font-bold" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 block">{item.title}</span>
                                  <p className="text-slate-600 text-[11px] leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Digital Signing Metadata */}
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 bg-slate-50/60 p-3 rounded-xl">
                            <div>
                              <span>Digitally Executed by: </span>
                              <strong className="text-slate-800">{selectedApp.business.authorisedSignatoryName || selectedApp.individual.fullName}</strong>
                            </div>
                            <div>
                              <span>Application Docket Ref: </span>
                              <strong className="font-mono text-orange-700">{selectedApp.id}</strong>
                            </div>
                            <div>
                              <span>Timestamp: </span>
                              <strong className="text-slate-700">{new Date(selectedApp.createdAt).toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 5: DOCUMENTS SCRUTINIZED */}
                    {(docketSubTab === 'documents' || docketSubTab === 'all') && (
                      <div className="space-y-3 animate-fade-in">
                        {docketSubTab === 'all' && (
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 text-sm font-bold text-slate-900">
                            <FileCheck className="w-4 h-4 text-orange-600" />
                            <span>5. Document Scrutiny & KYC Vault ({selectedApp.documents.length})</span>
                          </div>
                        )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-orange-600" />
                          <span>Document Scrutiny & KYC Vault ({selectedApp.documents.length})</span>
                        </h4>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {selectedApp.documents.filter(d => d.status === 'verified').length} / {selectedApp.documents.length} Verified
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedApp.documents.map(doc => (
                          <div 
                            key={doc.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 text-xs transition-all gap-3"
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 truncate">{doc.name}</span>
                                  {doc.isMandatory && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                      Mandatory
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                                  <span className="font-mono text-slate-700 truncate">{doc.fileName || 'Pending applicant attachment'}</span>
                                  {doc.fileSize && <span>• {doc.fileSize}</span>}
                                  {doc.uploadedAt && <span>• {doc.uploadedAt}</span>}
                                </div>
                                {doc.status === 'rejected' && doc.rejectionReason && (
                                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 w-fit">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                    <span>Reason: {doc.rejectionReason}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 w-full sm:w-auto justify-between sm:justify-end">
                              {/* Status Badge */}
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                                doc.status === 'verified' 
                                  ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' 
                                  : doc.status === 'rejected'
                                  ? 'bg-rose-100/80 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100/80 text-amber-800 border border-amber-200'
                              }`}>
                                {doc.status}
                              </span>

                              <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 justify-end">
                                {/* Preview / View Document Button */}
                                <button
                                  type="button"
                                  onClick={() => handlePreviewDocument(doc)}
                                  disabled={loadingDocId === doc.id}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                  title="Click to open and inspect this document"
                                >
                                  {loadingDocId === doc.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                  <span>View Document</span>
                                </button>

                                {/* Quick Mark Verified Toggle */}
                                {doc.status !== 'verified' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDocumentStatus(doc.id, 'verified')}
                                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                    title="Approve / Mark Verified"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDocumentStatus(doc.id, 'pending')}
                                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                                    title="Mark as Pending Review"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* SECTION 6: FINANCIAL RECONCILEMENT & ONBOARDING FEES */}
                    {(docketSubTab === 'financials' || docketSubTab === 'all') && (
                      <div className="space-y-4 animate-fade-in">
                        {docketSubTab === 'all' && (
                          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 text-sm font-bold text-slate-900">
                            <CreditCard className="w-4 h-4 text-orange-600" />
                            <span>6. Financial Due Diligence & Bank Reconcilement</span>
                          </div>
                        )}

                        {/* Feedback Toast if verification / rejection just happened */}
                        {paymentActionFeedback && (
                          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-fade-in ${
                            paymentActionFeedback.success 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {paymentActionFeedback.success ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                            )}
                            <p className="font-medium">{paymentActionFeedback.message}</p>
                          </div>
                        )}

                        {/* Official SBI Bank Transfer Verification & Reconciliation Panel */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-orange-50 text-orange-950 border border-orange-100">
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">
                              ₹2.5L Onboarding Fee Settlement (State Bank of India Manual Reconciliation)
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Target Beneficiary: <strong>GENQUANTIS PRIVATE LIMITED</strong> • SBI A/C: <strong>45216693371</strong> (KPHB Branch)
                            </p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto ${
                          selectedApp.paymentStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedApp.paymentStatus === 'submitted'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : selectedApp.paymentStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedApp.paymentStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {selectedApp.paymentStatus === 'submitted' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {selectedApp.paymentStatus === 'rejected' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          {selectedApp.paymentStatus === 'completed'
                            ? 'Settled & Verified ✓'
                            : selectedApp.paymentStatus === 'submitted'
                              ? 'Awaiting Manual Verification'
                              : selectedApp.paymentStatus === 'rejected'
                                ? 'Proof Flagged (Discrepancy)'
                                : 'Payment Pending'}
                        </span>
                      </div>

                      {/* CASE A: APPLICANT SUBMITTED PAYMENT PROOF -> ADMIN VERIFICATION ACTION REQUIRED */}
                      {selectedApp.paymentStatus === 'submitted' && (
                        <div className="p-5 bg-gradient-to-br from-amber-50/70 via-blue-50/40 to-slate-50 rounded-2xl border border-amber-200/80 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span>Manual Credit Scrutiny Required</span>
                            </div>
                            <span className="text-xs font-bold text-orange-950 bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
                              Payable: ₹2,95,000.00 (Incl. 18% GST)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-amber-200/60 shadow-sm">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported UTR / Txn Ref</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-bold text-orange-950 text-xs">
                                  {selectedApp.paymentDetails?.utrNumber || selectedApp.paymentDetails?.transactionId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUtr(selectedApp.paymentDetails?.utrNumber || selectedApp.paymentDetails?.transactionId || '')}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                  title="Copy UTR"
                                >
                                  {copiedUtr ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Transfer Mode</span>
                              <span className="font-semibold text-slate-900 mt-0.5 block">
                                {selectedApp.paymentDetails?.paymentMode || 'NEFT/RTGS'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Remitter / Depositor</span>
                              <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                                {selectedApp.paymentDetails?.payerName || selectedApp.individual.fullName}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Remitting Bank</span>
                              <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                                {selectedApp.paymentDetails?.payerBank || 'Not specified'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted At</span>
                              <span className="text-slate-600 mt-0.5 block">
                                {new Date(selectedApp.paymentDetails?.submittedAt || '').toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Receipt / Proof</span>
                              {selectedApp.paymentDetails?.paymentProofUrl ? (
                                <button
                                  type="button"
                                  onClick={handlePreviewPaymentProof}
                                  className="text-orange-600 hover:text-orange-800 font-semibold underline text-xs mt-0.5 flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Receipt ({selectedApp.paymentDetails.paymentProofName || 'File'})</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-xs mt-0.5 block">None uploaded</span>
                              )}
                            </div>
                          </div>

                          {/* Verification Instructions Note */}
                          <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200 text-[11px] text-orange-950 space-y-1">
                            <p className="font-bold">Reconciliation Checklist for Admin:</p>
                            <p>1. Open SBI NetBanking / Corporate portal for A/C <strong>45216693371</strong>.</p>
                            <p>2. Verify credit of <strong>₹2,95,000.00</strong> with narration matching UTR <strong>{selectedApp.paymentDetails?.utrNumber}</strong>.</p>
                            <p>3. If credit is confirmed, click <strong>"Verify Payment Received ✓"</strong> to issue tax invoice and unlock applicant training.</p>
                          </div>

                          {/* Action Buttons - Stacked on Mobile */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              disabled={isVerifyingPayment}
                              onClick={() => handleAdminVerifyPayment(selectedApp.id)}
                              className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 text-center"
                            >
                              {isVerifyingPayment ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Reconciling & Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Verify Payment Received (Confirm SBI Credit) ✓</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsRejectingPayment(!isRejectingPayment)}
                              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs transition-all flex items-center gap-1.5 text-center"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{isRejectingPayment ? 'Cancel Flag' : 'Flag Discrepancy / Reject Proof ✗'}</span>
                            </button>
                          </div>

                          {/* Inline Rejection Drawer */}
                          {isRejectingPayment && (
                            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3 mt-3 animate-fade-in">
                              <span className="text-xs font-bold text-rose-900 block">
                                Select or Enter Discrepancy Reason for Applicant:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  'UTR not found in SBI account statement',
                                  'Amount credited is less than ₹2,95,000',
                                  'Payer name does not match applicant profile',
                                  'Payment proof receipt is illegible or blurred',
                                  'Transaction reported as failed/reversed by bank'
                                ].map((reason, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPaymentRejectReason(reason)}
                                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                                      paymentRejectReason === reason
                                        ? 'bg-rose-600 text-white border-rose-600 font-bold'
                                        : 'bg-white hover:bg-rose-100 text-rose-800 border-rose-200'
                                    }`}
                                  >
                                    {reason}
                                  </button>
                                ))}
                              </div>

                              <textarea
                                rows={2}
                                value={paymentRejectReason}
                                onChange={(e) => setPaymentRejectReason(e.target.value)}
                                placeholder="Type custom discrepancy explanation for the applicant..."
                                className="w-full p-2.5 text-xs rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                              />

                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsRejectingPayment(false)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdminRejectPayment(selectedApp.id)}
                                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                                >
                                  Confirm Discrepancy & Notify Applicant
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CASE B: PAYMENT SETTLED & VERIFIED */}
                      {selectedApp.paymentStatus === 'completed' && (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Payment Reconciled & Settled into SBI Account 45216693371
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-emerald-200">
                              {selectedApp.paymentDetails?.invoiceNo}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-950 pt-1">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Settled Amount:</span>
                              <strong>₹2,95,000.00</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">UTR / Txn Ref:</span>
                              <strong className="font-mono">{selectedApp.paymentDetails?.utrNumber || selectedApp.paymentDetails?.transactionId}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Verified By:</span>
                              <strong>{selectedApp.paymentDetails?.verifiedBy || 'Finance Board'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Verified On:</span>
                              <strong>{new Date(selectedApp.paymentDetails?.verifiedAt || selectedApp.paymentDetails?.paidAt || '').toLocaleDateString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CASE C: PAYMENT FLAGGED / REJECTED */}
                      {selectedApp.paymentStatus === 'rejected' && (
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 text-rose-900 font-bold">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>Payment Proof Flagged as Discrepancy</span>
                          </div>
                          <p className="text-rose-800">
                            <strong>Reason:</strong> {selectedApp.paymentDetails?.adminNote || 'Transaction could not be verified in State Bank of India records.'}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            Applicant has been notified on their dashboard to verify their transfer details and re-submit UTR.
                          </p>
                        </div>
                      )}

                      {/* CASE D: PENDING SUBMISSION */}
                      {(selectedApp.paymentStatus === 'pending' || selectedApp.paymentStatus === 'unbilled') && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">Awaiting Bank Transfer from Applicant</span>
                            <p className="text-slate-500 text-[11px]">
                              Applicant has been instructed to wire ₹2,95,000 to SBI A/C 45216693371 and submit their UTR.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdminVerifyPayment(selectedApp.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition-all self-start sm:self-auto border border-slate-300"
                            title="Direct manual override if payment received offline"
                          >
                            Mark Paid Directly (Manual Override)
                          </button>
                        </div>
                      )}

                      {/* Sub-card: Agreement & Training Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Training Curriculum</span>
                          <span className="font-bold text-slate-900 capitalize block mt-0.5">
                            {selectedApp.trainingStatus?.replace(/_/g, ' ') || 'Pending Payment'}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Partnership Contract</span>
                          <span className="font-bold text-slate-900 capitalize block mt-0.5">
                            {selectedApp.agreementStatus || 'Drafting'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 7: DOCKET SCRUTINY AUDIT TRAIL */}
                {(docketSubTab === 'audit' || docketSubTab === 'all') && (
                  <div className="space-y-4 animate-fade-in">
                    {docketSubTab === 'all' && (
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-200 text-sm font-bold text-slate-900">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>7. Scrutiny Board Audit Log & Due Diligence Milestones</span>
                      </div>
                    )}

                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-orange-600" />
                            <span>Complete Immutable Audit Trail</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Chronological timestamped scrutiny records for Docket {selectedApp.id}.
                          </p>
                        </div>

                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {selectedApp.auditLogs?.length || 0} Actions Recorded
                        </span>
                      </div>

                      {/* Status Timeline Progression */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Diligence Milestones Progression:
                        </span>
                        <div className="space-y-1.5">
                          {selectedApp.statusTimeline?.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                              <div className="min-w-0 flex-grow">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-800">{item.label}</span>
                                  {item.completedAt && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(item.completedAt).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                                {item.note && <p className="text-slate-500 mt-0.5">{item.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Audit Event History */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Executive Audit Event History:
                        </span>
                        {selectedApp.auditLogs && selectedApp.auditLogs.length > 0 ? (
                          selectedApp.auditLogs.map((log) => (
                            <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{log.action}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(log.timestamp).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                              <span className="text-[10px] font-semibold text-orange-700 block">
                                Performer: {log.performedBy}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-[11px]">No additional audit logs recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                    Select an application from the list to inspect credentials.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* TAB 2: TERRITORY DENSITY MAP */}
          {activeTab === 'territory-map' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">National Healthcare Territory Allocation</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Inspect proposed vs approved regional coverage across all 28 states and 8 union territories.
                </p>

                <IndiaTerritoryMap
                  selectedStates={Array.from(new Set(applications.flatMap(a => a.territory.selectedStates)))}
                  isPanIndia={false}
                  onSelectionChange={() => {}}
                  readOnly={true}
                  territoryType="approved"
                />
              </div>
            </div>
          )}

          {/* TAB 3: INVESTOR LEAD REGISTRY */}
          {activeTab === 'leads' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Central Franchise Investor Lead Registry</h3>
                <p className="text-xs text-slate-500">
                  Screen all prospective investors introduced by Pan-India & Regional Channel Partners. Prevents duplicate lead disputes and unauthorized ROI promises.
                </p>
              </div>

              {/* Mobile Lead Cards (Visible on screens < md) */}
              <div className="block md:hidden space-y-3">
                {leads.map(lead => (
                  <div key={lead.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-orange-950 bg-orange-100 px-2 py-0.5 rounded">
                          {lead.id}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{lead.investorName}</h4>
                        {lead.entityName && <p className="text-slate-500 font-medium text-[11px]">{lead.entityName}</p>}
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        lead.status === 'approved' || lead.status === 'agreement_signed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Territory</span>
                        <span className="font-medium text-slate-800">{lead.territory}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Budget</span>
                        <span className="font-bold text-emerald-700">{lead.investmentBudget}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Introducing Partner</span>
                        <span className="text-slate-700 font-medium">{lead.introducingPartnerName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Contact Details</span>
                        <span className="text-slate-700">{lead.contactNumber} • {lead.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenLeadReview(lead)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Review Lead Dossier</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Lead Table (Visible on md and larger) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Lead Ref</th>
                      <th className="pb-3">Investor Profile</th>
                      <th className="pb-3">Introducing Channel Partner</th>
                      <th className="pb-3">Proposed Territory</th>
                      <th className="pb-3">Budget</th>
                      <th className="pb-3">Date Registered</th>
                      <th className="pb-3">Management Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-orange-950">{lead.id}</td>
                        <td className="py-3.5">
                          <span className="font-semibold text-slate-900 block">{lead.investorName}</span>
                          <span className="text-[11px] text-slate-500">{lead.contactNumber} • {lead.email}</span>
                        </td>
                        <td className="py-3.5 text-slate-700 font-medium">{lead.introducingPartnerName}</td>
                        <td className="py-3.5 text-slate-700">{lead.territory}</td>
                        <td className="py-3.5 text-slate-700 font-semibold">{lead.investmentBudget}</td>
                        <td className="py-3.5 text-slate-500">{new Date(lead.dateIntroduced).toLocaleDateString()}</td>
                        <td className="py-3.5">
                          <button
                            type="button"
                            onClick={() => handleOpenLeadReview(lead)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Review Lead</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOG */}
          {activeTab === 'audit-log' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-lg font-bold text-slate-900">National Compliance & Decision Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Cryptographically timestamped record of all administrative evaluations, status transitions, and payments.
                </p>
              </div>

              <div className="space-y-3">
                {applications.flatMap(a => a.auditLogs.map(l => ({ ...l, docketId: a.id }))).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-orange-950 bg-orange-100 px-2 py-0.5 rounded">
                          {log.docketId}
                        </span>
                        <span className="font-bold text-slate-900">{log.action}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1">{log.details}</p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-700 block">{log.performedBy}</span>
                      <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Drawer / Modal */}
      {isActionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fade-in-up space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Action Scrutiny Order
              </span>
              <h3 className="text-xl font-bold text-slate-900 capitalize mt-1">
                {actionType === 'approve' ? 'Approve Appointment' : actionType === 'reject' ? 'Disapprove Application' : actionType === 'interview' ? 'Schedule Executive Interview' : 'Issue Official Clarification'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Target: <strong>{selectedApp.individual.fullName}</strong> ({selectedApp.id})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Executive Notes & Official Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter detailed directives, interview calendar details, or required clarification points..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={`px-6 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-colors ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                  'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
                }`}
              >
                Commit & Log Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Review & Due Diligence Modal */}
      {selectedLeadForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fade-in-up space-y-6 my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-950 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200">
                    {selectedLeadForReview.id}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                    selectedLeadForReview.status === 'approved' || selectedLeadForReview.status === 'agreement_signed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedLeadForReview.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedLeadForReview.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedLeadForReview.investorName}
                </h3>
                {selectedLeadForReview.entityName && (
                  <p className="text-xs text-slate-500 font-medium">
                    Legal Entity: {selectedLeadForReview.entityName}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedLeadForReview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Investor Key Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <a href={`tel:${selectedLeadForReview.contactNumber}`} className="hover:underline text-orange-600">
                    {selectedLeadForReview.contactNumber}
                  </a>
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <a href={`mailto:${selectedLeadForReview.email}`} className="hover:underline text-orange-600 truncate">
                    {selectedLeadForReview.email}
                  </a>
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposed Territory</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedLeadForReview.territory}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Investment Budget</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedLeadForReview.investmentBudget}
                </span>
              </div>
            </div>

            {/* Introducing Partner Attribution & Exclusivity Notice */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-950 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-orange-700" />
                  Introducing Partner Attribution:
                </span>
                <span className="text-[10px] text-orange-600 font-mono">
                  Introduced: {new Date(selectedLeadForReview.dateIntroduced).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-700 font-medium">
                {selectedLeadForReview.introducingPartnerName}
              </p>
              <p className="text-[11px] text-orange-700/90 pt-1">
                ★ Protected under GenQuantis 180-day Anti-Duplicate Lead Exclusivity. Other partners cannot claim commissions on this prospective investor.
              </p>
            </div>

            {/* Update Status Form */}
            <form onSubmit={handleSaveLeadReview} className="space-y-4">
              {leadUpdateFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{leadUpdateFeedback}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Update Lead Due Diligence Status
                </label>
                <select
                  value={leadReviewStatus}
                  onChange={(e) => setLeadReviewStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="introduced">Introduced — Initial Registration Recorded</option>
                  <option value="screening">Screening — Background & Identity Check</option>
                  <option value="due_diligence">Due Diligence — Land/Site Feasibility Analysis</option>
                  <option value="GenQuantis_review">GenQuantis Review — Board Committee Evaluation</option>
                  <option value="approved">Approved — Cleared for Direct Franchise Negotiation</option>
                  <option value="agreement_signed">Agreement Signed — Smart Diagnostic Center Finalized</option>
                  <option value="rejected">Rejected — Territory Conflict / Budget Inadequate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Executive Notes & Site Assessment
                </label>
                <textarea
                  rows={3}
                  value={leadReviewNotes}
                  onChange={(e) => setLeadReviewNotes(e.target.value)}
                  placeholder="Record site visit feedback, demographic feasibility, or conversation notes with investor..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedLeadForReview.contactNumber}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`mailto:${selectedLeadForReview.email}?subject=GenQuantis%20Franchise%20Investor%20Due%20Diligence%20-%20${selectedLeadForReview.id}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Email</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForReview(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Update Lead Dossier</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Inspection & Scrutiny Viewer Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-y-auto space-y-3 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {previewDoc.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    previewDoc.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : previewDoc.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {previewDoc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Filename: <span className="font-semibold text-slate-800">{previewDoc.fileName}</span> • {previewDoc.fileSize || 'Attached'} • Date: {previewDoc.uploadedAt}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Document Body Preview Area */}
            <div className={`flex-grow overflow-auto p-3 sm:p-4 bg-slate-100/70 rounded-2xl flex flex-col items-center justify-center border border-slate-200/80 relative transition-all duration-200 ${
              isRejectingDoc ? 'min-h-[160px] max-h-[30vh]' : 'min-h-[280px] max-h-[58vh]'
            }`}>
              {previewDoc.fileDataUrl ? (
                previewDoc.fileDataUrl.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(previewDoc.fileName) ? (
                  <div className="flex flex-col items-center w-full h-full">
                    {/* Image Inspection Toolbar */}
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 text-xs flex-shrink-0">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setImgZoom(z => Math.max(0.5, z - 0.25))}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                          title="Zoom Out (-)"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-[11px] font-bold px-2 text-slate-700 min-w-[42px] text-center">
                          {Math.round(imgZoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setImgZoom(z => Math.min(3, z + 0.25))}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                          title="Zoom In (+)"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImgZoom(1); setImgRotation(0); }}
                          className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 border-l border-slate-200"
                          title="Reset View"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setImgRotation(r => (r + 90) % 360)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 border-l border-slate-200 transition-colors flex items-center gap-1"
                          title="Rotate 90 degrees"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono">{imgRotation}°</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={previewDoc.fileDataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                          title="Open full-resolution image in new browser tab"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-orange-600" />
                          <span>Fullscreen in New Tab</span>
                        </a>
                      </div>
                    </div>

                    {/* Viewport */}
                    <div className={`w-full flex-grow overflow-auto flex items-center justify-center p-2 bg-white/60 rounded-xl ${
                      isRejectingDoc ? 'min-h-[110px]' : 'min-h-[220px]'
                    }`}>
                      <img
                        src={previewDoc.fileDataUrl}
                        alt={previewDoc.fileName}
                        style={{
                          transform: `scale(${imgZoom}) rotate(${imgRotation}deg)`,
                          transition: 'transform 0.15s ease-out'
                        }}
                        className={`${isRejectingDoc ? 'max-h-[24vh]' : 'max-h-[48vh]'} max-w-full object-contain rounded-xl shadow-lg border border-slate-200 bg-white`}
                      />
                    </div>
                  </div>
                ) : previewDoc.fileDataUrl.startsWith('data:application/pdf') || /\.pdf$/i.test(previewDoc.fileName) ? (
                  <div className="flex flex-col w-full h-full">
                    {/* PDF Toolbar */}
                    <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs flex-shrink-0">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="font-bold">{previewDoc.fileName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({previewDoc.fileSize || 'PDF'})</span>
                      </div>
                      <a
                        href={previewDoc.fileDataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Open PDF in full browser window"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
                        <span>Open PDF in Full Window</span>
                      </a>
                    </div>
                    <iframe
                      src={previewDoc.fileDataUrl}
                      title={previewDoc.fileName}
                      className={`w-full ${isRejectingDoc ? 'h-[28vh]' : 'h-[50vh]'} rounded-xl border border-slate-300 shadow-sm bg-white transition-all`}
                    />
                  </div>
                ) : (
                  <div className="text-center p-6 bg-white rounded-2xl border border-slate-200 max-w-md shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-200">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{previewDoc.fileName}</h4>
                      <p className="text-xs text-slate-500 mt-1">Binary document attached and ready for offline inspection</p>
                    </div>
                    <a
                      href={previewDoc.fileDataUrl}
                      download={previewDoc.fileName}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-bold text-xs shadow transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Original File</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 max-w-lg shadow-sm space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shadow-inner">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      <ShieldCheck className="w-3 h-3 text-orange-600" />
                      <span>Applicant Attached Record</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {previewDoc.fileName}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      Document attached by applicant <strong>{selectedApp?.individual?.fullName}</strong> ({selectedApp?.id}) during digital application submission.
                    </p>
                  </div>

                  <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-500">Document Type:</span>
                      <span className="font-medium text-slate-900 text-right">{previewDoc.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-500">File Size:</span>
                      <span className="font-medium text-slate-900">{previewDoc.fileSize || 'Attached File'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-500">Submission Date:</span>
                      <span className="font-medium text-slate-900">{previewDoc.uploadedAt}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-500">Scrutiny State:</span>
                      <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                        previewDoc.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : previewDoc.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {previewDoc.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Review applicant disclosures and use the action buttons below to verify or reject this submission.
                  </p>
                </div>
              )}
            </div>

            {/* Document Scrutiny Action Bar */}
            <div className="flex-shrink-0 flex flex-col gap-3 pt-3 border-t border-slate-200">
              {/* Document Rejection Reason Form (When Admin Clicks Reject) */}
              {isRejectingDoc ? (
                <div className="w-full bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 sm:p-4 space-y-2.5 animate-fade-in shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Select or Enter Rejection Reason for "{previewDoc.name}":</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRejectingDoc(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-0.5 rounded-lg hover:bg-rose-100"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  {/* Quick-select chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Illegible or blurry scan / photo',
                      'Expired document / Validity lapsed',
                      'Name mismatch with applicant profile',
                      'Incomplete document (front/back missing)',
                      'Wrong document type uploaded'
                    ].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setDocRejectReason(chip)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                          docRejectReason === chip
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/40'
                            : 'bg-white text-slate-700 hover:bg-rose-100/70 border border-rose-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={docRejectReason}
                    onChange={(e) => setDocRejectReason(e.target.value)}
                    placeholder="Enter specific instructions or reason for applicant..."
                    className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRejectingDoc(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateDocumentStatus(previewDoc.id, 'rejected', docRejectReason)}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Confirm Rejection &amp; Flag for Re-upload</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Document Approval / Reject Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleUpdateDocumentStatus(previewDoc.id, 'verified')}
                      className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                        previewDoc.status === 'verified'
                          ? 'bg-emerald-600 text-white shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{previewDoc.status === 'verified' ? 'Document Verified ✓' : 'Approve & Mark Verified'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRejectingDoc(true);
                        setDocRejectReason(previewDoc.rejectionReason || 'Illegible or blurry scan / photo');
                      }}
                      className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                        previewDoc.status === 'rejected'
                          ? 'bg-rose-600 text-white shadow-rose-500/20 ring-2 ring-rose-400/40'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>{previewDoc.status === 'rejected' ? 'Rejected ✗ (Click to Change)' : 'Reject Document ✗'}</span>
                    </button>
                  </div>

                  {/* Download & Close Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {previewDoc.fileDataUrl ? (
                      <a
                        href={previewDoc.fileDataUrl}
                        download={previewDoc.fileName}
                        className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all text-center"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setPreviewDoc(null)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors text-center"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ManagementDashboard;
