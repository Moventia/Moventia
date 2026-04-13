// ─────────────────────────────────────────────────────────────────────────────
// Review routes (in-memory + TMDB movie lookup)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { User, Review, ReviewLike, Follow, Notification } from '../models/index.js';
import { getMovieDetail } from '../services/tmdb.js';

const router = Router();

// ── Movie info cache (avoids repeated TMDB calls) ────────────────────────────
const movieCache = new Map();

async function getMovieInfo(movieId) {
  if (movieCache.has(movieId)) return movieCache.get(movieId);
  try {
    const movie = await getMovieDetail(movieId);
    const info = { title: movie.title, poster: movie.poster };
    movieCache.set(movieId, info);
    return info;
  } catch {
    return { title: 'Unknown Movie', poster: '' };
  }
}

// ── Helper: format review for response ───────────────────────────────────────
async function formatReview(review, requesterId = null) {
  const user = review.userId; // Assuming populated
  const movie = await getMovieInfo(review.movieId);
  const likeCount = await ReviewLike.countDocuments({ reviewId: review._id });
  const isLiked = requesterId
    ? !!(await ReviewLike.exists({ reviewId: review._id, userId: requesterId }))
    : false;

  return {
    id: review._id,
    movieId: review.movieId,
    movieTitle: movie.title,
    moviePoster: movie.poster,
    userId: user?._id || null,
    username: user?.username || 'unknown',
    userAvatar: user?.avatarUrl || '',
    rating: review.rating,
    title: review.title,
    content: review.content,
    spoiler: review.spoiler,
    likes: likeCount,
    comments: 0,
    createdAt: review.createdAt,
    isLiked,
  };
}

// ── Create review ────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { movieId, rating, title, content, spoiler } = req.body;

  if (!movieId || !rating || !title || !content) {
    return res.status(400).json({ error: 'movieId, rating, title, and content are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  // Verify movie exists on TMDB
  const movie = await getMovieInfo(String(movieId));
  if (movie.title === 'Unknown Movie') {
    return res.status(404).json({ error: 'Movie not found on TMDB' });
  }

  // Prevent duplicate reviews
  const existing = await Review.findOne({ userId: req.user._id, movieId: String(movieId) });
  if (existing) {
    return res.status(409).json({ error: 'You have already reviewed this movie' });
  }

  const review = await Review.create({
    userId: req.user._id,
    movieId: String(movieId),
    rating: Number(rating),
    title: title.trim(),
    content: content.trim(),
    spoiler: !!spoiler,
  });
  
  await review.populate('userId');
  return res.status(201).json(await formatReview(review, req.user._id));
});

// ── Recent reviews (public, for homepage) ────────────────────────────────────
router.get('/recent', optionalAuth, async (req, res) => {
  const recent = await Review.find().sort({ createdAt: -1 }).limit(10).populate('userId');
  const formatted = await Promise.all(recent.map((r) => formatReview(r, req.user?._id)));
  return res.json(formatted);
});

// ── Feed (reviews from followed users) ───────────────────────────────────────
router.get('/feed', requireAuth, async (req, res) => {
  const scope = req.query.scope === 'all' ? 'all' : 'following';

  let filter = {};
  if (scope === 'following') {
    const follows = await Follow.find({ follower: req.user._id });
    const followingIds = follows.map(f => f.following);
    filter = { userId: { $in: followingIds } };
  }

  const feedReviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .populate('userId');
    
  const formatted = await Promise.all(feedReviews.map((r) => formatReview(r, req.user._id)));
  return res.json(formatted);
});

// ── Reviews for a movie ──────────────────────────────────────────────────────
router.get('/movie/:movieId', optionalAuth, async (req, res) => {
  const movieReviews = await Review.find({ movieId: req.params.movieId })
    .sort({ createdAt: -1 })
    .populate('userId');
    
  const formatted = await Promise.all(movieReviews.map((r) => formatReview(r, req.user?._id)));
  return res.json(formatted);
});

// ── Reviews by a user ────────────────────────────────────────────────────────
router.get('/user/:username', optionalAuth, async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) return res.status(404).json({ error: 'User not found' });
  
  const userReviews = await Review.find({ userId: target._id })
    .sort({ createdAt: -1 })
    .populate('userId');
    
  const formatted = await Promise.all(userReviews.map((r) => formatReview(r, req.user?._id)));
  return res.json(formatted);
});

// ── Like ─────────────────────────────────────────────────────────────────────
router.post('/:id/like', requireAuth, async (req, res) => {
  const review = await Review.findById(req.params.id).populate('userId');
  if (!review) return res.status(404).json({ error: 'Review not found' });

  const existing = await ReviewLike.findOne({ reviewId: review._id, userId: req.user._id });
  if (existing) return res.status(409).json({ error: 'Already liked' });

  await ReviewLike.create({ userId: req.user._id, reviewId: review._id });

  if (!review.userId.equals(req.user._id)) {
    const movie = await getMovieInfo(review.movieId);
    await Notification.create({
      user: review.userId._id,
      type: 'like',
      fromUser: req.user._id,
      fromUserName: req.user.username,
      fromUserAvatar: req.user.avatarUrl,
      message: `liked your review of "${movie.title}"`,
    });
  }

  return res.json({ message: 'Liked' });
});

// ── Unlike ───────────────────────────────────────────────────────────────────
router.delete('/:id/like', requireAuth, async (req, res) => {
  const deleted = await ReviewLike.findOneAndDelete({ reviewId: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Not liked' });
  return res.json({ message: 'Unliked' });
});

// ── Edit review ──────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const review = await Review.findById(req.params.id).populate('userId');
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (!review.userId.equals(req.user._id)) return res.status(403).json({ error: 'You can only edit your own reviews' });

  const { rating, title, content, spoiler } = req.body;

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    review.rating = Number(rating);
  }
  if (title !== undefined) review.title = title.trim();
  if (content !== undefined) review.content = content.trim();
  if (spoiler !== undefined) review.spoiler = !!spoiler;
  await review.save();

  return res.json(await formatReview(review, req.user._id));
});

// ── Delete review ────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (!review.userId.equals(req.user._id)) return res.status(403).json({ error: 'You can only delete your own reviews' });

  await Review.findByIdAndDelete(review._id);
  await ReviewLike.deleteMany({ reviewId: review._id });

  return res.json({ message: 'Review deleted' });
});

// ── Review count for a movie (our app's reviews, not TMDB) ───────────────────
router.get('/count/:movieId', async (req, res) => {
  const count = await Review.countDocuments({ movieId: req.params.movieId });
  return res.json({ count });
});

export default router;
