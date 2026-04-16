// ─────────────────────────────────────────────────────────────────────────────
// Profile routes (in-memory)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { User, Follow, Review, Favorite, ReviewLike, Notification } from '../models/index.js';
import { getMovieDetail } from '../services/tmdb.js';

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

  // Notify target user
  await Notification.create({
    user: target._id,
    type: 'follow',
    fromUser: req.user._id,
    fromUsername: req.user.username,
    fromAvatar: req.user.avatarUrl,
    message: 'started following you',
  });

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
    const count = await Review.countDocuments({ userId: u._id });
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
    const count = await Review.countDocuments({ userId: u._id });
    let isFollowedByMe = false;
    if (req.user) {
      isFollowedByMe = !!(await Follow.exists({ follower: req.user._id, following: u._id }));
    }
    result.push({ id: u._id, fullName: u.fullName, username: u.username, avatarUrl: u.avatarUrl, reviewCount: count, isOwnProfile: req.user?._id.equals(u._id), isFollowedByMe });
  }
  return res.json(result);
});

router.get('/:username/activity', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userId = user._id;

    const [reviews, favorites, likes, follows] = await Promise.all([
      Review.find({ userId }).sort({ createdAt: -1 }).limit(15).populate('userId'),
      Favorite.find({ userId }).sort({ createdAt: -1 }).limit(15),
      ReviewLike.find({ userId }).sort({ createdAt: -1 }).limit(15).populate({
        path: 'reviewId',
        populate: { path: 'userId' }
      }),
      Follow.find({ follower: userId }).sort({ createdAt: -1 }).limit(15).populate('following')
    ]);

    const activity = [];
    const movieCache = new Map();

    const fetchMovieInfo = async (mid) => {
      if (movieCache.has(mid)) return movieCache.get(mid);
      try {
        const m = await getMovieDetail(mid);
        const info = { title: m.title, poster: m.poster };
        movieCache.set(mid, info);
        return info;
      } catch {
        return { title: 'Unknown Movie', poster: '' };
      }
    };

    // 1. Reviews
    for (const r of reviews) {
      const movie = await fetchMovieInfo(r.movieId);
      activity.push({
        type: 'review',
        id: r._id,
        timestamp: r.createdAt,
        data: {
          movieId: r.movieId,
          movieTitle: movie.title,
          moviePoster: movie.poster,
          rating: r.rating,
          reviewTitle: r.title,
        }
      });
    }

    // 2. Favorites
    for (const f of favorites) {
      const movie = await fetchMovieInfo(f.movieId);
      activity.push({
        type: 'favorite',
        id: f._id,
        timestamp: f.createdAt,
        data: {
          movieId: f.movieId,
          movieTitle: movie.title,
          moviePoster: movie.poster,
        }
      });
    }

    // 3. Likes
    for (const l of likes) {
      if (!l.reviewId) continue;
      const movie = await fetchMovieInfo(l.reviewId.movieId);
      activity.push({
        type: 'like',
        id: l._id,
        timestamp: l.createdAt,
        data: {
          reviewId: l.reviewId._id,
          movieId: l.reviewId.movieId,
          movieTitle: movie.title,
          moviePoster: movie.poster,
          authorName: l.reviewId.userId?.username || 'unknown',
        }
      });
    }

    // 4. Follows
    for (const f of follows) {
      if (!f.following) continue;
      activity.push({
        type: 'follow',
        id: f._id,
        timestamp: f.createdAt,
        data: {
          userId: f.following._id,
          username: f.following.username,
          fullName: f.following.fullName,
          avatarUrl: f.following.avatarUrl,
        }
      });
    }

    // Sort combined feed
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json(activity.slice(0, 30));
  } catch (err) {
    console.error('Activity fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
