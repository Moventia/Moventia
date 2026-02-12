import { Bell, Heart, MessageCircle, UserPlus, Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { mockNotifications } from '../lib/mockData';


export function NotificationsPage({ onNavigate }) {
  const getIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activity</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Badge variant="default" className="cursor-pointer">All</Badge>
          <Badge variant="outline" className="cursor-pointer">Unread</Badge>
          <Badge variant="outline" className="cursor-pointer">Following</Badge>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {mockNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-l-primary bg-blue-50/50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={notification.fromAvatar} alt={notification.fromUser} />
                    <AvatarFallback>{notification.fromUser[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.fromUser}</span>{' '}
                        <span className="text-muted-foreground">{notification.message}</span>
                      </p>
                      <div className="flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (hidden when there are notifications) */}
        {mockNotifications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                When people interact with your reviews or follow you, you'll see it here
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mark All as Read */}
        {mockNotifications.some(n => !n.read) && (
          <div className="text-center mt-6">
            <Button variant="outline">Mark All as Read</Button>
          </div>
        )}
      </div>
    </div>
  );
}
