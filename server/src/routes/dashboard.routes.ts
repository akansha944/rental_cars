import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { getDashboard, triggerReminders } from '../controllers/dashboard.controller';
import {
  listNotifications,
  markNotificationRead,
  markAllRead,
} from '../controllers/notification.controller';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(getDashboard));
router.post('/run-reminders', asyncHandler(triggerReminders));
router.get('/notifications', asyncHandler(listNotifications));
router.patch('/notifications/:id/read', asyncHandler(markNotificationRead));
router.post('/notifications/read-all', asyncHandler(markAllRead));

export default router;
