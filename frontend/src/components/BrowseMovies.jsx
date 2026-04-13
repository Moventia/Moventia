import { useState, useEffect } from 'react';
import { Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
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

const API_URL = 'http://localhost:8080/api';

export function BrowseMovies() {
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [genres, setGenres] = useState([]);

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
    if (q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search]);

  const allGenres = ['All', ...genres.map((g) => g.name)];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, sortBy]);

  // Fetch movies from API
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedGenre !== 'all') params.set('genre', selectedGenre);
        if (sortBy) params.set('sort', sortBy);
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

    const debounce = setTimeout(fetchMovies, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedGenre, sortBy, currentPage]);

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
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');

      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="page-browse cinematic-page min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Browse Movies</h1>
          <p className="text-muted-foreground">
            Discover your next favorite film
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="year">Newest</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {allGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant={
                    selectedGenre === genre.toLowerCase() ||
                    (genre === 'All' && selectedGenre === 'all')
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => setSelectedGenre(genre.toLowerCase())}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            {movies.length}{' '}
            {movies.length === 1 ? 'movie' : 'movies'} shown
            {totalPages > 1 && (
              <span> · Page {currentPage} of {totalPages}</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading movies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <Card
                key={movie.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all hover:scale-105 hover:border-primary/30"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <div className="aspect-[2/3] relative">
                  <ImageWithFallback
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">
                      {movie.rating}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1 text-foreground">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {movie.year}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {movie.genre.slice(0, 2).map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No movies found matching your criteria
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('all');
              }}
            >
              Clear Filters
            </Button>
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
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    …
                  </span>
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
