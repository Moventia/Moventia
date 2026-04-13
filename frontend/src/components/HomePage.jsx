import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, TrendingUp, Clock, ChevronLeft, ChevronRight, Sparkles, Film, Users, MessageSquare, Zap } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpoilerContent } from './SpoilerContent';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

const scrollRowStyle = `
  .scroll-row-outer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-block: 14px;
  }
  .scroll-row {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 14px;
    overflow-x: auto;
    overflow-y: visible;
    scroll-behavior: smooth;
    padding: 14px 2px 18px;
    scrollbar-width: none;
  }
  .scroll-row::-webkit-scrollbar { display: none; }
  .scroll-movie-card {
    flex: 0 0 240px;
    width: 240px;
  }
  .scroll-arrow-btn {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15,23,42,0.85);
    border: 1px solid rgba(255,255,255,0.12);
    color: #fff;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: all 200ms ease;
    box-shadow: 0 4px 14px rgba(0,0,0,0.45);
    align-self: center;
    z-index: 10;
  }
  .scroll-arrow-btn:hover {
    background: rgba(196,156,85,0.9);
    border-color: rgba(196,156,85,0.5);
    transform: scale(1.08);
  }
  @media (max-width: 640px) {
    .scroll-movie-card { flex: 0 0 200px; width: 200px; }
  }
`;

function ScrollableMovieRow({ movies, onMovieClick }) {
  const rowRef = useRef(null);
  const scroll = (dir) => {
    if (rowRef.current) rowRef.current.scrollBy({ left: dir * 560, behavior: 'smooth' });
  };
  return (
    <div className="scroll-row-outer">
      <button className="scroll-arrow-btn" onClick={() => scroll(-1)} aria-label="Scroll left">
        <ChevronLeft style={{ width: 22, height: 22 }} />
      </button>
      <div ref={rowRef} className="scroll-row">
        {movies.map((movie) => (
          <div key={movie.id} className="scroll-movie-card">
            <MovieCard movie={movie} onClick={() => onMovieClick(movie.id)} />
          </div>
        ))}
      </div>
      <button className="scroll-arrow-btn" onClick={() => scroll(1)} aria-label="Scroll right">
        <ChevronRight style={{ width: 22, height: 22 }} />
      </button>
    </div>
  );
}

const API_URL = 'http://localhost:8080/api';

function MovieCard({ movie, onClick }) {
  return (
    <Card
      className="h-full flex flex-col overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative w-full shrink-0">
        <ImageWithFallback src={movie.poster} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">{movie.rating}</span>
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold mb-1 line-clamp-1 text-foreground">{movie.title}</h3>
        <p className="text-sm text-muted-foreground">{movie.year}</p>
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {(movie.genre || []).slice(0, 2).map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HomePage({ isLoggedIn }) {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isPausedRef = useRef(false);
  const transitioningRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const reviewsEndpoint = isLoggedIn ? `${API_URL}/reviews/feed` : `${API_URL}/reviews/recent`;
        const reviewsHeaders = isLoggedIn && token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const [moviesRes, reviewsRes] = await Promise.all([
          fetch(`${API_URL}/movies`),
          fetch(reviewsEndpoint, reviewsHeaders ? { headers: reviewsHeaders } : undefined),
        ]);
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          setMovies(data.movies || data);
        }
        if (reviewsRes.ok) setRecentReviews(await reviewsRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn]);

  const featuredMovies = movies.slice(0, 5);
  const trendingMovies = movies.slice(0, 15);
  const editorPicks = movies.slice(3, 18);
  const newReleases = movies.slice(8, 16);
  const featuredMovie = featuredMovies[featuredIndex];

  const genreCounts = movies.reduce((acc, movie) => {
    (movie.genre || []).forEach((genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
    });
    return acc;
  }, {});

  const spotlightGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const changeSlide = useCallback((getNextIndex) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setIsTransitioning(true);
    setTimeout(() => {
      setFeaturedIndex(getNextIndex);
      setIsTransitioning(false);
      transitioningRef.current = false;
    }, 300);
  }, []);

  const goPrev = () => { const total = featuredMovies.length; changeSlide(prev => (prev - 1 + total) % total); };
  const goNext = () => { const total = featuredMovies.length; changeSlide(prev => (prev + 1) % total); };
  const goTo = (idx) => { changeSlide(() => idx); };

  useEffect(() => {
    const total = featuredMovies.length;
    if (total <= 1) return;
    const id = setInterval(() => {
      if (isPausedRef.current || transitioningRef.current) return;
      transitioningRef.current = true;
      setIsTransitioning(true);
      setTimeout(() => {
        setFeaturedIndex(prev => (prev + 1) % total);
        setIsTransitioning(false);
        transitioningRef.current = false;
      }, 300);
    }, 6000);
    return () => clearInterval(id);
  }, [featuredMovies.length]);

  const pauseAutoPlay = () => { isPausedRef.current = true; };
  const resumeAutoPlay = () => { isPausedRef.current = false; };

  if (loading || !featuredMovie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-home cinematic-page min-h-screen bg-background">
      <style>{scrollRowStyle}</style>

      {/* ── Featured Carousel ── */}
      <div
        className="hero-stage"
        style={{ position: 'relative', height: '540px', overflow: 'hidden', width: '100%' }}
        onMouseEnter={pauseAutoPlay}
        onMouseLeave={resumeAutoPlay}
      >
        {featuredMovies.map((m, i) => {
          const isActive = i === featuredIndex && !isTransitioning;
          return (
            <div
              key={m.id}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 700ms ease-in-out',
                zIndex: 1,
              }}
            >
              <ImageWithFallback
                src={m.backdrop || m.poster}
                alt={m.title}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center top', zIndex: 1,
                }}
              />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to right, rgba(7,10,17,0.92) 0%, rgba(7,10,17,0.55) 55%, rgba(7,10,17,0.1) 100%), linear-gradient(to bottom, rgba(26,21,16,0.2) 0%, rgba(7,10,17,0.85) 85%, #070a11 100%)',
                zIndex: 2,
              }} />
            </div>
          );
        })}

        <div style={{ position: 'relative', zIndex: 10, height: '100%' }} className="container mx-auto px-4 flex items-center">
          <div
            className="max-w-xl text-foreground"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}
          >
            <Badge className="mb-3 bg-primary text-primary-foreground hover:bg-primary/90">Featured</Badge>
            <h1 className="text-5xl font-bold mb-3 leading-tight">{featuredMovie.title}</h1>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{featuredMovie.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">{featuredMovie.year}</span>
              <div className="flex gap-1 flex-wrap">
                {featuredMovie.genre.slice(0, 3).map((g) => (
                  <Badge key={g} variant="outline" className="border-foreground/20 text-foreground/70 text-xs">{g}</Badge>
                ))}
              </div>
            </div>
            <p className="text-base mb-6 opacity-80 line-clamp-3 text-foreground/90 leading-relaxed">{featuredMovie.synopsis}</p>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => navigate(`/movie/${featuredMovie.id}`)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Details
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate(`/movie/${featuredMovie.id}/review`)} className="border-foreground/25 text-foreground hover:bg-foreground/10">
                Write Review
              </Button>
            </div>
          </div>
        </div>

        {/* Prev arrow */}
        {featuredMovies.length > 1 && (
          <button onClick={goPrev} aria-label="Previous" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 200ms, border-color 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,156,85,0.8)'; e.currentTarget.style.borderColor = 'rgba(196,156,85,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
            <ChevronLeft style={{ width: 24, height: 24 }} />
          </button>
        )}
        {/* Next arrow */}
        {featuredMovies.length > 1 && (
          <button onClick={goNext} aria-label="Next" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 200ms, border-color 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,156,85,0.8)'; e.currentTarget.style.borderColor = 'rgba(196,156,85,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
            <ChevronRight style={{ width: 24, height: 24 }} />
          </button>
        )}

        {/* Dot indicators */}
        {featuredMovies.length > 1 && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {featuredMovies.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${i + 1}`}
                style={{ width: i === featuredIndex ? '24px' : '8px', height: '8px', borderRadius: '9999px', background: i === featuredIndex ? '#c49c55' : 'rgba(255,255,255,0.35)', border: 'none', padding: 0, cursor: 'pointer', transition: 'width 300ms ease, background 300ms ease' }} />
            ))}
          </div>
        )}
      </div>


      <div className="container mx-auto px-4 py-12 cinematic-content">

        {/* ── Trending Now ── */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/browse')}>View All</Button>
          </div>
          <ScrollableMovieRow movies={trendingMovies} onMovieClick={(id) => navigate(`/movie/${id}`)} />
        </div>

        {/* ── Explore By Genre ── */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Explore By Genre</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/browse')}>Browse Catalog</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {spotlightGenres.map(([genre, count]) => (
              <button
                key={genre}
                onClick={() => navigate('/browse')}
                style={{
                  padding: '18px 12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(145deg, rgba(16,25,39,0.9), rgba(11,18,31,0.8))',
                  border: '1px solid rgba(203,213,225,0.14)',
                  cursor: 'pointer',
                  transition: 'all 250ms ease',
                  textAlign: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,168,109,0.4)'; e.currentTarget.style.background = 'linear-gradient(145deg, rgba(200,168,109,0.08), rgba(16,25,39,0.9))'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(203,213,225,0.14)'; e.currentTarget.style.background = 'linear-gradient(145deg, rgba(16,25,39,0.9), rgba(11,18,31,0.8))'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#e6e8ee' }}>{genre}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Editor's Picks ── */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Editors&apos; Picks</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/browse')}>See More Picks</Button>
          </div>
          <ScrollableMovieRow movies={editorPicks} onMovieClick={(id) => navigate(`/movie/${id}`)} />
        </div>

        {/* ── New This Month ── */}
        {newReleases.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">New This Month</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newReleases.map((movie) => (
                <MovieCard key={`new-${movie.id}`} movie={movie} onClick={() => navigate(`/movie/${movie.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── CTA Banner (non-logged-in) ── */}
        {!isLoggedIn && (
          <div className="mb-12">
            <div style={{
              borderRadius: '16px',
              padding: '48px 40px',
              background: 'linear-gradient(135deg, rgba(200,168,109,0.12) 0%, rgba(16,25,39,0.9) 60%)',
              border: '1px solid rgba(200,168,109,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              boxShadow: '0 0 60px rgba(200,168,109,0.07)',
            }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#f4f6fb', marginBottom: '8px' }}>Join the Conversation</h2>
                <p style={{ color: '#9ca7bc', fontSize: '15px', maxWidth: '480px', lineHeight: 1.6 }}>
                  Create a free account to write reviews, build your watchlist, and connect with thousands of film lovers.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button size="lg" onClick={() => navigate('/signup')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Recent Reviews ── */}
        <div>
          <div className="mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              {isLoggedIn ? 'Reviews From People You Follow' : 'Recent Reviews'}
            </h2>
          </div>
          {recentReviews.length > 0 ? (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md hover:shadow-primary/5 transition-shadow hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <ImageWithFallback src={review.moviePoster} alt={review.movieTitle} className="w-24 h-36 object-cover rounded shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-2 cursor-pointer hover:underline" onClick={() => navigate(`/profile/${review.username}`)}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={review.userAvatar} alt={review.username} />
                                <AvatarFallback>{review.username[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-foreground">{review.username}</span>
                            </div>
                            <h3 className="text-lg font-bold cursor-pointer hover:text-primary text-foreground" onClick={() => navigate(`/movie/${review.movieId}`)}>
                              {review.movieTitle}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="font-semibold mb-2 text-foreground">{review.title}</p>
                        {review.spoiler ? (
                          <SpoilerContent>{review.content}</SpoilerContent>
                        ) : (
                          <p className="text-muted-foreground text-sm mb-3">{review.content}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          <span>{review.likes} likes</span>
                          <span>{review.comments} comments</span>
                        </div>
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
                  {isLoggedIn
                    ? 'No reviews from people you follow yet. Follow more users to personalize your homepage feed.'
                    : 'No reviews yet. Be the first to review a movie!'}
                </p>
                <Button onClick={() => navigate('/browse')}>Browse Movies</Button>
              </CardContent>
            </Card>
          )}
          {recentReviews.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/feed')}>
                View More Reviews
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
