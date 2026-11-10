import emailjs from '@emailjs/browser';
import { PartnerApplication } from '@/types/partnerPortal';
import { API_BASE_URL } from '@/lib/partnerStore';

// Official destination email for headquarters review
export const GENQUANTIS_SUPPORT_EMAIL = 'support@genquantis.com';
export const GenQuantis_SUPPORT_EMAIL = GENQUANTIS_SUPPORT_EMAIL;
export const CURAQUANTIS_SUPPORT_EMAIL = GENQUANTIS_SUPPORT_EMAIL; // backwards compat alias

// EmailJS credentials configured in the project
const EMAILJS_SERVICE_ID = 'service_44qhlxn';
const EMAILJS_TEMPLATE_ID = 'template_mx5w5r8';
const EMAILJS_PUBLIC_KEY = '32yZnVZ4OgNOo6tGM';

export interface EmailDispatchResult {
  sent: boolean;
  channel: 'formsubmit' | 'emailjs' | 'mailto_ready' | 'backend' | 'failed';
  message: string;
  mailtoUrl: string;
  applicantEmail: string;
  applicantMailtoUrl: string;
  applicantEmailSent: boolean;
  supportEmailSent: boolean;
}

/**
 * Formats a clean, direct confirmation email for the applicant with their mandatory Application ID
 */
export function formatApplicantConfirmation(app: PartnerApplication): { subject: string; body: string } {
  const pathwayLabel = 
    app.pathway === 'pan-india' ? 'Pan-India Channel Partner' :
    app.pathway === 'regional' ? 'Regional Channel Partner' :
    'GenQuantis™ Franchise Investor';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
  const loginUrl = `${origin}/portal/login?appId=${encodeURIComponent(app.id)}`;

  const subject = `Your GenQuantis™ Application Reference ID: ${app.id}`;

  const body = `Dear ${app.individual.fullName},

Thank you for applying to partner with GenQuantis™ (${pathwayLabel}).

=====================================================
YOUR MANDATORY APPLICATION REFERENCE ID:
${app.id}
=====================================================

This reference ID is mandatory for your partner journey. You will use this ID to:
1. Log into your Partner Portal
2. Track live due diligence and document verification progress
3. Review and respond to executive clarifications
4. Schedule executive interviews and sign the official agreement

--- 1-CLICK DIRECT PORTAL LOGIN ---
${loginUrl}

APPLICATION SUMMARY:
- Reference Docket ID: ${app.id}
- Applicant Name: ${app.individual.fullName}
- Pathway: ${pathwayLabel}
- Territory: ${app.territory.isPanIndia ? 'Pan-India (All 36 States & UTs)' : app.territory.selectedStates.join(', ') || 'Assigned Territory'}
- Legal Entity: ${app.business.legalEntityName || 'Individual Application'}
- Filing Date: ${new Date(app.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

NEXT STEPS:
1. Save this email for your permanent records.
2. Visit the Partner Portal anytime using your reference ID: ${loginUrl}
3. Our compliance committee will review your attached documents.

For any questions, reach our onboarding team at ${GENQUANTIS_SUPPORT_EMAIL}.

Warm regards,
GenQuantis™ Partner Onboarding Directorate
support@genquantis.com
www.genquantis.com`;

  return { subject, body };
}

/**
 * Builds a direct mailto URI for the applicant to save/email their ID directly
 */
export function buildApplicantMailtoUrl(app: PartnerApplication): string {
  const { subject, body } = formatApplicantConfirmation(app);
  return `mailto:${encodeURIComponent(app.individual.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Formats a comprehensive text summary of the partner application for Headquarters
 */
export function formatApplicationDossier(app: PartnerApplication): { subject: string; body: string } {
  const pathwayLabel = 
    app.pathway === 'pan-india' ? 'Pan-India Channel Partner' :
    app.pathway === 'regional' ? 'Regional Channel Partner' :
    'GenQuantis™ Franchise Investor';

  const territorySummary = app.territory.isPanIndia 
    ? 'Pan-India (All 36 States & UTs)' 
    : app.territory.selectedStates.join(', ') || 'Not specified';

  const verifiedDocs = app.documents
    .filter(d => d.status === 'verified' && d.fileName)
    .map(d => `${d.name} (${d.fileName})`)
    .join(', ') || 'Stored in portal';

  const subject = `[PARTNER APPLICATION - ${app.id}] ${pathwayLabel} - ${app.business.legalEntityName || app.individual.fullName}`;

  const body = `
=====================================================
GENQUANTIS™ OFFICIAL PARTNER DOCKET
Destination: ${GENQUANTIS_SUPPORT_EMAIL}
=====================================================

DOCKET REFERENCE NO: ${app.id}
PATHWAY: ${pathwayLabel}
SUBMISSION DATE: ${new Date(app.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

--- APPLICANT PROFILE ---
Full Legal Name: ${app.individual.fullName}
Name as per Govt ID: ${app.individual.nameAsPerGovtId}
DOB & Gender: ${app.individual.dob} (${app.individual.gender}, ${app.individual.nationality})
Mobile: ${app.individual.mobile}
WhatsApp: ${app.individual.whatsapp}
Email: ${app.individual.email}
Address: ${app.individual.residentialAddress}, ${app.individual.district}, ${app.individual.state} - ${app.individual.pincode}
Current Occupation: ${app.individual.currentOccupation}
Total Experience: ${app.individual.totalExperienceYears} Years (Healthcare: ${app.individual.healthcareExperienceYears} Years)
Franchise Exp: ${app.individual.franchiseExperienceYears} Yrs | Channel Exp: ${app.individual.channelPartnerExperienceYears} Yrs
Primary Reference: ${app.individual.reference1Name} (${app.individual.reference1Contact})

--- CORPORATE ENTITY ---
Legal Entity Name: ${app.business.legalEntityName || 'Individual Application'}
Brand Name: ${app.business.tradeBrandName || 'N/A'}
Constitution: ${app.business.entityType || 'N/A'}
GSTIN: ${app.business.gstin || 'N/A'}
CIN / PAN: ${app.business.cinOrPan || 'N/A'}
Registered Office: ${app.business.registeredOffice || 'N/A'}
Infrastructure: ${app.business.infrastructureCapability || 'N/A'}
Investment Commitment: ${app.business.investmentCapacity || 'N/A'}
Current Team: ${app.business.teamStrength} | Dedicated Team: ${app.business.proposedTeamStrength}

--- PROPOSED TERRITORY ---
Scope: ${territorySummary}
Notes: ${app.territory.notes || 'None'}

--- ATTACHED DOCUMENTS ---
${verifiedDocs}

--- LEGAL DECLARATIONS CERTIFIED ---
[x] Truthful Disclosure & Due Diligence Consent
[x] No-ROI & No Revenue Guarantee Covenant
[x] GenQuantis Sole Appointment Authority
[x] Anti-Fraud & Conflict-of-Interest Declaration
[x] IP Non-Disclosure Agreement

Access this docket in the Scrutiny Console:
${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'}/portal/admin
=====================================================
`.trim();

  return { subject, body };
}

/**
 * Builds a direct mailto URI for manual or 1-click email client dispatch to Headquarters
 */
export function buildMailtoUrl(app: PartnerApplication): string {
  const { subject, body } = formatApplicationDossier(app);
  return `mailto:${GENQUANTIS_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Multi-channel email dispatcher:
 * 1. Dispatches confirmation email DIRECTLY to the applicant with their mandatory Application ID and login link.
 * 2. Dispatches full docket to support@genquantis.com for headquarters review.
 * 3. Records dispatch via backend API.
 */
export async function sendPartnerApplicationEmail(
  app: PartnerApplication
): Promise<EmailDispatchResult> {
  const { subject: hqSubject, body: hqBody } = formatApplicationDossier(app);
  const { subject: applicantSubject, body: applicantBody } = formatApplicantConfirmation(app);
  const supportMailtoUrl = buildMailtoUrl(app);
  const applicantMailtoUrl = buildApplicantMailtoUrl(app);

  let applicantEmailSent = false;
  let supportEmailSent = false;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
  const loginUrl = `${origin}/portal/login?appId=${encodeURIComponent(app.id)}`;

  // 1. Dispatch confirmation directly to Applicant's Email via EmailJS (Primary) & FormSubmit
  if (app.individual.email) {
    try {
      const applicantEmailJsRes = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: app.individual.fullName,
          to_name: app.individual.fullName,
          applicant_name: app.individual.fullName,
          to_email: app.individual.email,
          email: app.individual.email,
          user_email: app.individual.email,
          recipient_email: app.individual.email,
          reply_to: 'support@genquantis.com',
          from_name: 'GenQuantis™ Onboarding Directorate',
          from_email: 'support@genquantis.com',
          phone: app.individual.mobile,
          organisation: app.business.legalEntityName || 'Individual Application',
          designation: app.individual.currentOccupation || 'Partner Applicant',
          experience: `${app.individual.totalExperienceYears} Years (Healthcare: ${app.individual.healthcareExperienceYears} Yrs)`,
          interests: `Pathway: ${app.pathway.toUpperCase()}`,
          application_id: app.id,
          login_link: loginUrl,
          pathway: app.pathway.toUpperCase(),
          territory: app.territory.isPanIndia ? 'Pan-India (All 36 States & UTs)' : app.territory.selectedStates.join(', '),
          filing_date: new Date(app.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          subject: applicantSubject,
          message: applicantBody
        },
        EMAILJS_PUBLIC_KEY
      );

      if (applicantEmailJsRes.status === 200) {
        applicantEmailSent = true;
      }
    } catch (err) {
      console.warn('[Applicant EmailJS Dispatch Notice]', err);
    }

    // Secondary FormSubmit dispatch
    try {
      const applicantRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(app.individual.email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: applicantSubject,
          _template: 'table',
          _captcha: 'false',
          application_id: app.id,
          applicant_name: app.individual.fullName,
          login_link: loginUrl,
          pathway: app.pathway.toUpperCase(),
          date_filed: new Date(app.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          message: applicantBody
        })
      });

      const data = await applicantRes.json();
      if (applicantRes.ok && (data.success === 'true' || data.success === true)) {
        applicantEmailSent = true;
      }
    } catch (err) {
      console.warn('[Applicant FormSubmit Notice]', err);
    }
  }

  // 2. Notify Backend API to record & queue applicant notification
  try {
    fetch(`${API_BASE_URL}/api/partner/send-email-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: app.id,
        email: app.individual.email,
        fullName: app.individual.fullName,
        pathway: app.pathway,
        loginUrl
      })
    }).catch(() => {});
  } catch (e) {}

  // 3. Dispatch Full Docket to Headquarters (support@genquantis.com) with autoresponse to applicant
  try {
    const hqRes = await fetch(`https://formsubmit.co/ajax/${GENQUANTIS_SUPPORT_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: hqSubject,
        _template: 'table',
        _captcha: 'false',
        _autoresponse: applicantBody,
        name: app.individual.fullName,
        email: app.individual.email,
        _replyto: app.individual.email,
        docket_id: app.id,
        pathway: app.pathway.toUpperCase(),
        applicant_name: app.individual.fullName,
        applicant_email: app.individual.email,
        applicant_phone: app.individual.mobile,
        applicant_whatsapp: app.individual.whatsapp,
        territory: app.territory.isPanIndia ? 'Pan-India' : app.territory.selectedStates.join(', '),
        company_name: app.business.legalEntityName || 'Individual',
        investment_capacity: app.business.investmentCapacity,
        direct_login_link: loginUrl,
        dossier_text: hqBody
      })
    });

    const data = await hqRes.json();
    if (hqRes.ok && (data.success === 'true' || data.success === true)) {
      supportEmailSent = true;
      applicantEmailSent = true;
    }
  } catch (err) {
    console.warn('[HQ Email Dispatch Notice]', err);
  }

  // EmailJS Backup for Headquarters if FormSubmit was not activated
  if (!supportEmailSent) {
    try {
      const res = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: `${app.individual.fullName} [${app.id}]`,
          from_email: app.individual.email,
          to_email: GENQUANTIS_SUPPORT_EMAIL,
          subject: hqSubject,
          message: hqBody,
          location: app.territory.selectedStates.join(', ') || 'Pan-India'
        },
        EMAILJS_PUBLIC_KEY
      );

      if (res.status === 200) {
        supportEmailSent = true;
      }
    } catch (emailJsErr) {
      console.warn('[EmailJS Backup Notice]', emailJsErr);
    }
  }

  const successMessage = applicantEmailSent
    ? `Application ID ${app.id} and 1-Click Login Link sent directly to ${app.individual.email}.`
    : `Application ID ${app.id} registered for ${app.individual.email}. You can also click below to save or open in your email client.`;

  return {
    sent: applicantEmailSent || supportEmailSent,
    channel: applicantEmailSent ? 'formsubmit' : 'mailto_ready',
    message: successMessage,
    mailtoUrl: supportMailtoUrl,
    applicantEmail: app.individual.email,
    applicantMailtoUrl,
    applicantEmailSent,
    supportEmailSent
  };
}
