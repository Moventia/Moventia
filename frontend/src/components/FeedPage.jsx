import { Heart, MessageCircle, Share2, Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { mockReviews } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';



export function FeedPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Feed</h1>
          <p className="text-muted-foreground">Reviews from people you follow</p>
        </div>

        {/* Feed Items */}
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar 
                    className="cursor-pointer"
                    onClick={() => onNavigate('user-profile', { userId: review.userId })}
                  >
                    <AvatarImage src={review.userAvatar} alt={review.username} />
                    <AvatarFallback>{review.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p 
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => onNavigate('user-profile', { userId: review.userId })}
                    >
                      {review.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      reviewed a movie • {review.createdAt}
                    </p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={review.moviePoster}
                    alt={review.movieTitle}
                    className="w-24 h-36 object-cover rounded cursor-pointer"
                    onClick={() => onNavigate('movie', { id: review.movieId })}
                  />
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold mb-2 cursor-pointer hover:text-primary"
                      onClick={() => onNavigate('movie', { id: review.movieId })}
                    >
                      {review.movieTitle}
                    </h3>
                    <div className="flex items-center gap-1 mb-3">
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
                    <p className="font-semibold mb-2">{review.title}</p>
                    <p className="text-muted-foreground text-sm">{review.content}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-4 pt-4 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={review.isLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${review.isLiked ? 'fill-current' : ''}`} />
                    {review.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {review.comments}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline">Load More</Button>
        </div>
      </div>
    </div>
  );
}
