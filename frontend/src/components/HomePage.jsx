import { Star, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { mockMovies, mockReviews } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';


export function HomePage({ onNavigate }) {
  const featuredMovie = mockMovies[0];
  const trendingMovies = mockMovies.slice(0, 4);
  const recentReviews = mockReviews;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-r from-purple-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src={featuredMovie.poster}
            alt={featuredMovie.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <Badge className="mb-4 bg-yellow-500 text-black hover:bg-yellow-600">Featured</Badge>
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
                  <Badge key={g} variant="outline" className="border-white text-white">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-lg mb-6 opacity-90">{featuredMovie.synopsis}</p>
            <div className="flex gap-3">
              <Button 
                size="lg" 
                onClick={() => onNavigate('movie', { id: featuredMovie.id })}
                className="bg-white text-black hover:bg-gray-200"
              >
                View Details
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onNavigate('write-review', { movieId: featuredMovie.id })}
                className="border-white text-white hover:bg-white/10"
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
              <h2 className="text-3xl font-bold">Trending Now</h2>
            </div>
            <Button variant="ghost" onClick={() => onNavigate('browse')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingMovies.map((movie) => (
              <Card 
                key={movie.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate('movie', { id: movie.id })}
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
                  <h3 className="font-semibold mb-1">{movie.title}</h3>
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
            <h2 className="text-3xl font-bold">Recent Reviews</h2>
          </div>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
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
                            onClick={() => onNavigate('user-profile', { userId: review.userId })}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.userAvatar} alt={review.username} />
                              <AvatarFallback>{review.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{review.username}</span>
                          </div>
                          <h3 
                            className="text-lg font-bold cursor-pointer hover:text-primary"
                            onClick={() => onNavigate('movie', { id: review.movieId })}
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
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="font-semibold mb-2">{review.title}</p>
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
            <Button variant="outline" onClick={() => onNavigate('feed')}>
              View More Reviews
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
