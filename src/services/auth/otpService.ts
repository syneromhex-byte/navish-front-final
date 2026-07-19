import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export function isOtpEmailConfigured(): boolean {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a one-time code via EmailJS (emailjs.com) — chosen specifically
 * because it can send mail straight from browser JS using a public key,
 * so no SMTP/API secret ever has to live in this frontend-only codebase.
 * Requires the user to set up their own EmailJS service/template and fill
 * in VITE_EMAILJS_* in .env (see .env.example).
 */
export async function sendOtpEmail(toEmail: string, toName: string, otp: string): Promise<void> {
  if (!isOtpEmailConfigured()) {
    throw new Error(
      'Email verification is not configured yet. Set VITE_EMAILJS_SERVICE_ID, ' +
        'VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env (see .env.example).',
    );
  }

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { to_email: toEmail, to_name: toName, otp_code: otp },
    { publicKey: PUBLIC_KEY },
  );
}
