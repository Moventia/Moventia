import { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const API_URL = 'http://localhost:8080/api';

export function NotificationsPage({ onRefresh }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          // Sync navbar badge on mount
          if (onRefresh) onRefresh();
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
        if (onRefresh) onRefresh();
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
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'following') return n.type === 'follow' || n.type === 'review';
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your activity</p>
            </div>
            {notifications.some(n => !n.read) && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary hover:text-primary hover:bg-primary/10">
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Badge 
            variant={filter === 'all' ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-all hover:scale-105"
            onClick={() => setFilter('all')}
          >
            All
          </Badge>
          <Badge 
            variant={filter === 'unread' ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-all hover:scale-105"
            onClick={() => setFilter('unread')}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </Badge>
          <Badge 
            variant={filter === 'following' ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-all hover:scale-105"
            onClick={() => setFilter('following')}
          >
            Following
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-none bg-card/50 backdrop-blur-sm ${
                  !notification.read ? 'ring-1 ring-primary/20 bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={notification.fromAvatar} alt={notification.fromUser || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {notification.fromUser ? notification.fromUser[0].toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">
                        <span className="font-bold text-foreground hover:underline decoration-primary/30 underline-offset-4 cursor-pointer">
                          {notification.fromUser || 'Someone'}
                        </span>{' '}
                        <span className="text-muted-foreground">{notification.message}</span>
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/30" />
                        {new Date(notification.timestamp).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-1.5 rounded-full bg-background/50 group-hover:scale-110 transition-transform shadow-sm">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed bg-transparent">
            <CardContent className="p-12 text-center">
              <div className="relative inline-block mb-4">
                <Bell className="h-16 w-16 text-muted-foreground/20 animate-pulse" />
                <div className="absolute top-0 right-0 h-4 w-4 bg-primary rounded-full border-2 border-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {filter === 'unread' ? 'Clean slate!' : 'No notifications yet'}
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                {filter === 'unread' 
                  ? "You've caught up with everything. Good job!" 
                  : "When people interact with your reviews or follow you, you'll see it here."}
              </p>
              {filter !== 'all' && (
                <Button variant="outline" onClick={() => setFilter('all')}>
                  Show all notifications
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
