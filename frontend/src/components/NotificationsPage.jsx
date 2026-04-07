import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const API_URL = 'http://localhost:8080/api';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/notifications/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      // silent
    }
  };

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activity</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Badge variant="default" className="cursor-pointer">All</Badge>
          <Badge variant="outline" className="cursor-pointer">Unread</Badge>
          <Badge variant="outline" className="cursor-pointer">Following</Badge>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <>
            {/* Notifications List */}
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer hover:shadow-md hover:shadow-primary/5 transition-shadow ${
                    !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
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
                            <span className="font-semibold text-foreground">{notification.fromUser}</span>{' '}
                            <span className="text-muted-foreground">{notification.message}</span>
                          </p>
                          <div className="flex-shrink-0">
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mark All as Read */}
            {notifications.some(n => !n.read) && (
              <div className="text-center mt-6">
                <Button variant="outline" onClick={markAllAsRead}>Mark All as Read</Button>
              </div>
            )}
          </>
        ) : (
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
      </div>
    </div>
  );
}
