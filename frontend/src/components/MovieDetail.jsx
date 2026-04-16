import { useState, useEffect } from 'react';
import { Star, Calendar, Clock, User as UserIcon, Heart, Share2, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpoilerContent } from './SpoilerContent';
import { useParams } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';
import { ReviewComments } from './ReviewComments';

const API_URL = 'http://localhost:8080/api';



export function MovieDetail({ isLoggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [movieReviews, setMovieReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedComments, setExpandedComments] = useState({}); // { reviewId: boolean }

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [movieRes, reviewsRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/movies/${id}`),
          fetch(`${API_URL}/reviews/movie/${id}`, { headers }),
          token ? fetch(`${API_URL}/profile/me`, { headers }) : Promise.resolve(null),
        ]);

        if (!movieRes.ok) {
          setError('Movie not found');
          return;
        }

        const movieData = await movieRes.json();
        setMovie(movieData);

        if (reviewsRes.ok) {
          setMovieReviews(await reviewsRes.json());
        }
        
        if (profileRes && profileRes.ok) {
          setCurrentUser(await profileRes.json());
          // Check if favorited
          const favRes = await fetch(`${API_URL}/favorites/check/${id}`, { headers });
          if (favRes.ok) {
            const favData = await favRes.json();
            setIsFavorited(favData.isFavorited);
          }
        }
      } catch {
        setError('Could not load movie. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!isLoggedIn || favoriteLoading) {
      if (!isLoggedIn) navigate('/login');
      return;
    }
    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/favorites/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch {
      // silent
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMovieReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch {
      // silent
    }
  };

  const handleLike = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const review = movieReviews.find((r) => r.id === reviewId);
      if (!review) return;

      if (review.isLiked) {
        await fetch(`${API_URL}/reviews/${reviewId}/like`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setMovieReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, isLiked: false, likes: r.likes - 1 } : r,
          ),
        );
      } else {
        await fetch(`${API_URL}/reviews/${reviewId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        setMovieReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, isLiked: true, likes: r.likes + 1 } : r,
          ),
        );
      }
    } catch {
    }
  };

  const toggleComments = (reviewId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading movie...</p>
      </div>
    );
  }

  if (error || !movie) {
    return <div className="container mx-auto px-4 py-8 text-foreground">{error || 'Movie not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-t from-background to-transparent">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex gap-6 items-end">
            <Card className="w-48 overflow-hidden shadow-2xl">
              <ImageWithFallback
                src={movie.poster}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </Card>
            <div className="text-foreground pb-4">
              <h1 className="text-5xl font-bold mb-3">{movie.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-bold text-lg">{movie.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{movie.duration}</span>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {movie.genre.map((g) => (
                  <Badge key={g} variant="secondary" className="bg-foreground/10 text-foreground border-0">
                    {g}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="lg"
                  onClick={() => navigate(`/movie/${movie.id}/review`)}
                >
                  Write Review
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={`bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 ${isFavorited ? 'text-red-500 border-red-500/50' : ''}`}
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Add to Favorites'}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 min-w-[120px]"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Share'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Synopsis */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Synopsis</h2>
                <p className="text-muted-foreground leading-relaxed">{movie.synopsis}</p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Reviews ({movieReviews.length})</h2>
                  <Button onClick={() => navigate(`/movie/${movie.id}/review`)}>
                    Write Review
                  </Button>
                </div>

                {movieReviews.length > 0 ? (
                  <div className="space-y-6">
                    {movieReviews.map((review) => (
                      <div key={review.id}>
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar 
                            className="cursor-pointer"
                            onClick={() => navigate(`/profile/${review.username}`)}
                          >
                            <AvatarImage src={review.userAvatar} alt={review.username} />
                            <AvatarFallback>{review.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span 
                                className="font-semibold cursor-pointer hover:underline text-foreground"
                                onClick={() => navigate(`/profile/${review.username}`)}
                              >
                                {review.username}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{review.title}</h3>
                              <div className="flex items-center gap-0.5">
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
                            {review.spoiler ? (
                              <SpoilerContent>{review.content}</SpoilerContent>
                            ) : (
                              <p className="text-muted-foreground">{review.content}</p>
                            )}

                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 transition-colors ${review.isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => handleLike(review.id)}
                              >
                                <Heart className={`h-4 w-4 mr-2 ${review.isLiked ? 'fill-current' : ''}`} />
                                <span className="font-semibold">{review.likes}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 transition-colors ${expandedComments[review.id] ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => toggleComments(review.id)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span className="font-semibold">{review.comments}</span>
                              </Button>
                              
                              {currentUser && currentUser.id === review.userId && (
                                <div className="ml-auto flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 border-foreground/10 hover:bg-foreground/5 text-xs"
                                    onClick={() => navigate(`/movie/${movie.id}/review?edit=${review.id}`)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="h-8 text-xs"
                                    onClick={() => handleDeleteReview(review.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>

                            {expandedComments[review.id] && (
                              <div className="mt-2">
                                <ReviewComments
                                  reviewId={review.id}
                                  currentUser={currentUser}
                                  isLoggedIn={isLoggedIn}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator className="mt-6" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
                    <Button onClick={() => navigate(`/movie/${movie.id}/review`)}>
                      Write the First Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Movie Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 text-foreground">Movie Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Director</p>
                    <p className="font-semibold text-foreground">{movie.director}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cast</p>
                    <div className="space-y-1">
                      {movie.cast.map((actor) => (
                        <p key={actor} className="font-semibold text-foreground">{actor}</p>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Release Year</p>
                    <p className="font-semibold text-foreground">{movie.year}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold text-foreground">{movie.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 text-foreground">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-foreground">{movie.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-bold text-foreground">{movieReviews.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
