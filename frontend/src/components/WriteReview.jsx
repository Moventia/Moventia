import { useState, useEffect } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useParams, useLocation } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

const API_URL = 'http://localhost:8080/api';

export function WriteReview() {
  const { id: idParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const editReviewId = searchParams.get('edit');

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);

  // Fetch movie (& review if editing) from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/movies/${idParam}`);
        if (res.ok) {
          setMovie(await res.json());
        }
        
        if (editReviewId) {
          const reviewsRes = await fetch(`${API_URL}/reviews/movie/${idParam}`);
          if (reviewsRes.ok) {
            const reviews = await reviewsRes.json();
            const review = reviews.find(r => r.id === editReviewId);
            if (review) {
              setRating(review.rating);
              setTitle(review.title);
              setContent(review.content);
              setHasSpoilers(review.spoiler);
            }
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (idParam) fetchData();
  }, [idParam, editReviewId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editReviewId ? `${API_URL}/reviews/${editReviewId}` : `${API_URL}/reviews`;
      const method = editReviewId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: idParam,
          rating,
          title: title.trim(),
          content: content.trim(),
          spoiler: hasSpoilers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review');
        return;
      }

      navigate(`/movie/${idParam}`);
    } catch {
      setError('Could not submit review. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Movie not found</p>
              <Button
                onClick={() => navigate('/browse')}
                className="mt-4"
              >
                Browse Movies
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">{editReviewId ? 'Edit Review' : 'Write a Review'}</h1>
          <p className="text-muted-foreground">
            {editReviewId ? 'Update your thoughts about this movie' : 'Share your thoughts about this movie'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <Card>
              <CardContent className="p-4">
                <ImageWithFallback
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded mb-4"
                />
                <h3 className="font-bold text-lg mb-1 text-foreground">
                  {movie.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {movie.year} • {movie.genre.join(', ')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Directed by {movie.director}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Your Review</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                  <div className="space-y-2">
                    <Label className="text-foreground">Rating *</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-10 w-10 ${
                              star <= (hoverRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {rating === 1 && 'Terrible'}
                        {rating === 2 && 'Bad'}
                        {rating === 3 && 'Average'}
                        {rating === 4 && 'Good'}
                        {rating === 5 && 'Excellent'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">Review Title *</Label>
                    <Input
                      id="title"
                      placeholder="Sum up your review in one line"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-foreground">Your Review *</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your detailed thoughts about the movie..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.length} characters
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <Label htmlFor="spoilers" className="cursor-pointer text-foreground">
                          Contains Spoilers
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Check this if your review reveals plot details
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="spoilers"
                      checked={hasSpoilers}
                      onCheckedChange={setHasSpoilers}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={rating === 0 || !title || !content || submitting}
                    >
                      {submitting ? 'Submitting...' : editReviewId ? 'Update Review' : 'Publish Review'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(`/movie/${idParam}`)
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  Review Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Be respectful and constructive in your criticism</li>
                  <li>• Focus on the movie itself, not other reviewers</li>
                  <li>• Mark spoilers appropriately</li>
                  <li>• Provide specific examples to support your opinion</li>
                  <li>• Keep your review relevant to the movie</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
