import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: optional('NODE_ENV', 'development') === 'production',
  port: parseInt(optional('PORT', '5000'), 10),

  mongoUri: required('MONGODB_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: optional('JWT_ACCESS_EXPIRES', '15m'),
    refreshExpires: optional('JWT_REFRESH_EXPIRES', '30d'),
  },

  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME'),
    apiKey: optional('CLOUDINARY_API_KEY'),
    apiSecret: optional('CLOUDINARY_API_SECRET'),
    get enabled() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  email: {
    provider: optional('EMAIL_PROVIDER').toLowerCase(),
    from: optional('EMAIL_FROM', 'RentalFlow <no-reply@rentalflow.app>'),
    sendgridApiKey: optional('SENDGRID_API_KEY'),
    smtp: {
      host: optional('SMTP_HOST'),
      port: parseInt(optional('SMTP_PORT', '587'), 10),
      user: optional('SMTP_USER'),
      pass: optional('SMTP_PASS'),
    },
  },

  twilio: {
    accountSid: optional('TWILIO_ACCOUNT_SID'),
    authToken: optional('TWILIO_AUTH_TOKEN'),
    fromNumber: optional('TWILIO_FROM_NUMBER'),
    // Default country calling code for normalising local numbers (NZ = 64).
    defaultCountry: optional('SMS_DEFAULT_COUNTRY', '64'),
    get enabled() {
      return Boolean(this.accountSid && this.authToken && this.fromNumber);
    },
  },

  reminders: {
    days: optional('REMINDER_DAYS', '30,14,7,1')
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !Number.isNaN(d)),
    cron: optional('REMINDER_CRON', '0 8 * * *'),
  },

  // Shared secret that lets an external scheduler trigger the reminder job
  // (also keeps a sleeping free-tier host awake). Leave blank to disable.
  cronSecret: optional('CRON_SECRET'),
};

export type Env = typeof env;
