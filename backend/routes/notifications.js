// ─────────────────────────────────────────────────────────────────────────────
// Notification routes (in-memory)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Notification } from '../models/index.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userNotifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(userNotifs.map(n => ({
    id: n._id,
    type: n.type,
    fromUserId: n.fromUser,
    fromUser: n.fromUserName,
    fromAvatar: n.fromUserAvatar,
    message: n.message,
    timestamp: n.createdAt,
    read: n.read
  })));
});

router.put('/read', requireAuth, async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  return res.json({ message: 'All notifications marked as read' });
});

router.put('/:id/read', requireAuth, async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } },
    { new: true }
  );
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  return res.json({ message: 'Marked as read' });
});

export default router;
