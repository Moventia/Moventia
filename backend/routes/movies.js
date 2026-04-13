// ─────────────────────────────────────────────────────────────────────────────
// Movie routes — proxies TMDB API, blends user ratings
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import * as tmdb from '../services/tmdb.js';
import { Review } from '../models/index.js';

const router = Router();

// ── Blend TMDB rating with Moventia user ratings ─────────────────────────────
async function blendRating(movie) {
  const stats = await Review.aggregate([
    { $match: { movieId: String(movie.id) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (!stats.length || stats[0].count === 0) {
    return { ...movie, userRating: null, userReviewCount: 0 };
  }

  const { avg: userAvg, count: userCount } = stats[0];
  const tmdbVotes = movie.reviewCount || 1;
  const blended   = (movie.rating * tmdbVotes + userAvg * userCount) / (tmdbVotes + userCount);

  return {
    ...movie,
    rating:          Math.round(blended  * 10) / 10,
    userRating:      Math.round(userAvg  * 10) / 10,
    userReviewCount: userCount,
  };
}

// Blend ratings for an array of movies (batched for performance)
async function blendRatings(movies) {
  if (!movies.length) return movies;

  const movieIds = movies.map((m) => String(m.id));
  const stats    = await Review.aggregate([
    { $match: { movieId: { $in: movieIds } } },
    { $group: { _id: '$movieId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const statsMap = new Map(stats.map((s) => [s._id, s]));

  return movies.map((movie) => {
    const s = statsMap.get(String(movie.id));
    if (!s || s.count === 0) return { ...movie, userRating: null, userReviewCount: 0 };

    const tmdbVotes = movie.reviewCount || 1;
    const blended   = (movie.rating * tmdbVotes + s.avg * s.count) / (tmdbVotes + s.count);

    return {
      ...movie,
      rating:          Math.round(blended * 10) / 10,
      userRating:      Math.round(s.avg   * 10) / 10,
      userReviewCount: s.count,
    };
  });
}

// ── Client-side sort — ONLY used for search results ──────────────────────────
// For all other queries we rely on TMDB's server-side sort_by parameter so
// that the global order is preserved across pages (page 1 → A…, page 2 → …Z).
function sortSearchResults(movies, sortBy) {
  const sorters = {
    rating:     (a, b) => (b.rating      - a.rating)      || (b.reviewCount - a.reviewCount) || a.title.localeCompare(b.title),
    year:       (a, b) => (b.year        - a.year)        || (b.rating      - a.rating)      || a.title.localeCompare(b.title),
    reviews:    (a, b) => (b.reviewCount - a.reviewCount) || (b.rating      - a.rating)      || a.title.localeCompare(b.title),
    title:      (a, b) => a.title.localeCompare(b.title),
    popularity: (a, b) => (b.popularity  - a.popularity)  || (b.reviewCount - a.reviewCount),
  };

  const sorter = sorters[sortBy];
  return sorter ? [...movies].sort(sorter) : movies;
}

// Map our frontend sort keys → TMDB discover sort_by values
const TMDB_SORT_MAP = {
  popularity: 'popularity.desc',
  rating:     'vote_average.desc',
  year:       'primary_release_date.desc',
  reviews:    'vote_count.desc',
  title:      'original_title.asc',
};

// ── Build TMDB date-range params ──────────────────────────────────────────────
// showUpcoming=false  → cap upper bound to today (exclude future releases)
// yearFrom / yearTo   → explicit year range on top of that
function buildDateParams(yearFrom, yearTo, showUpcoming) {
  const params = {};
  const today  = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  // Lower bound
  if (yearFrom) {
    params['primary_release_date.gte'] = `${yearFrom}-01-01`;
  }

  // Upper bound — earliest of (yearTo-end, today-if-not-upcoming)
  if (yearTo) {
    const yearToEnd = `${yearTo}-12-31`;
    if (!showUpcoming) {
      // Cap at today if yearTo end is in the future
      params['primary_release_date.lte'] = yearToEnd < today ? yearToEnd : today;
    } else {
      params['primary_release_date.lte'] = yearToEnd;
    }
  } else if (!showUpcoming) {
    params['primary_release_date.lte'] = today;
  }

  return params;
}

// How many TMDB pages to combine into one "app page" (~60 movies per page)
const TMDB_PAGES_PER_APP_PAGE = 3;

// ── GET /api/movies ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      q,
      genre,
      sort,
      page       = 1,
      category,
      yearFrom,
      yearTo,
      upcoming,  // 'true' or 'false' (string from query param)
    } = req.query;

    const appPage      = Math.max(1, Number(page));
    const showUpcoming = upcoming === 'true';

    // Build TMDB date filter params (applied to all discover calls)
    const dateParams = buildDateParams(yearFrom, yearTo, showUpcoming);

    // Calculate which TMDB pages to fetch for this app page
    const startTmdbPage = (appPage - 1) * TMDB_PAGES_PER_APP_PAGE + 1;
    const tmdbPages = Array.from(
      { length: TMDB_PAGES_PER_APP_PAGE },
      (_, i) => startTmdbPage + i,
    );

    // ── Determine fetch strategy ──────────────────────────────────────────────
    let fetchFn;
    // isSearch = true → apply client-side sort + date filter after fetching.
    // Otherwise TMDB's server-side sort_by keeps global order across pages.
    let isSearch = false;

    if (q && q.trim()) {
      // ── TEXT SEARCH ─────────────────────────────────────────────────────────
      isSearch = true;
      fetchFn  = (p) => tmdb.searchMovies(q.trim(), p);

    } else if (genre && genre !== 'all') {
      // ── GENRE FILTER (single or multi, pipe-separated names) ─────────────────
      const genreNames = genre.split('|').map((g) => g.trim().toLowerCase()).filter(Boolean);
      const genreMap   = await tmdb.getGenreMap();

      const genreIds = genreNames
        .map((name) => Object.entries(genreMap).find(([, n]) => n.toLowerCase() === name)?.[0])
        .filter(Boolean);

      const tmdbSort = TMDB_SORT_MAP[sort] || 'popularity.desc';

      if (genreIds.length) {
        const withGenres = genreIds.join('|'); // OR logic
        fetchFn = (p) => tmdb.discoverByGenres(withGenres, p, tmdbSort, dateParams);
      } else {
        // Unknown genre name — fall back to discover with date filter only
        fetchFn = (p) => tmdb.discoverMovies(p, tmdbSort, dateParams);
      }

    } else if (category === 'top_rated') {
      fetchFn = (p) => tmdb.getTopRated(p);
    } else if (category === 'now_playing') {
      fetchFn = (p) => tmdb.getNowPlaying(p);
    } else if (category === 'trending') {
      fetchFn = (p) => tmdb.getTrending(p);

    } else {
      // ── NO GENRE, NO SEARCH — use TMDB Discover for every sort ───────────────
      // Discover supports date params and server-side sorting, giving globally
      // correct pagination (page 1 is the true top, page 2 continues from there).
      const tmdbSort = TMDB_SORT_MAP[sort] || 'popularity.desc';

      // For "Highest Rated" add a minimum vote count so obscure films with a
      // perfect score from 2 voters don't flood the results.
      const extraForRating = sort === 'rating' ? { 'vote_count.gte': 200 } : {};

      fetchFn = (p) => tmdb.discoverMovies(p, tmdbSort, { ...dateParams, ...extraForRating });
    }

    // Fetch all TMDB pages in parallel
    const results = await Promise.all(
      tmdbPages.map((p) => fetchFn(p).catch(() => ({ movies: [], totalPages: 1 }))),
    );

    // Combine and deduplicate by movie id
    const seen     = new Set();
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
    const totalAppPages  = Math.ceil(tmdbTotalPages / TMDB_PAGES_PER_APP_PAGE);

    const moviesWithBlend = await blendRatings(combined);

    // For search: client-sort and client-filter by date (TMDB search ignores date params)
    let finalMovies = moviesWithBlend;
    if (isSearch) {
      // Apply date filters client-side
      const today       = new Date();
      const currentYear = today.getFullYear();

      finalMovies = finalMovies.filter((m) => {
        if (!showUpcoming && m.year > currentYear) return false;
        if (yearFrom && m.year < Number(yearFrom))  return false;
        if (yearTo   && m.year > Number(yearTo))    return false;
        return true;
      });

      finalMovies = sortSearchResults(finalMovies, sort);
    }

    return res.json({
      movies:     finalMovies,
      page:       appPage,
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
    const movie   = await tmdb.getMovieDetail(req.params.id);
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
    const result          = await tmdb.getSimilar(req.params.id);
    const moviesWithBlend = await blendRatings(result.movies);
    return res.json(moviesWithBlend);
  } catch (err) {
    console.error('Similar movies error:', err.message);
    return res.status(502).json({ error: 'Could not fetch similar movies' });
  }
});

export default router;
