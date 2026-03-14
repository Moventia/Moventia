import { useState, useEffect } from 'react';
import { Star, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { mockReviews } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EditProfileModal } from './EditProfileModal';
import { useParams } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

const API_URL = 'http://localhost:8080/api';

export function UserProfile({ onProfileUpdate }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  // If no userId prop → viewing own profile
  const isOwnProfile = !userId;

  // ── State ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Reviews stay on mock until the reviews API is built
  const userReviews = user
    ? mockReviews.filter((r) => r.userId === userId)
    : [];

  // ── Fetch profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (isOwnProfile) {
          // Own profile — requires JWT
          const res = await fetch(`${API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to load profile');
          const data = await res.json();
          setUser({
            id: data.id,
            name: data.fullName,
            username: data.username,
            email: data.email,
            bio: data.bio || '',
            avatar: data.avatarUrl || '',
            reviewCount: data.reviewCount,
            followers: data.followerCount,
            following: data.followingCount,
            isOwnProfile: true,
          });
        } else {
          // Other user's profile — call GET /api/profile/{username}
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          const res = await fetch(`${API_URL}/profile/${encodeURIComponent(userId)}`, { headers });
          if (!res.ok) throw new Error('User not found');
          const data = await res.json();
          setUser({
            id: data.id,
            name: data.fullName,
            username: data.username,
            bio: data.bio || '',
            avatar: data.avatarUrl || '',
            reviewCount: data.reviewCount,
            followers: data.followerCount,
            following: data.followingCount,
            isOwnProfile: data.isOwnProfile || false,
          });
          setIsFollowing(data.isFollowedByMe || false);
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
    // Refresh nav bar user data
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
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

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

          <TabsContent value="favorites">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "You haven't added any favorites yet"
                    : `${user.name} hasn't added any favorites yet`}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No recent activity</p>
              </CardContent>
            </Card>
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