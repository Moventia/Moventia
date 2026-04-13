import { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';
import { useLocation } from 'react-router-dom';
import { MovieCard } from './MovieCard';

const API_URL = 'http://localhost:8080/api';
const CURRENT_YEAR = new Date().getFullYear();

// Year options: 1900 → current year + 3 (for upcoming)
const YEARS = Array.from(
  { length: CURRENT_YEAR + 3 - 1900 + 1 },
  (_, i) => CURRENT_YEAR + 3 - i, // descending: newest first
);

export function BrowseMovies() {
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-genre: a Set of lowercase genre names
  const [selectedGenres, setSelectedGenres] = useState(new Set());
  const [sortBy, setSortBy] = useState('popularity');

  // Date range filter
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo]     = useState('');

  // Upcoming toggle (false = only show released movies)
  const [showUpcoming, setShowUpcoming] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [genres, setGenres]           = useState([]);

  // Fetch genre list from API
  useEffect(() => {
    fetch(`${API_URL}/movies/genres`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setGenres(data))
      .catch(() => {});
  }, []);

  // Read initial/updated query from URL for navbar Enter-search handoff
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (q !== searchQuery) setSearchQuery(q);
  }, [location.search]);

  const allGenres = ['All', ...genres.map((g) => g.name)];

  // Toggle a genre in/out of the selected set
  const toggleGenre = (genre) => {
    if (genre === 'All') { setSelectedGenres(new Set()); return; }
    const name = genre.toLowerCase();
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const isGenreActive = (genre) => {
    if (genre === 'All') return selectedGenres.size === 0;
    return selectedGenres.has(genre.toLowerCase());
  };

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenres, sortBy, yearFrom, yearTo, showUpcoming]);

  // Fetch movies from API
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim())   params.set('q', searchQuery.trim());
        if (selectedGenres.size)  params.set('genre', [...selectedGenres].join('|'));
        if (sortBy)               params.set('sort', sortBy);
        if (yearFrom)             params.set('yearFrom', yearFrom);
        if (yearTo)               params.set('yearTo', yearTo);
        params.set('upcoming', String(showUpcoming));
        params.set('page', currentPage);

        const res = await fetch(`${API_URL}/movies?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMovies(data.movies || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchMovies, 250);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedGenres, sortBy, yearFrom, yearTo, showUpcoming, currentPage]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenres(new Set());
    setYearFrom('');
    setYearTo('');
    setShowUpcoming(false);
  };

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedGenres.size > 0 ||
    yearFrom ||
    yearTo ||
    showUpcoming;

  return (
    <div className="page-browse cinematic-page min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Browse Movies</h1>
          <p className="text-muted-foreground">Discover your next favorite film</p>
        </div>

        {/* Filter card */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">

            {/* ── Section 1: Genres ── */}
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Genres
                {selectedGenres.size > 0 && (
                  <span className="ml-2 normal-case text-primary font-normal">
                    ({selectedGenres.size} selected)
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((genre) => (
                  <Badge
                    key={genre}
                    variant={isGenreActive(genre) ? 'default' : 'outline'}
                    className="cursor-pointer select-none transition-all px-4 py-1.5 text-sm"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                    {genre !== 'All' && isGenreActive(genre) && (
                      <X className="ml-1 h-3 w-3 inline" />
                    )}
                  </Badge>
                ))}
              </div>

              {/* Active genre chips */}
              {selectedGenres.size > 0 && (
                <div className="flex items-center gap-4 flex-wrap pb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Active:</span>
                  {[...selectedGenres].map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="cursor-pointer gap-2 capitalize px-4 py-1.5 text-sm font-medium"
                      onClick={() => toggleGenre(g)}
                    >
                      {g}
                      <X className="h-3.5 w-3.5" />
                    </Badge>
                  ))}
                  <button
                    onClick={() => setSelectedGenres(new Set())}
                    className="text-sm text-primary underline underline-offset-2 hover:opacity-70 font-medium ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* ── Divider & Spacing ── */}
            <div className="h-4" />
            <div className="border-t border-border" />
            <div className="h-6" />

            {/* ── Section 2: Year & Sort ── */}
            <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-12 w-full">
              
              {/* Left Group: Year Range */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Year
                </p>
                
                <div className="flex items-center gap-2">
                  <Select value={yearFrom || '__none__'} onValueChange={(v) => setYearFrom(v === '__none__' ? '' : v)}>
                    <SelectTrigger size="sm" className="w-[100px] h-8 text-[13px]">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Any</SelectItem>
                      {YEARS.filter((y) => !yearTo || y <= Number(yearTo)).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-muted-foreground text-xs uppercase font-bold tracking-tighter opacity-70">to</span>

                <div className="flex items-center gap-2">
                  <Select value={yearTo || '__none__'} onValueChange={(v) => setYearTo(v === '__none__' ? '' : v)}>
                    <SelectTrigger size="sm" className="w-[100px] h-8 text-[13px]">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Any</SelectItem>
                      {YEARS.filter((y) => !yearFrom || y >= Number(yearFrom)).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="hidden sm:block h-5 w-px bg-border mx-1" />

                <button
                  onClick={() => setShowUpcoming((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[13px] font-medium transition-all ${
                    showUpcoming
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  Upcoming
                </button>

                {(yearFrom || yearTo || showUpcoming) && (
                  <button
                    onClick={() => { setYearFrom(''); setYearTo(''); setShowUpcoming(false); }}
                    className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity font-medium"
                  >
                    Clear dates
                  </button>
                )}
              </div>

              {/* Right Group: Sort dropdown */}
              <div className="flex items-center gap-3 ml-auto">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Sort
                </p>
                <div className="w-48">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger size="sm" className="h-8 text-[13px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="year">Newest First</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                      <SelectItem value="title">Title (A–Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>

          </CardContent>
        </Card>

        {/* Result count + clear all */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            {movies.length}{' '}
            {movies.length === 1 ? 'movie' : 'movies'} shown
            {totalPages > 1 && (
              <span> · Page {currentPage} of {totalPages}</span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Movie grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading movies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No movies found matching your criteria
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4" style={{ marginTop: '4rem' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, idx) =>
                pageNum === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-[36px]"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
