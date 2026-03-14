import { useState } from 'react';
import { Search, Star } from 'lucide-react';
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
import { mockMovies } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

export function BrowseMovies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const allGenres = [
    'All',
    'Action',
    'Sci-Fi',
    'Horror',
    'Romance',
    'Comedy',
    'Drama',
    'Thriller',
    'Adventure'
  ];

  const filteredMovies = mockMovies
    .filter((movie) => {
      const matchesSearch = movie.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesGenre =
        selectedGenre === 'all' || movie.genre.includes(selectedGenre);

      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">

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

        <div className="mb-4">
          <p className="text-muted-foreground">
            {filteredMovies.length}{' '}
            {filteredMovies.length === 1 ? 'movie' : 'movies'} found
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
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

        {filteredMovies.length === 0 && (
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
      </div>
    </div>
  );
}
