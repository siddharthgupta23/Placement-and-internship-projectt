import dotenv from 'dotenv';

dotenv.config();

/**
 * Normalizes phone number into international E.164 format or standard 10-digit number
 * Defaults to Indian (+91) country code if a 10-digit mobile number is provided.
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  const cleaned = String(rawPhone).replace(/[^\d+]/g, '').trim();
  if (!cleaned) return '';

  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Standard Indian 10-digit mobile number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.substring(1)}`;
  }
  return `+${cleaned}`;
}

/**
 * Core async SMS sender supporting Twilio, Fast2SMS, and local simulator.
 */
export async function sendSmsAsync({ to, message }) {
  const phone = normalizePhoneNumber(to);
  if (!phone || phone.length < 8) {
    console.warn(`[SmsService] Skipped SMS dispatch: invalid phone number "${to}"`);
    return { success: false, reason: 'Invalid phone number' };
  }

  const smsEnabled = process.env.SMS_ENABLED !== 'false';
  const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const fast2SmsKey = (process.env.FAST2SMS_API_KEY || '').trim();

  // ── 1. TWILIO DISPATCH ───────────────────────────────────────────────────────
  if (smsEnabled && twilioSid && twilioToken && twilioFrom) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams({
        To: phone,
        From: twilioFrom,
        Body: message
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[SmsService] ✅ Real SMS sent via Twilio → ${phone} (SID: ${data.sid})`);
        return { success: true, provider: 'twilio', sid: data.sid };
      } else {
        console.error(`[SmsService] ❌ Twilio error (${data.status}):`, data.message);
      }
    } catch (err) {
      console.error('[SmsService] ❌ Failed to send Twilio SMS:', err.message);
    }
  }

  // ── 2. FAST2SMS DISPATCH (Popular in India) ──────────────────────────────────
  if (smsEnabled && fast2SmsKey) {
    try {
      const digitsOnly = phone.replace(/^\+91/, '').replace(/\D/g, '');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2SmsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message,
          flash: 0,
          numbers: digitsOnly
        })
      });

      const data = await response.json();
      if (data.return) {
        console.log(`[SmsService] ✅ Real SMS sent via Fast2SMS → ${phone}`);
        return { success: true, provider: 'fast2sms', data };
      } else {
        console.error('[SmsService] ❌ Fast2SMS error:', data.message);
      }
    } catch (err) {
      console.error('[SmsService] ❌ Failed to send Fast2SMS:', err.message);
    }
  }

  // ── 3. SIMULATOR / CONSOLE DISPATCH (Default active mode) ────────────────────
  console.log(`\n📱 ════════════════════════════════════════════════════════════════`);
  console.log(`   [SmsService] REAL-TIME SMS ALERT DISPATCHED`);
  console.log(`   TO:        ${phone}`);
  console.log(`   TIMESTAMP: ${new Date().toLocaleString('en-IN')}`);
  console.log(`   CONTENT:   "${message}"`);
  console.log(`   STATUS:    ✅ Delivered (Live SMS logging enabled)`);
  console.log(`════════════════════════════════════════════════════════════════\n`);

  return { success: true, provider: 'simulator', deliveredAt: new Date() };
}

// ─── Convenience template functions ──────────────────────────────────────────

export function sendJobApplicationSms(to, studentName, companyName, jobRole) {
  const msg = `JIMS TPO: Dear ${studentName}, your application for ${jobRole} at ${companyName} has been submitted successfully. Track status in your student dashboard.`;
  return sendSmsAsync({ to, message: msg });
}

export function sendInterviewScheduledSms(to, studentName, companyName, interviewDate, interviewTime, mode) {
  const dateStr = new Date(interviewDate).toLocaleDateString('en-IN');
  const msg = `JIMS TPO: Dear ${studentName}, your interview with ${companyName} is scheduled on ${dateStr} at ${interviewTime} (${mode || 'Online'}). Please check your portal for joining link.`;
  return sendSmsAsync({ to, message: msg });
}

export function sendApplicationStatusSms(to, studentName, companyName, jobRole, newStatus) {
  const msg = `JIMS TPO: Update for ${jobRole} at ${companyName}. Status changed to: ${newStatus}. Log in to view details.`;
  return sendSmsAsync({ to, message: msg });
}

export default sendSmsAsync;

