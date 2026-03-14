import { Star, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { mockMovies, mockReviews } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

export function HomePage({ isLoggedIn }) {
  const navigate = useNavigate();
  const featuredMovie = mockMovies[0];
  const trendingMovies = mockMovies.slice(0, 4);
  const recentReviews = mockReviews;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-b from-[#1a1510] via-[#0f0d0a] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src={featuredMovie.poster}
            alt={featuredMovie.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-foreground">
            <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90">Featured</Badge>
            <h1 className="text-5xl font-bold mb-4">{featuredMovie.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{featuredMovie.rating}</span>
              </div>
              <span>{featuredMovie.year}</span>
              <span>{featuredMovie.duration}</span>
              <div className="flex gap-1">
                {featuredMovie.genre.map((g) => (
                  <Badge key={g} variant="outline" className="border-foreground/30 text-foreground/80">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-lg mb-6 opacity-90">{featuredMovie.synopsis}</p>
            <div className="flex gap-3">
              <Button 
                size="lg" 
                onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View Details
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate(`/movie/${featuredMovie.id}/review`)}
                className="border-foreground/30 text-foreground hover:bg-foreground/10"
              >
                Write Review
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Trending Movies */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/browse')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingMovies.map((movie) => (
              <Card 
                key={movie.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all hover:border-primary/30"
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
                    <span className="text-sm font-semibold">{movie.rating}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 text-foreground">{movie.title}</h3>
                  <p className="text-sm text-muted-foreground">{movie.year} • {movie.genre.join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{movie.reviewCount} reviews</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Recent Reviews</h2>
          </div>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md hover:shadow-primary/5 transition-shadow hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <ImageWithFallback
                      src={review.moviePoster}
                      alt={review.movieTitle}
                      className="w-24 h-36 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div 
                            className="flex items-center gap-2 mb-2 cursor-pointer hover:underline"
                            onClick={() => navigate(`/profile/${review.userId}`)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.userAvatar} alt={review.username} />
                              <AvatarFallback>{review.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground">{review.username}</span>
                          </div>
                          <h3 
                            className="text-lg font-bold cursor-pointer hover:text-primary text-foreground"
                            onClick={() => navigate(`/movie/${review.movieId}`)}
                          >
                            {review.movieTitle}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="font-semibold mb-2 text-foreground">{review.title}</p>
                      <p className="text-muted-foreground text-sm mb-3">{review.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{review.createdAt}</span>
                        <span>{review.likes} likes</span>
                        <span>{review.comments} comments</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => navigate('/feed')}>
              View More Reviews
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
