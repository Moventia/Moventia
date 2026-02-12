import { useState } from 'react';
import { Star, MapPin, Calendar, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { mockUsers, mockReviews, currentUser } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';


export function UserProfile({ userId, onNavigate }) {
  const isOwnProfile = !userId || userId === currentUser.id;
  const user = isOwnProfile ? currentUser : mockUsers.find((u) => u.id === userId) || currentUser;
  
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const userReviews = mockReviews.filter((r) => r.userId === user.id);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">{user.name}</h1>
                {!isOwnProfile && (
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? 'outline' : 'default'}
                    className={isFollowing ? 'border-white text-white hover:bg-white/10' : 'bg-white text-purple-600 hover:bg-gray-100'}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              <p className="text-lg mb-4 opacity-90">@{user.username}</p>
              <p className="mb-4 max-w-2xl">{user.bio}</p>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div>
                  <p className="text-2xl font-bold">{user.reviewCount}</p>
                  <p className="text-sm opacity-80">Reviews</p>
                </div>
                <div 
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => onNavigate('followers', { userId: user.id })}
                >
                  <p className="text-2xl font-bold">{user.followers}</p>
                  <p className="text-sm opacity-80">Followers</p>
                </div>
                <div 
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => onNavigate('following', { userId: user.id })}
                >
                  <p className="text-2xl font-bold">{user.following}</p>
                  <p className="text-sm opacity-80">Following</p>
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
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <ImageWithFallback
                        src={review.moviePoster}
                        alt={review.movieTitle}
                        className="w-24 h-36 object-cover rounded cursor-pointer"
                        onClick={() => onNavigate('movie', { id: review.movieId })}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            className="text-xl font-bold cursor-pointer hover:text-primary"
                            onClick={() => onNavigate('movie', { id: review.movieId })}
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
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile ? "You haven't written any reviews yet" : `${user.name} hasn't written any reviews yet`}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => onNavigate('browse')}>
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
                  {isOwnProfile ? "You haven't added any favorites yet" : `${user.name} hasn't added any favorites yet`}
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
    </div>
  );
}
