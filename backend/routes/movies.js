// ─────────────────────────────────────────────────────────────────────────────
// Movie routes — proxies TMDB API, blends user ratings
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import * as tmdb from '../services/tmdb.js';
import { Review } from '../models/index.js';

const router = Router();

// ── Blend TMDB rating with Moventia user ratings ─────────────────────────────
// Weighted average: treats TMDB votes and user votes as if from the same pool.
// If no user reviews exist, returns the TMDB rating unchanged.
async function blendRating(movie) {
  const stats = await Review.aggregate([
    { $match: { movieId: String(movie.id) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (!stats.length || stats[0].count === 0) {
    return {
      ...movie,
      userRating: null,
      userReviewCount: 0,
    };
  }

  const { avg: userAvg, count: userCount } = stats[0];
  const tmdbRating = movie.rating;          // already on 0-5 scale
  const tmdbVotes = movie.reviewCount || 1; // TMDB vote count

  // Weighted average of TMDB + user ratings
  const blended =
    (tmdbRating * tmdbVotes + userAvg * userCount) / (tmdbVotes + userCount);

  return {
    ...movie,
    rating: Math.round(blended * 10) / 10,  // 1 decimal place
    userRating: Math.round(userAvg * 10) / 10,
    userReviewCount: userCount,
  };
}

// Blend ratings for an array of movies (batched for performance)
async function blendRatings(movies) {
  if (!movies.length) return movies;

  const movieIds = movies.map((m) => String(m.id));
  const stats = await Review.aggregate([
    { $match: { movieId: { $in: movieIds } } },
    { $group: { _id: '$movieId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const statsMap = new Map(stats.map((s) => [s._id, s]));

  return movies.map((movie) => {
    const s = statsMap.get(String(movie.id));
    if (!s || s.count === 0) {
      return { ...movie, userRating: null, userReviewCount: 0 };
    }

    const tmdbVotes = movie.reviewCount || 1;
    const blended =
      (movie.rating * tmdbVotes + s.avg * s.count) / (tmdbVotes + s.count);

    return {
      ...movie,
      rating: Math.round(blended * 10) / 10,
      userRating: Math.round(s.avg * 10) / 10,
      userReviewCount: s.count,
    };
  });
}

function sortMovies(movies, sortBy) {
  const sorters = {
    rating: (a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount) || a.title.localeCompare(b.title),
    year: (a, b) => (b.year - a.year) || (b.rating - a.rating) || a.title.localeCompare(b.title),
    reviews: (a, b) => (b.reviewCount - a.reviewCount) || (b.rating - a.rating) || a.title.localeCompare(b.title),
  };

  const sorter = sorters[sortBy];
  if (!sorter) return movies;

  return [...movies].sort(sorter);
}

// How many TMDB pages to combine into one "app page" (~60 movies per page)
const TMDB_PAGES_PER_APP_PAGE = 3;

router.get('/', async (req, res) => {
  try {
    const { q, genre, sort, page = 1, category } = req.query;
    const appPage = Math.max(1, Number(page));

    // Calculate which TMDB pages to fetch for this app page
    const startTmdbPage = (appPage - 1) * TMDB_PAGES_PER_APP_PAGE + 1;
    const tmdbPages = Array.from(
      { length: TMDB_PAGES_PER_APP_PAGE },
      (_, i) => startTmdbPage + i,
    );

    // Determine the fetch function based on query params
    let fetchFn;

    if (q && q.trim()) {
      fetchFn = (p) => tmdb.searchMovies(q.trim(), p);
    } else if (genre && genre !== 'all') {
      const genreMap = await tmdb.getGenreMap();
      const genreId = Object.entries(genreMap).find(
        ([, name]) => name.toLowerCase() === genre.toLowerCase(),
      )?.[0];

      if (genreId) {
        const sortMap = {
          rating: 'vote_average.desc',
          year: 'primary_release_date.desc',
          reviews: 'vote_count.desc',
          popularity: 'popularity.desc',
        };
        const tmdbSort = sortMap[sort] || 'popularity.desc';
        fetchFn = (p) => tmdb.discoverByGenre(genreId, p, tmdbSort);
      } else {
        fetchFn = (p) => tmdb.getPopular(p);
      }
    } else if (category === 'top_rated') {
      fetchFn = (p) => tmdb.getTopRated(p);
    } else if (category === 'now_playing') {
      fetchFn = (p) => tmdb.getNowPlaying(p);
    } else if (category === 'trending') {
      fetchFn = (p) => tmdb.getTrending(p);
    } else {
      fetchFn = (p) => tmdb.getPopular(p);
    }

    // Fetch all TMDB pages in parallel
    const results = await Promise.all(
      tmdbPages.map((p) => fetchFn(p).catch(() => ({ movies: [], totalPages: 1 }))),
    );

    // Combine and deduplicate by movie id
    const seen = new Set();
    const combined = [];
    for (const r of results) {
      for (const m of r.movies) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          combined.push(m);
        }
      }
    }

    // Calculate total app pages from TMDB's total_pages (TMDB caps at page 500)
    const tmdbTotalPages = Math.min(500, Math.max(...results.map((r) => r.totalPages || 1)));
    const totalAppPages = Math.ceil(tmdbTotalPages / TMDB_PAGES_PER_APP_PAGE);

    const moviesWithBlend = await blendRatings(combined);
    const sortedMovies = sortMovies(moviesWithBlend, sort);
    return res.json({
      movies: sortedMovies,
      page: appPage,
      totalPages: totalAppPages,
    });
  } catch (err) {
    console.error('Movies list error:', err.message);
    return res.status(502).json({ error: 'Could not fetch movies from TMDB' });
  }
});

// ── GET /api/movies/genres — list all genres ─────────────────────────────────
router.get('/genres', async (_req, res) => {
  try {
    const genres = await tmdb.getGenres();
    return res.json(genres);
  } catch (err) {
    console.error('Genres error:', err.message);
    return res.status(502).json({ error: 'Could not fetch genres' });
  }
});

// ── GET /api/movies/:id — movie detail ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const movie = await tmdb.getMovieDetail(req.params.id);
    const blended = await blendRating(movie);
    return res.json(blended);
  } catch (err) {
    console.error('Movie detail error:', err.message);
    return res.status(404).json({ error: 'Movie not found' });
  }
});

// ── GET /api/movies/:id/similar — similar movies ────────────────────────────
router.get('/:id/similar', async (req, res) => {
  try {
    const result = await tmdb.getSimilar(req.params.id);
    const moviesWithBlend = await blendRatings(result.movies);
    return res.json(moviesWithBlend);
  } catch (err) {
    console.error('Similar movies error:', err.message);
    return res.status(502).json({ error: 'Could not fetch similar movies' });
  }
});

export default router;

