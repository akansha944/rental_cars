import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Optional display name for the sender (e.g. the company name) while keeping
  // the verified sending address. Improves the white-labelled feel.
  fromName?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

/** Extracts the bare email address from a "Name <email>" string. */
function fromAddress(): string {
  const match = env.email.from.match(/<([^>]+)>/);
  return match ? match[1] : env.email.from;
}

let smtpTransport: nodemailer.Transporter | null = null;

if (env.email.provider === 'sendgrid' && env.email.sendgridApiKey) {
  sgMail.setApiKey(env.email.sendgridApiKey);
} else if (env.email.provider === 'smtp' && env.email.smtp.host) {
  smtpTransport = nodemailer.createTransport({
    host: env.email.smtp.host,
    port: env.email.smtp.port,
    secure: env.email.smtp.port === 465,
    auth: env.email.smtp.user
      ? { user: env.email.smtp.user, pass: env.email.smtp.pass }
      : undefined,
  });
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  // SendGrid
  if (env.email.provider === 'sendgrid' && env.email.sendgridApiKey) {
    await sgMail.send({
      to: msg.to,
      from: msg.fromName ? { email: fromAddress(), name: msg.fromName } : env.email.from,
      subject: msg.subject,
      html: msg.html,
      text: msg.text ?? stripHtml(msg.html),
      // SendGrid click-tracking rewrites hrefs through sendgrid.net — this often
      // breaks signing links on mobile mail apps. Keep links direct.
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
      attachments: msg.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
        type: a.contentType,
        disposition: 'attachment',
      })),
    });
    return;
  }

  // SMTP / Nodemailer
  if (smtpTransport) {
    await smtpTransport.sendMail({
      from: msg.fromName ? `${msg.fromName} <${fromAddress()}>` : env.email.from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text ?? stripHtml(msg.html),
      attachments: msg.attachments,
    });
    return;
  }

  // Fallback: log to console (dev mode without provider)
  console.log('\n[email:DEV] ─────────────────────────────────────');
  console.log(`To:      ${msg.to}`);
  console.log(`Subject: ${msg.subject}`);
  console.log(`Body:    ${stripHtml(msg.html).slice(0, 500)}`);
  if (msg.attachments?.length) {
    console.log(`Attachments: ${msg.attachments.map((a) => a.filename).join(', ')}`);
  }
  console.log('─────────────────────────────────────────────────\n');
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
