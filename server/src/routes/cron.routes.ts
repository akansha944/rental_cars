import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { runAllReminders } from '../services/reminder.service';

const router = Router();

/**
 * Public, secret-protected endpoint for an external scheduler (e.g.
 * cron-job.org, UptimeRobot, GitHub Actions) to trigger the daily reminder
 * scan. Calling it also wakes a sleeping free-tier host.
 *
 * Provide the secret via either:
 *   - query param:  /api/cron/run-reminders?key=YOUR_SECRET
 *   - header:       x-cron-key: YOUR_SECRET
 */
async function handleCron(req: import('express').Request, res: import('express').Response) {
  if (!env.cronSecret) {
    throw ApiError.forbidden('Cron endpoint is disabled (CRON_SECRET not set)');
  }
  const provided = (req.query.key as string) || req.headers['x-cron-key'];
  if (provided !== env.cronSecret) {
    throw ApiError.unauthorized('Invalid cron key');
  }
  const result = await runAllReminders();
  res.json({ ok: true, ...result });
}

// Accept both GET and POST so simple "ping a URL" schedulers work.
router.get('/run-reminders', asyncHandler(handleCron));
router.post('/run-reminders', asyncHandler(handleCron));

export default router;
