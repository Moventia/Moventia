import { useState, useEffect } from 'react';
import { Star, Settings, Heart, MessageSquare, ThumbsUp, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EditProfileModal } from './EditProfileModal';
import { SpoilerContent } from './SpoilerContent';
import { useParams } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';
import { MovieCard } from './MovieCard';

const API_URL = 'http://localhost:8080/api';

export function UserProfile({ onProfileUpdate }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  // If no userId prop → viewing own profile
  const isOwnProfile = !userId;

  // ── State ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Fetch profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        let profileData;

        if (isOwnProfile) {
          const res = await fetch(`${API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to load profile');
          profileData = await res.json();
        } else {
          const headers = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API_URL}/profile/${encodeURIComponent(userId)}`, { headers });
          if (!res.ok) throw new Error('User not found');
          profileData = await res.json();
          setIsFollowing(profileData.isFollowedByMe || false);
        }

        setUser({
          id: profileData.id,
          name: profileData.fullName,
          username: profileData.username,
          email: profileData.email,
          bio: profileData.bio || '',
          avatar: profileData.avatarUrl || '',
          reviewCount: profileData.reviewCount,
          followers: profileData.followerCount,
          following: profileData.followingCount,
          isOwnProfile: isOwnProfile || profileData.isOwnProfile || false,
        });

        // Fetch user's reviews from API
        const username = profileData.username;
        const reviewHeaders = {};
        if (token) reviewHeaders.Authorization = `Bearer ${token}`;
        try {
          const reviewsRes = await fetch(`${API_URL}/reviews/user/${encodeURIComponent(username)}`, {
            headers: reviewHeaders,
          });
          if (reviewsRes.ok) {
            setUserReviews(await reviewsRes.json());
          }
        } catch {
          // Reviews fetch failed — show empty
          setUserReviews([]);
        }

        // Fetch user's favorites from API
        try {
          const favsRes = await fetch(`${API_URL}/favorites/user/${encodeURIComponent(username)}`);
          if (favsRes.ok) {
            setUserFavorites(await favsRes.json());
          }
        } catch {
          setUserFavorites([]);
        }

        // Fetch user's activity from API
        try {
          const activityRes = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}/activity`);
          if (activityRes.ok) {
            setUserActivity(await activityRes.json());
          }
        } catch {
          setUserActivity([]);
        }
      } catch (err) {
        setError('Could not load profile. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isOwnProfile]);

  // ── Follow / Unfollow ─────────────────────────────────────────────────────
  const handleFollowToggle = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/profile/${encodeURIComponent(user.username)}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setUser((prev) => ({
          ...prev,
          followers: isFollowing ? Math.max(0, prev.followers - 1) : prev.followers + 1,
        }));
      }
    } catch {
      // silent
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Edit profile saved handler ─────────────────────────────────────────────
  const handleEditSaved = (data) => {
    setUser((prev) => ({
      ...prev,
      name: data.fullName,
      bio: data.bio || '',
      avatar: data.avatarUrl || '',
    }));
    setShowEditModal(false);
    if (onProfileUpdate) onProfileUpdate();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{error || 'User not found'}</p>
      </div>
    );
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#1a1510] via-[#15120e] to-[#0f0d0a]">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-xl">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold text-foreground">{user.name}</h1>
                {!isOwnProfile && (
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? 'outline' : 'default'}
                    className={isFollowing ? 'border-foreground/30 text-foreground hover:bg-foreground/10' : ''}
                    disabled={followLoading}
                  >
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    className="border-foreground/30 text-foreground hover:bg-foreground/10"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              <p className="text-lg mb-4 text-muted-foreground">@{user.username}</p>
              <p className="mb-4 max-w-2xl text-foreground/80">{user.bio}</p>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div>
                  <p className="text-2xl font-bold text-foreground">{user.reviewCount}</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
                <div
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => navigate(`/profile/${user.username}/followers`)}
                >
                  <p className="text-2xl font-bold text-foreground">{user.followers}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => navigate(`/profile/${user.username}/following`)}
                >
                  <p className="text-2xl font-bold text-foreground">{user.following}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reviews" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted rounded-full p-1 h-auto">
              <TabsTrigger 
                value="reviews"
                className="rounded-full py-2 data-[state=active]:bg-[#c8a86d] data-[state=active]:text-[#0f0d0a] text-muted-foreground font-medium transition-all"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="favorites"
                className="rounded-full py-2 data-[state=active]:bg-[#c8a86d] data-[state=active]:text-[#0f0d0a] text-muted-foreground font-medium transition-all"
              >
                Favorites
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="rounded-full py-2 data-[state=active]:bg-[#c8a86d] data-[state=active]:text-[#0f0d0a] text-muted-foreground font-medium transition-all"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reviews" className="space-y-4">
            {userReviews.length > 0 ? (
              userReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md hover:shadow-primary/5 transition-shadow hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <ImageWithFallback
                        src={review.moviePoster}
                        alt={review.movieTitle}
                        className="w-24 h-36 object-cover rounded cursor-pointer"
                        onClick={() => navigate(`/movie/${review.movieId}`)}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className="text-xl font-bold cursor-pointer hover:text-primary text-foreground"
                            onClick={() => navigate(`/movie/${review.movieId}`)}
                          >
                            {review.movieTitle}
                          </h3>
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
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile
                      ? "You haven't written any reviews yet"
                      : `${user.name} hasn't written any reviews yet`}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/browse')}>
                      Browse Movies to Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            {userFavorites.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {userFavorites.map((movie) => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie} 
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile
                      ? "You haven't added any favorites yet"
                      : `${user.name} hasn't added any favorites yet`}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/browse')}>
                      Browse Movies to Favorite
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {userActivity.length > 0 ? (
              <div className="space-y-4">
                {userActivity.map((item) => (
                  <Card key={item.id} className="hover:bg-accent/5 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {item.type === 'review' && (
                          <div className="h-10 w-10 rounded-full bg-yellow-400/10 flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                        {item.type === 'favorite' && (
                          <div className="h-10 w-10 rounded-full bg-red-400/10 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-red-400 fill-red-400" />
                          </div>
                        )}
                        {item.type === 'like' && (
                          <div className="h-10 w-10 rounded-full bg-blue-400/10 flex items-center justify-center">
                            <ThumbsUp className="h-5 w-5 text-blue-400 fill-blue-400" />
                          </div>
                        )}
                        {item.type === 'follow' && (
                          <div className="h-10 w-10 rounded-full bg-green-400/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-green-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-medium text-foreground">{isOwnProfile ? 'You ' : user.name}</span>
                          <span className="text-muted-foreground">
                            {item.type === 'review' && 'wrote a review for'}
                            {item.type === 'favorite' && 'added to favorites'}
                            {item.type === 'like' && 'liked a review by'}
                            {item.type === 'follow' && 'started following'}
                          </span>
                          {item.type === 'review' && (
                            <span 
                              className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/movie/${item.data.movieId}`)}
                            >
                              {item.data.movieTitle}
                            </span>
                          )}
                          {item.type === 'favorite' && (
                            <span 
                              className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/movie/${item.data.movieId}`)}
                            >
                              {item.data.movieTitle}
                            </span>
                          )}
                          {item.type === 'like' && (
                            <>
                              <span 
                                className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                                onClick={() => navigate(`/profile/${item.data.authorName}`)}
                              >
                                @{item.data.authorName}
                              </span>
                              <span className="text-muted-foreground">on</span>
                              <span 
                                className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                                onClick={() => navigate(`/movie/${item.data.movieId}`)}
                              >
                                {item.data.movieTitle}
                              </span>
                            </>
                          )}
                          {item.type === 'follow' && (
                            <span 
                               className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                               onClick={() => navigate(`/profile/${item.data.username}`)}
                            >
                              {item.data.fullName} (@{item.data.username})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>

                      {(item.type === 'review' || item.type === 'favorite' || item.type === 'like') && (
                        <div className="hidden sm:block flex-shrink-0 ml-4">
                          <img 
                            src={item.data.moviePoster} 
                            alt={item.data.movieTitle} 
                            className="h-12 w-8 object-cover rounded shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/movie/${item.data.movieId}`)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No recent activity</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}