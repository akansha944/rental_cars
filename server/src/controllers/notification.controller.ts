import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';

// GET /api/dashboard/notifications
export async function listNotifications(req: Request, res: Response) {
  const onlyUnread = req.query.unread === 'true';
  const filter: Record<string, unknown> = { company: req.auth!.companyId };
  if (onlyUnread) filter.read = false;
  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({
    company: req.auth!.companyId,
    read: false,
  });
  res.json({ notifications, unreadCount });
}

// PATCH /api/dashboard/notifications/:id/read
export async function markNotificationRead(req: Request, res: Response) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, company: req.auth!.companyId },
    { read: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.json(notification);
}

// POST /api/dashboard/notifications/read-all
export async function markAllRead(req: Request, res: Response) {
  await Notification.updateMany(
    { company: req.auth!.companyId, read: false },
    { read: true }
  );
  res.json({ message: 'All notifications marked as read' });
}
