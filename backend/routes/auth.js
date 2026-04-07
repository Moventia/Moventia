// ─────────────────────────────────────────────────────────────────────────────
// Auth routes: POST /api/auth/signup, POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { User } from '../models/index.js';

const router = Router();

// ── Signup ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: fullName.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    bio: '',
    avatarUrl: '',
  });

  return res.status(201).json({
    token: generateToken(user),
    email: user.email,
    username: user.username,
    fullName: user.fullName,
  });
});

// ── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  return res.json({
    token: generateToken(user),
    email: user.email,
    username: user.username,
    fullName: user.fullName,
  });
});

export default router;
