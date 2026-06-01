import twilio from 'twilio';
import { env } from '../config/env';

let client: twilio.Twilio | null = null;

if (env.twilio.enabled) {
  client = twilio(env.twilio.accountSid, env.twilio.authToken);
}

/**
 * Normalises a phone number to E.164 format (e.g. +64211234567), which Twilio
 * requires. Numbers are usually stored locally (e.g. "021 123 4567"), so we
 * convert them using a default country calling code (NZ = 64 by default).
 */
export function toE164(raw: string, defaultCountry = env.twilio.defaultCountry): string {
  if (!raw) return '';
  const s = raw.trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('00')) return `+${s.slice(2)}`;
  if (s.startsWith('0')) return `+${defaultCountry}${s.slice(1)}`;
  if (s.startsWith(defaultCountry)) return `+${s}`;
  return `+${defaultCountry}${s}`;
}

/** Pulls a readable message out of a Twilio error. */
function describeSmsError(err: unknown): string {
  const e = err as { code?: number; message?: string; moreInfo?: string };
  return [e.code ? `[${e.code}]` : '', e.message, e.moreInfo].filter(Boolean).join(' ');
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!to) return;
  const normalised = toE164(to);

  if (client) {
    try {
      await client.messages.create({ to: normalised, from: env.twilio.fromNumber, body });
    } catch (err) {
      console.error(`[sms] Failed to send to ${normalised}:`, describeSmsError(err));
      throw err;
    }
    return;
  }

  // Fallback: log to console (dev mode without Twilio)
  console.log('\n[sms:DEV] ──────────────────────────────────────');
  console.log(`To:   ${normalised}`);
  console.log(`Body: ${body}`);
  console.log('─────────────────────────────────────────────────\n');
}
