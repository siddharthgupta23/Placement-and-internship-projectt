import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Env validation ───────────────────────────────────────────────────────────
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false' && Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// ─── Transporter (only create if email is enabled and creds exist) ─────────────
let transporter = null;

function createTransporter() {
  if (!EMAIL_ENABLED) {
    console.log('[EmailService] EMAIL_ENABLED=false or credentials missing — emails will be logged to console only.');
    return null;
  }
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[EmailService] SMTP credentials missing (SMTP_USER, SMTP_PASS). Emails will be console-logged.');
    return null;
  }

  const cleanPass = (SMTP_PASS || '').replace(/\s+/g, '');
  const isGmail = (SMTP_HOST || '').toLowerCase().includes('gmail');

  if (isGmail) {
    console.log(`[EmailService] Initializing Gmail SMTP transport for: ${SMTP_USER}`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: cleanPass
      }
    });
  }

  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = port === 465 || (process.env.SMTP_SECURE === 'true' && port !== 587);

  console.log(`[EmailService] Initializing SMTP transport on ${SMTP_HOST}:${port} (secure: ${secure})`);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: cleanPass
    }
  });
}

transporter = createTransporter();

// ─── Verify SMTP connection on startup (non-fatal) ────────────────────────────
if (transporter) {
  transporter.verify()
    .then(() => console.log('[EmailService] ✅ SMTP connected successfully.'))
    .catch(err => console.warn('[EmailService] ⚠️  SMTP connection failed:', err.message, '— Emails will not be delivered.'));
}

// ─── Startup: check required env variables ────────────────────────────────────
export function checkRequiredEnv() {
  const required = ['MONGO_URI', 'SESSION_SECRET'];
  const optional = [
    { key: 'GEMINI_API_KEY', feature: 'AI Mock Interview & Insights' },
    { key: 'SMTP_USER', feature: 'Email notifications' },
    { key: 'SMTP_PASS', feature: 'Email notifications' }
  ];

  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('[Startup] ❌ Missing required env variables:', missing.join(', '));
  }

  optional.forEach(({ key, feature }) => {
    if (!process.env[key]) {
      console.warn(`[Startup] ℹ️  ${key} not set — "${feature}" will use fallback/offline mode.`);
    }
  });
}

// ─── HTML Email Template ──────────────────────────────────────────────────────
function buildEmailTemplate({ heading, bodyContent, ctaText, ctaUrl }) {
  const fromName = process.env.EMAIL_FROM_NAME || 'JIMS Placement Portal';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f8fafc;color:#1e293b}
    .wrap{max-width:600px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,.07)}
    .hdr{background:linear-gradient(135deg,#1e3a8a,#312e81);padding:36px 28px;text-align:center;color:#fff}
    .hdr h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.3px}
    .hdr p{margin:6px 0 0;font-size:12px;color:#93c5fd;letter-spacing:.5px;text-transform:uppercase}
    .body{padding:32px 28px;font-size:15px;line-height:1.65;color:#334155}
    .btn{display:inline-block;padding:13px 32px;background:#2563eb;color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;margin:24px 0;font-size:15px}
    .footer{background:#f1f5f9;padding:20px 28px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}
    .info-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin:16px 0;font-size:14px}
    @media(max-width:600px){.wrap{margin:8px;border-radius:12px}.body{padding:20px 16px}.hdr{padding:24px 16px}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>${heading}</h1>
      <p>${fromName}</p>
    </div>
    <div class="body">
      ${bodyContent}
      ${ctaText && ctaUrl ? `<div style="text-align:center"><a href="${ctaUrl}" class="btn">${ctaText}</a></div>` : ''}
      <p style="margin-top:28px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;padding-top:16px">
        Best regards,<br><strong>${fromName}</strong><br>
        Campus Training & Placement Office
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
      <p>You are receiving this email based on your campus communication preferences.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Retry sender ─────────────────────────────────────────────────────────────
async function trySend(mailOptions, attempt = 1) {
  try {
    if (!transporter) return; // Console-log mode already handled by caller
    await transporter.sendMail(mailOptions);
  } catch (err) {
    if (attempt < 3) {
      const wait = Math.pow(2, attempt) * 1500;
      console.warn(`[EmailService] Retry ${attempt}/3 for ${mailOptions.to} in ${wait}ms:`, err.message);
      await new Promise(r => setTimeout(r, wait));
      return trySend(mailOptions, attempt + 1);
    }
    throw err;
  }
}

// ─── Main sendEmail function ──────────────────────────────────────────────────
/**
 * Fire-and-forget async email sender.
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.subject - Email subject
 * @param {string} opts.heading - Large heading in the email
 * @param {string} opts.bodyContent - HTML body content
 * @param {string} [opts.ctaText] - Call-to-action button text
 * @param {string} [opts.ctaUrl] - Call-to-action button URL
 */
export async function sendEmailAsync({ to, subject, heading, bodyContent, ctaText, ctaUrl }) {
  // Validate email address
  if (!to || !to.includes('@')) {
    console.warn(`[EmailService] Skipped invalid recipient: "${to}"`);
    return;
  }

  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@placement.edu';
  const fromName = process.env.EMAIL_FROM_NAME || 'JIMS Placement Portal';
  const replyTo = process.env.EMAIL_REPLY_TO || fromAddress;

  const html = buildEmailTemplate({ heading: heading || subject, bodyContent, ctaText, ctaUrl });

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to,
    replyTo,
    subject: `[Placement Portal] ${subject}`,
    html
  };

  // Fire-and-forget
  setImmediate(async () => {
    if (!transporter) {
      // Dev/disabled mode — log to console
      console.log(`\n📧 [EmailService] [CONSOLE MODE]`);
      console.log(`   TO:      ${to}`);
      console.log(`   SUBJECT: ${subject}`);
      console.log(`   HEADING: ${heading || subject}`);
      return;
    }
    try {
      await trySend(mailOptions);
      console.log(`[EmailService] ✅ Email sent → ${to} (${subject})`);
    } catch (err) {
      console.error(`[EmailService] ❌ Failed to send to ${to}:`, err.message);
    }
  });
}

// ─── Convenience template wrappers ───────────────────────────────────────────

export function sendJobApplicationEmail(to, studentName, companyName, jobRole) {
  sendEmailAsync({
    to,
    subject: `Application Submitted — ${jobRole} at ${companyName}`,
    heading: '🎉 Application Received Successfully',
    bodyContent: `
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your application for <strong>${jobRole}</strong> at <strong>${companyName}</strong> has been successfully received by the JIMS Placement Portal.</p>
      <div class="info-box">
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Position:</strong> ${jobRole}</p>
        <p><strong>Current Status:</strong> <span style="color:#2563eb;font-weight:700">Applied</span></p>
        <p><strong>Submitted On:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      <p>The Training & Placement Cell and the corporate recruitment team will review your application. You will be notified via email when your profile moves to the next evaluation stage.</p>`,
    ctaText: 'Track My Applications',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard?tab=applications`
  });
}

export function sendApplicationStatusEmail(to, studentName, companyName, jobRole, newStatus) {
  const statusColors = {
    Selected: '#16a34a', Rejected: '#dc2626', 'Technical Round': '#7c3aed',
    'HR Round': '#db2777', Shortlisted: '#ca8a04', Applied: '#2563eb'
  };
  const color = statusColors[newStatus] || '#2563eb';
  sendEmailAsync({
    to,
    subject: `Application Update: ${companyName} — ${newStatus}`,
    heading: 'Application Status Update',
    bodyContent: `
      <p>Hi <strong>${studentName}</strong>,</p>
      <div class="info-box">
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Role:</strong> ${jobRole}</p>
        <p><strong>New Status:</strong> <span style="color:${color};font-weight:700">${newStatus}</span></p>
      </div>
      <p>Your application has been updated. Log in to the portal to view details.</p>`,
    ctaText: 'View My Applications',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard`
  });
}

export function sendInterviewScheduledEmail(to, studentName, companyName, interviewDate, meetingLink) {
  sendEmailAsync({
    to,
    subject: `Interview Scheduled — ${companyName}`,
    heading: '🗓️ Interview Scheduled',
    bodyContent: `
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Congratulations! Your interview has been scheduled.</p>
      <div class="info-box">
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString('en-IN')}</p>
        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
      </div>
      <p>Please be punctual and ensure a stable internet connection. Best of luck!</p>`,
    ctaText: 'View Interview Details',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard`
  });
}

export function sendWorkshopInvitationEmail(to, studentName, workshopTitle, workshopDate, mode, venue) {
  sendEmailAsync({
    to,
    subject: `Workshop Invitation: ${workshopTitle}`,
    heading: '🎓 Workshop Invitation',
    bodyContent: `
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>You have been invited to an upcoming workshop that will help improve your placement preparation!</p>
      <div class="info-box">
        <p><strong>Workshop:</strong> ${workshopTitle}</p>
        <p><strong>Date & Time:</strong> ${new Date(workshopDate).toLocaleString('en-IN')}</p>
        <p><strong>Mode:</strong> ${mode}</p>
        ${venue ? `<p><strong>Venue/Link:</strong> ${venue}</p>` : ''}
      </div>
      <p>Please register to confirm your attendance.</p>`,
    ctaText: 'Register for Workshop',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard`
  });
}

export function sendMockInterviewReportEmail(to, studentName, roleDomain, overallScore) {
  sendEmailAsync({
    to,
    subject: `Mock Interview Report Ready — ${roleDomain}`,
    heading: '🎙️ Mock Interview Evaluated',
    bodyContent: `
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your AI Mock Interview for <strong>${roleDomain}</strong> has been evaluated!</p>
      <div class="info-box">
        <p><strong>Overall Score:</strong> <span style="color:#2563eb;font-size:24px;font-weight:700">${overallScore}/100</span></p>
      </div>
      <p>View your detailed report with per-question feedback, strengths, weaknesses, and improvement suggestions.</p>`,
    ctaText: 'View Full Report',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard`
  });
}


export default sendEmailAsync;

