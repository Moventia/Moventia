import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { BrowseMovies } from './components/BrowseMovies';
import { MovieDetail } from './components/MovieDetail';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { FeedPage } from './components/FeedPage';
import { NotificationsPage } from './components/NotificationsPage';
import { WriteReview } from './components/WriteReview';
import { FollowersPage } from './components/FollowersPage';
import { Chatbot } from './components/Chatbot';

const API_URL = 'http://localhost:8080/api';

// Simple protected route wrapper
function ProtectedRoute({ isLoggedIn, isAuthReady, children }) {
  const location = useLocation();
  if (!isAuthReady) {
    return null;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [navUser, setNavUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setNavUser(null);
    setUnreadNotifications(0);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ── Fetch user profile from API ──────────────────────────────────────
  const fetchNavUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNavUser(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch {
      // silent
    }
  };

  // ── Fetch notification count ─────────────────────────────────────────
  const fetchNotificationCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.filter(n => !n.read).length);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch {
      // silent
    }
  };

  // ── On mount, restore session ─────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchNavUser();
      fetchNotificationCount();
    }
    setIsAuthReady(true);
  }, []);

  // Poll notifications every 30s when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    fetchNavUser();
    fetchNotificationCount();
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <div className="app-atmosphere" aria-hidden="true" />
      <Navigation
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        notificationCount={unreadNotifications}
        user={navUser}
      />

      <main className="app-main">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path="/browse" element={<BrowseMovies />} />
          <Route path="/movie/:id" element={<MovieDetail isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <UserProfile onProfileUpdate={fetchNavUser} />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <UserProfile />
            </ProtectedRoute>
          } />

          <Route path="/profile/:userId/followers" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <FollowersPage tab="followers" />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId/following" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <FollowersPage tab="following" />
            </ProtectedRoute>
          } />

          <Route path="/feed" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <FeedPage />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          <Route path="/movie/:id/review" element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthReady={isAuthReady}>
              <WriteReview />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Chatbot overlay */}
      {isLoggedIn && <Chatbot />}
    </div>
  );
}
