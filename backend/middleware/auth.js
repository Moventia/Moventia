// ─────────────────────────────────────────────────────────────────────────────
// JWT authentication middleware (in-memory version)
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'moventia-dev-secret';

export function generateToken(user) {
  return jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = await User.findById(payload.id);
  } catch {
    req.user = null;
  }
  next();
}
