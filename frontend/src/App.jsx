import { useState } from 'react';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [pageData, setPageData] = useState({});

  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const handleNavigate = (page, data) => {
    setCurrentPage(page);
    setPageData(data || {});
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('login');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        notificationCount={unreadNotifications}
      />

      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentPage === 'browse' && <BrowseMovies onNavigate={handleNavigate} />}
      {currentPage === 'movie' && pageData.id && (
        <MovieDetail movieId={pageData.id} onNavigate={handleNavigate} />
      )}
      {currentPage === 'profile' && <UserProfile onNavigate={handleNavigate} />}
      {currentPage === 'user-profile' && (
        <UserProfile userId={pageData.userId} onNavigate={handleNavigate} />
      )}
      {currentPage === 'feed' && <FeedPage onNavigate={handleNavigate} />}
      {currentPage === 'notifications' && (
        <NotificationsPage onNavigate={handleNavigate} />
      )}
      {currentPage === 'write-review' && (
        <WriteReview movieId={pageData.movieId} onNavigate={handleNavigate} />
      )}
      {(currentPage === 'followers' || currentPage === 'following') && (
        <FollowersPage userId={pageData.userId} onNavigate={handleNavigate} />
      )}

      <Chatbot />
    </div>
  );
}
