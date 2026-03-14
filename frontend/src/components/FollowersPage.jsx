import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useParams } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

const API_URL = 'http://localhost:8080/api';

export function FollowersPage({ tab = 'followers' }) {
  const { userId: username } = useParams();
  const navigate = useNavigate();

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // We also need basic info about the user whose page this is, to show in the header.
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // Fetch the user's basic profile
        const profileRes = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}`, { headers });
        if (!profileRes.ok) throw new Error('User not found');
        const profileData = await profileRes.json();
        setProfileUser(profileData);

        // Fetch followers
        const followersRes = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}/followers`, { headers });
        if (followersRes.ok) {
          const fData = await followersRes.json();
          setFollowers(fData);
        }

        // Fetch following
        const followingRes = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}/following`, { headers });
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowing(followingData);
        }

      } catch (err) {
        setError(err.message || 'Could not load connections.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchConnections();
    }
  }, [username]);

  const toggleFollow = async (targetUsername, isCurrentlyFollowing, listType) => {
    try {
      const token = localStorage.getItem('token');
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/profile/${encodeURIComponent(targetUsername)}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Optimistically update the local state for both lists just in case
        const updateList = (list) => 
          list.map(u => u.username === targetUsername 
            ? { ...u, isFollowedByMe: !isCurrentlyFollowing } 
            : u);

        setFollowers(updateList(followers));
        setFollowing(updateList(following));
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Loading connections...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-destructive mb-4">{error || 'User not found'}</p>
        <Button onClick={() => navigate('/')} variant="outline">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">{profileUser.fullName}'s Connections</h1>
          <p className="text-muted-foreground">@{profileUser.username}</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="followers">
              Followers ({profileUser.followerCount})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({profileUser.followingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-3">
            {followers.length > 0 ? followers.map((follower) => (
              <Card key={follower.id} className="hover:shadow-md hover:shadow-primary/5 transition-shadow hover:border-primary/30 bg-[#101010] border-[#1e1e1e]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => navigate(`/profile/${follower.username}`)}
                    >
                      <Avatar className="h-12 w-12 border border-primary/20">
                        <AvatarImage src={follower.avatarUrl} alt={follower.fullName} />
                        <AvatarFallback>{follower.fullName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold hover:text-primary text-foreground transition-colors">{follower.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{follower.username}</p>
                        <p className="text-sm text-muted-foreground mt-1">{follower.reviewCount} reviews</p>
                      </div>
                    </div>
                    {!follower.isOwnProfile && (
                      <Button
                        variant={follower.isFollowedByMe ? 'outline' : 'default'}
                        size="sm"
                        className={follower.isFollowedByMe ? "border-foreground/30 text-foreground hover:bg-foreground/10" : ""}
                        onClick={() => toggleFollow(follower.username, follower.isFollowedByMe, 'followers')}
                      >
                        {follower.isFollowedByMe ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <p className="text-muted-foreground text-center py-8">No followers yet.</p>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-3">
            {following.length > 0 ? following.map((followedUser) => (
              <Card key={followedUser.id} className="hover:shadow-md hover:shadow-primary/5 transition-shadow hover:border-primary/30 bg-[#101010] border-[#1e1e1e]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => navigate(`/profile/${followedUser.username}`)}
                    >
                      <Avatar className="h-12 w-12 border border-primary/20">
                        <AvatarImage src={followedUser.avatarUrl} alt={followedUser.fullName} />
                        <AvatarFallback>{followedUser.fullName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold hover:text-primary text-foreground transition-colors">{followedUser.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{followedUser.username}</p>
                        <p className="text-sm text-muted-foreground mt-1">{followedUser.reviewCount} reviews</p>
                      </div>
                    </div>
                    {!followedUser.isOwnProfile && (
                      <Button
                        variant={followedUser.isFollowedByMe ? 'outline' : 'default'}
                        size="sm"
                        className={followedUser.isFollowedByMe ? "border-foreground/30 text-foreground hover:bg-foreground/10" : ""}
                        onClick={() => toggleFollow(followedUser.username, followedUser.isFollowedByMe, 'following')}
                      >
                        {followedUser.isFollowedByMe ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <p className="text-muted-foreground text-center py-8">Not following anyone yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
