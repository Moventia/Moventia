import { useState, useEffect } from 'react';
import { Heart, MessageSquare, Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpoilerContent } from './SpoilerContent';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';
import { ReviewComments } from './ReviewComments';

const API_URL = 'http://localhost:8080/api';

export function FeedPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedScope, setFeedScope] = useState('following');
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedComments, setExpandedComments] = useState({}); // { reviewId: boolean }
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        const [feedRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/reviews/feed?scope=${feedScope}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          token ? fetch(`${API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }) : Promise.resolve(null)
        ]);

        if (feedRes.ok) {
          setReviews(await feedRes.json());
        }
        if (profileRes && profileRes.ok) {
          setCurrentUser(await profileRes.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [feedScope]);

  const toggleComments = (reviewId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handleLike = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    try {
      if (review.isLiked) {
        await fetch(`${API_URL}/reviews/${reviewId}/like`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, isLiked: false, likes: r.likes - 1 } : r,
          ),
        );
      } else {
        await fetch(`${API_URL}/reviews/${reviewId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, isLiked: true, likes: r.likes + 1 } : r,
          ),
        );
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="page-feed cinematic-page min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Your Feed</h1>
          <p className="text-muted-foreground">
            {feedScope === 'following'
              ? 'Reviews from people you follow'
              : 'Reviews from everyone on Moventia'}
          </p>
          <div className="mt-4 inline-flex gap-2 rounded-full border border-border p-1">
            <Button
              size="sm"
              variant={feedScope === 'following' ? 'default' : 'ghost'}
              onClick={() => setFeedScope('following')}
            >
              Following
            </Button>
            <Button
              size="sm"
              variant={feedScope === 'all' ? 'default' : 'ghost'}
              onClick={() => setFeedScope('all')}
            >
              All People
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading feed...</p>
          </div>
        ) : reviews.length > 0 ? (
          /* Feed Items */
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md hover:shadow-primary/5 transition-shadow hover:border-primary/30">
                <CardContent className="p-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar 
                      className="cursor-pointer"
                      onClick={() => navigate(`/profile/${review.username}`)}
                    >
                      <AvatarImage src={review.userAvatar} alt={review.username} />
                      <AvatarFallback>{review.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-semibold cursor-pointer hover:underline text-foreground whitespace-nowrap"
                          onClick={() => navigate(`/profile/${review.username}`)}
                        >
                          {review.username}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          reviewed a movie • {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex gap-4">
                    <ImageWithFallback
                      src={review.moviePoster}
                      alt={review.movieTitle}
                      className="w-24 h-36 object-cover rounded cursor-pointer"
                      onClick={() => navigate(`/movie/${review.movieId}`)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 
                          className="text-xl font-bold cursor-pointer hover:text-primary text-foreground"
                          onClick={() => navigate(`/movie/${review.movieId}`)}
                        >
                          {review.movieTitle}
                        </h3>
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
                      <p className="font-semibold mb-2 text-foreground">{review.title}</p>
                      {review.spoiler ? (
                        <SpoilerContent>{review.content}</SpoilerContent>
                      ) : (
                        <p className="text-muted-foreground text-sm">{review.content}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {feedScope === 'following'
                  ? 'Your feed is empty. Follow other users to see their reviews here!'
                  : 'No reviews yet from the community.'}
              </p>
              <Button onClick={() => navigate('/browse')}>Browse Movies</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
