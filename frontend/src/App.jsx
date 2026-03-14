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
import { mockNotifications } from './lib/mockData';

const API_URL = 'http://localhost:8080/api';

// Simple protected route wrapper
function ProtectedRoute({ isLoggedIn, children }) {
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navUser, setNavUser] = useState(null);
  // Just for global notification count badge
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

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
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    fetchNavUser();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setNavUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        notificationCount={unreadNotifications}
        user={navUser}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowseMovies />} />
        <Route path="/movie/:id" element={<MovieDetail isLoggedIn={isLoggedIn} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <UserProfile onProfileUpdate={fetchNavUser} />
          </ProtectedRoute>
        } />
        
        <Route path="/profile/:userId" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <UserProfile />
          </ProtectedRoute>
        } />

        <Route path="/profile/:userId/followers" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <FollowersPage tab="followers" />
          </ProtectedRoute>
        } />
        
        <Route path="/profile/:userId/following" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <FollowersPage tab="following" />
          </ProtectedRoute>
        } />

        <Route path="/feed" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <FeedPage />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <NotificationsPage />
          </ProtectedRoute>
        } />

        <Route path="/movie/:id/review" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <WriteReview />
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Chatbot overlay */}
      {isLoggedIn && <Chatbot />}
    </div>
  );
}
