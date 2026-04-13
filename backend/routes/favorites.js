// ─────────────────────────────────────────────────────────────────────────────
// Favorites routes (in-memory)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Favorite, User } from '../models/index.js';
import { getMovieDetail } from '../services/tmdb.js';

const router = Router();

// Movie info cache
const movieCache = new Map();

async function getMovieInfo(movieId) {
  if (movieCache.has(movieId)) return movieCache.get(movieId);
  try {
    const movie = await getMovieDetail(movieId);
    const info = { id: movie.id, title: movie.title, poster: movie.poster, year: movie.year, rating: movie.rating, genre: movie.genre };
    movieCache.set(movieId, info);
    return info;
  } catch {
    return null;
  }
}

// ── GET /api/favorites — list current user's favorites ───────────────────────
router.get('/', requireAuth, async (req, res) => {
  const userFavs = await Favorite.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const results = await Promise.all(
    userFavs.map(async (f) => {
      const movie = await getMovieInfo(f.movieId);
      return movie ? { ...movie, favoritedAt: f.createdAt } : null;
    }),
  );
  return res.json(results.filter(Boolean));
});

// ── GET /api/favorites/check/:movieId — check if movie is favorited ──────────
router.get('/check/:movieId', requireAuth, async (req, res) => {
  const exists = await Favorite.exists({ userId: req.user._id, movieId: req.params.movieId });
  return res.json({ isFavorited: !!exists });
});

// ── POST /api/favorites/:movieId — add to favorites ──────────────────────────
router.post('/:movieId', requireAuth, async (req, res) => {
  const movieId = String(req.params.movieId);

  const exists = await Favorite.exists({ userId: req.user._id, movieId });
  if (exists) {
    return res.status(409).json({ error: 'Already in favorites' });
  }

  // Verify movie exists on TMDB
  const movie = await getMovieInfo(movieId);
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found on TMDB' });
  }

  await Favorite.create({
    userId: req.user._id,
    movieId,
  });

  return res.status(201).json({ message: 'Added to favorites', movie });
});

// ── DELETE /api/favorites/:movieId — remove from favorites ───────────────────
router.delete('/:movieId', requireAuth, async (req, res) => {
  const movieId = String(req.params.movieId);
  const deleted = await Favorite.findOneAndDelete({ userId: req.user._id, movieId });
  
  if (!deleted) return res.status(404).json({ error: 'Not in favorites' });
  
  return res.json({ message: 'Removed from favorites' });
});

// ── GET /api/favorites/user/:username — list any user's favorites ────────────
router.get('/user/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userFavs = await Favorite.find({ userId: user._id }).sort({ createdAt: -1 });
  const results = await Promise.all(
    userFavs.map(async (f) => {
      const movie = await getMovieInfo(f.movieId);
      return movie ? { ...movie, favoritedAt: f.createdAt } : null;
    }),
  );
  return res.json(results.filter(Boolean));
});

export default router;
