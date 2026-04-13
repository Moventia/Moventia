// ─────────────────────────────────────────────────────────────────────────────
// Profile routes (in-memory)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { User, Follow, Review, Favorite, ReviewLike, Notification } from '../models/index.js';

const router = Router();

// ── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Helper ───────────────────────────────────────────────────────────────────
async function buildProfile(user, requesterId = null) {
  // Populate virtuals
  await user.populate('reviewCount');
  await user.populate('followerCount');
  await user.populate('followingCount');
  
  return user.toProfileJSON(requesterId);
}

// ── Search users ─────────────────────────────────────────────────────────────
router.get('/search', optionalAuth, async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const query = q.toLowerCase().trim();
  
  const results = await User.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { fullName: { $regex: query, $options: 'i' } }
    ]
  }).limit(10);
  
  return res.json(results.map((u) => ({ id: u._id, fullName: u.fullName, username: u.username, avatarUrl: u.avatarUrl })));
});

// ── Own profile ──────────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  return res.json(await buildProfile(req.user, req.user._id));
});

router.put('/me', requireAuth, async (req, res) => {
  const { fullName, bio, avatarUrl } = req.body;
  if (fullName !== undefined) {
    if (fullName.length < 2 || fullName.length > 100)
      return res.status(400).json({ error: 'Full name must be between 2 and 100 characters' });
    req.user.fullName = fullName;
  }
  if (bio !== undefined) {
    if (bio.length > 500) return res.status(400).json({ error: 'Bio cannot exceed 500 characters' });
    req.user.bio = bio;
  }
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  await req.user.save();
  return res.json(await buildProfile(req.user, req.user._id));
});

// ── Delete account ───────────────────────────────────────────────────────────
router.delete('/me', requireAuth, async (req, res) => {
  const userId = req.user._id;
  const username = req.user.username;
  
  // Use findOneAndDelete to trigger pre-delete hooks that cascade delete all related data
  await User.findOneAndDelete({ _id: userId });
  
  return res.json({ message: `User ${username} and all associated data deleted successfully` });
});

router.post('/me/avatar', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const avatarUrl = `http://localhost:8080/uploads/${req.file.filename}`;
  req.user.avatarUrl = avatarUrl;
  await req.user.save();
  return res.json({ avatarUrl });
});

// ── Public profile ───────────────────────────────────────────────────────────
router.get('/:username', optionalAuth, async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const profile = await buildProfile(user, req.user?._id);
  
  if (req.user && !req.user._id.equals(user._id)) {
    const isFollowed = await Follow.exists({ follower: req.user._id, following: user._id });
    profile.isFollowedByMe = !!isFollowed;
  } else {
    profile.isFollowedByMe = false;
  }
  
  return res.json(profile);
});

// ── Follow / Unfollow ────────────────────────────────────────────────────────
router.post('/:username/follow', requireAuth, async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target._id.equals(req.user._id)) return res.status(400).json({ error: 'You cannot follow yourself' });
  
  const existing = await Follow.findOne({ follower: req.user._id, following: target._id });
  if (existing) return res.status(409).json({ error: 'Already following' });
  
  await Follow.create({ follower: req.user._id, following: target._id });
  return res.json({ message: 'Followed successfully' });
});

router.delete('/:username/follow', requireAuth, async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) return res.status(404).json({ error: 'User not found' });
  
  const deleted = await Follow.findOneAndDelete({ follower: req.user._id, following: target._id });
  if (!deleted) return res.status(404).json({ error: 'Not following' });
  
  return res.json({ message: 'Unfollowed' });
});

// ── Followers / Following lists ──────────────────────────────────────────────
router.get('/:username/followers', optionalAuth, async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) return res.status(404).json({ error: 'User not found' });
  
  const follows = await Follow.find({ following: target._id }).populate('follower');
  const result = [];
  for (const f of follows) {
    if(!f.follower) continue;
    const u = f.follower;
    const count = await Review.countDocuments({ user: u._id });
    let isFollowedByMe = false;
    if (req.user) {
      isFollowedByMe = !!(await Follow.exists({ follower: req.user._id, following: u._id }));
    }
    result.push({ id: u._id, fullName: u.fullName, username: u.username, avatarUrl: u.avatarUrl, reviewCount: count, isOwnProfile: req.user?._id.equals(u._id), isFollowedByMe });
  }
  return res.json(result);
});

router.get('/:username/following', optionalAuth, async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) return res.status(404).json({ error: 'User not found' });
  
  const follows = await Follow.find({ follower: target._id }).populate('following');
  const result = [];
  for (const f of follows) {
    if(!f.following) continue;
    const u = f.following;
    const count = await Review.countDocuments({ user: u._id });
    let isFollowedByMe = false;
    if (req.user) {
      isFollowedByMe = !!(await Follow.exists({ follower: req.user._id, following: u._id }));
    }
    result.push({ id: u._id, fullName: u.fullName, username: u.username, avatarUrl: u.avatarUrl, reviewCount: count, isOwnProfile: req.user?._id.equals(u._id), isFollowedByMe });
  }
  return res.json(result);
});

export default router;
