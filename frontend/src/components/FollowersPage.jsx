import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { mockUsers, currentUser } from '../lib/mockData';



export function FollowersPage({ userId, onNavigate }) {
  const isOwnProfile = !userId || userId === currentUser.id;
  const user = isOwnProfile ? currentUser : mockUsers.find((u) => u.id === userId) || currentUser;

  const [followers] = useState(mockUsers.slice(0, 2));
  const [following] = useState(mockUsers);

  const toggleFollow = (userId) => {
    // Simulate follow/unfollow
    console.log('Toggle follow for user:', userId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{user.name}'s Connections</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="followers">
              Followers ({user.followers})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({user.following})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-3">
            {followers.map((follower) => (
              <Card key={follower.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => onNavigate('user-profile', { userId: follower.id })}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.avatar} alt={follower.name} />
                        <AvatarFallback>{follower.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold hover:underline">{follower.name}</p>
                        <p className="text-sm text-muted-foreground">@{follower.username}</p>
                        <p className="text-sm text-muted-foreground mt-1">{follower.reviewCount} reviews</p>
                      </div>
                    </div>
                    <Button
                      variant={follower.isFollowing ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleFollow(follower.id)}
                    >
                      {follower.isFollowing ? (
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="following" className="space-y-3">
            {following.map((followedUser) => (
              <Card key={followedUser.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => onNavigate('user-profile', { userId: followedUser.id })}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={followedUser.avatar} alt={followedUser.name} />
                        <AvatarFallback>{followedUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold hover:underline">{followedUser.name}</p>
                        <p className="text-sm text-muted-foreground">@{followedUser.username}</p>
                        <p className="text-sm text-muted-foreground mt-1">{followedUser.reviewCount} reviews</p>
                      </div>
                    </div>
                    <Button
                      variant={followedUser.isFollowing ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleFollow(followedUser.id)}
                    >
                      {followedUser.isFollowing ? (
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
