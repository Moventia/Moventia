// ─────────────────────────────────────────────────────────────────────────────
// TMDB API Service
// Wraps The Movie Database API v3
// Docs: https://developer.themoviedb.org/docs
// ─────────────────────────────────────────────────────────────────────────────

import dns from 'dns';

// Force IPv4 DNS resolution (Node's fetch can fail with IPv6 on some systems)
dns.setDefaultResultOrder('ipv4first');

const BASE = 'https://api.tmdb.org/3';
const IMG = 'https://image.tmdb.org/t/p';

function key() {
  return process.env.TMDB_API_KEY;
}

function imgUrl(path, size = 'w500') {
  if (!path) return '';
  return `${IMG}/${size}${path}`;
}

// ── Generic fetcher with retry ───────────────────────────────────────────────
async function tmdbFetch(endpoint, params = {}, retries = 5) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('api_key', key());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB ${res.status}: ${text}`);
      }
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

// ── Normalize a TMDB movie object into our API shape ─────────────────────────
function normalizeMovie(m, genreMap = {}) {
  const genres = m.genres
    ? m.genres.map((g) => g.name)
    : (m.genre_ids || []).map((id) => genreMap[id] || 'Unknown');

  return {
    id: String(m.id),
    tmdbId: m.id,
    title: m.title || m.original_title || '',
    year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
    genre: genres,
    poster: imgUrl(m.poster_path),
    backdrop: imgUrl(m.backdrop_path, 'w1280'),
    rating: Math.round((m.vote_average / 2) * 10) / 10, // convert 0-10 → 0-5
    reviewCount: m.vote_count || 0,
    synopsis: m.overview || '',
    popularity: m.popularity || 0,
  };
}

// ── Normalize a full movie detail ────────────────────────────────────────────
function normalizeDetail(m, credits = {}) {
  const directors = (credits.crew || [])
    .filter((c) => c.job === 'Director')
    .map((c) => c.name);

  const cast = (credits.cast || [])
    .slice(0, 10)
    .map((c) => c.name);

  const hours = Math.floor((m.runtime || 0) / 60);
  const mins = (m.runtime || 0) % 60;
  const duration = m.runtime ? `${hours}h ${mins}m` : '';

  return {
    id: String(m.id),
    tmdbId: m.id,
    title: m.title || '',
    year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
    genre: (m.genres || []).map((g) => g.name),
    poster: imgUrl(m.poster_path),
    backdrop: imgUrl(m.backdrop_path, 'w1280'),
    rating: Math.round((m.vote_average / 2) * 10) / 10,
    reviewCount: m.vote_count || 0,
    synopsis: m.overview || '',
    director: directors.join(', ') || 'Unknown',
    cast,
    duration,
    popularity: m.popularity || 0,
    budget: m.budget || 0,
    revenue: m.revenue || 0,
    tagline: m.tagline || '',
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

// Fetch genre ID→name map (cached)
let _genreMap = null;
export async function getGenreMap() {
  if (_genreMap) return _genreMap;
  const data = await tmdbFetch('/genre/movie/list');
  _genreMap = {};
  for (const g of data.genres) {
    _genreMap[g.id] = g.name;
  }
  return _genreMap;
}

// Trending movies (this week)
export async function getTrending(page = 1) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/trending/movie/week', { page }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Popular movies
export async function getPopular(page = 1) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/movie/popular', { page }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Top rated movies
export async function getTopRated(page = 1) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/movie/top_rated', { page }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Now playing
export async function getNowPlaying(page = 1) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/movie/now_playing', { page }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Search movies
export async function searchMovies(query, page = 1) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/search/movie', { query, page }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Discover all movies (no genre filter) with a custom sort and optional extra TMDB params
export async function discoverMovies(page = 1, sortBy = 'popularity.desc', extraParams = {}) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/discover/movie', { sort_by: sortBy, page, ...extraParams }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Discover movies filtered by genres with optional extra TMDB params.
// withGenres: pipe-separated genre IDs for OR logic (e.g. "28|35")
//             comma-separated for AND logic (e.g. "28,35")
export async function discoverByGenres(withGenres, page = 1, sortBy = 'popularity.desc', extraParams = {}) {
  const [data, gm] = await Promise.all([
    tmdbFetch('/discover/movie', { with_genres: withGenres, sort_by: sortBy, page, ...extraParams }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Backward-compat alias (single genre id string)
export const discoverByGenre = (genreId, page, sortBy, extraParams) =>
  discoverByGenres(String(genreId), page, sortBy, extraParams);


// Movie detail (with credits)
export async function getMovieDetail(tmdbId) {
  const [movie, credits] = await Promise.all([
    tmdbFetch(`/movie/${tmdbId}`),
    tmdbFetch(`/movie/${tmdbId}/credits`),
  ]);
  return normalizeDetail(movie, credits);
}

// Similar movies
export async function getSimilar(tmdbId, page = 1) {
  const [data, gm] = await Promise.all([
    tmdbFetch(`/movie/${tmdbId}/similar`, { page }),
    getGenreMap(),
  ]);
  return {
    movies: data.results.map((m) => normalizeMovie(m, gm)),
    page: data.page,
    totalPages: data.total_pages,
  };
}

// Get all genre names for filtering
export async function getGenres() {
  const gm = await getGenreMap();
  return Object.entries(gm).map(([id, name]) => ({ id: Number(id), name }));
}
