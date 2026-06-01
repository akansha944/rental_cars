import cron from 'node-cron';
import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { runAllReminders } from './services/reminder.service';

async function bootstrap() {
  await connectDb();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] API listening on http://localhost:${env.port}`);
    console.log(`[server] Environment: ${env.nodeEnv}`);
  });

  // Schedule daily reminder scan.
  if (cron.validate(env.reminders.cron)) {
    cron.schedule(env.reminders.cron, runAllReminders);
    console.log(`[cron] Reminders scheduled with "${env.reminders.cron}"`);
  } else {
    console.warn(`[cron] Invalid REMINDER_CRON "${env.reminders.cron}" — reminders disabled`);
  }

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
