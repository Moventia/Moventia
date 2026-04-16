import { useState, useEffect, useRef } from 'react';
import { Bell, Home, Film, User, LogOut, Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const API_URL = 'http://localhost:8080/api';

export function Navigation({ isLoggedIn, onLogout, notificationCount = 0, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [showMovieResults, setShowMovieResults] = useState(false);
  const [movieSearchLoading, setMovieSearchLoading] = useState(false);
  const movieSearchRef = useRef(null);
  const movieDebounceRef = useRef(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchRef = useRef(null);
  const userDebounceRef = useRef(null);

  // Public nav items — visible to everyone
  const publicNavItems = [
    { id: '/', label: 'Home', icon: Home },
    { id: '/browse', label: 'Browse', icon: Film },
  ];

  // Private nav items — visible only when logged in
  const privateNavItems = [
    { id: '/feed', label: 'Feed', icon: Search },
  ];

  const navItems = isLoggedIn ? [...publicNavItems, ...privateNavItems] : publicNavItems;

  // ── Debounced movie search ──────────────────────────────────────────
  useEffect(() => {
    if (!movieSearchQuery.trim()) {
      setMovieResults([]);
      setShowMovieResults(false);
      return;
    }

    if (movieDebounceRef.current) clearTimeout(movieDebounceRef.current);

    movieDebounceRef.current = setTimeout(async () => {
      setMovieSearchLoading(true);
      try {
        const res = await fetch(`${API_URL}/movies?q=${encodeURIComponent(movieSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setMovieResults(data.movies || []);
          setShowMovieResults(true);
        }
      } catch {
        // silent fail
      } finally {
        setMovieSearchLoading(false);
      }
    }, 300);

    return () => {
      if (movieDebounceRef.current) clearTimeout(movieDebounceRef.current);
    };
  }, [movieSearchQuery]);

  // ── Debounced user search (People popover) ─────────────────────────
  useEffect(() => {
    if (!userSearchOpen || !userSearchQuery.trim()) {
      setUserResults([]);
      return;
    }

    if (userDebounceRef.current) clearTimeout(userDebounceRef.current);

    userDebounceRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const res = await fetch(`${API_URL}/profile/search?q=${encodeURIComponent(userSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setUserResults(data || []);
        }
      } catch {
        // silent fail
      } finally {
        setUserSearchLoading(false);
      }
    }, 250);

    return () => {
      if (userDebounceRef.current) clearTimeout(userDebounceRef.current);
    };
  }, [userSearchOpen, userSearchQuery]);

  // ── Close dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (movieSearchRef.current && !movieSearchRef.current.contains(e.target)) {
        setShowMovieResults(false);
      }
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) {
        setUserSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMovieResultClick = (movieId) => {
    setMovieSearchQuery('');
    setShowMovieResults(false);
    setMovieResults([]);
    navigate(`/movie/${movieId}`);
  };

  const submitMovieSearch = () => {
    const query = movieSearchQuery.trim();
    if (!query) return;

    if (movieResults.length > 0) {
      handleMovieResultClick(movieResults[0].id);
      return;
    }

    setShowMovieResults(false);
    navigate(`/browse?q=${encodeURIComponent(query)}`);
  };

  const handleUserResultClick = (username) => {
    setUserSearchQuery('');
    setUserSearchOpen(false);
    setUserResults([]);
    navigate(`/profile/${username}`);
  };

  return (
    <>
      <style>{`
        .nav-search-wrap {
          position: relative;
          margin: 0 0.5rem;
        }

        .nav-search-input-wrap {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, rgba(8, 15, 26, 0.88), rgba(12, 22, 36, 0.76));
          border: 1px solid rgba(203, 213, 225, 0.22);
          border-radius: 999px;
          padding: 0 0.75rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          min-width: 300px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 20px rgba(2, 8, 20, 0.35);
          backdrop-filter: blur(8px);
        }

        .nav-search-input-wrap:focus-within {
          border-color: rgba(200, 168, 109, 0.52);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 3px rgba(200, 168, 109, 0.15), 0 12px 24px rgba(2, 8, 20, 0.4);
          background: linear-gradient(135deg, rgba(9, 16, 28, 0.94), rgba(14, 24, 40, 0.82));
        }

        .nav-search-icon {
          color: #9ca7bc;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .nav-search-input {
          background: transparent;
          border: none;
          outline: none;
          padding: 0.56rem 0.55rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.82rem;
          color: #dce1ea;
          width: 100%;
          letter-spacing: 0.01em;
        }

        .nav-search-input::placeholder {
          color: #8390a8;
          font-style: normal;
        }

        .nav-search-clear {
          background: none;
          border: none;
          color: #8f9cb4;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .nav-search-clear:hover { color: #c8a86d; }

        .nav-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: linear-gradient(160deg, rgba(10, 17, 29, 0.97), rgba(11, 20, 34, 0.94));
          border: 1px solid rgba(203, 213, 225, 0.18);
          border-radius: 12px;
          overflow: hidden;
          z-index: 60;
          box-shadow: 0 20px 40px rgba(2, 8, 20, 0.52);
          max-height: 320px;
          overflow-y: auto;
          animation: nav-dd-in 0.15s ease;
          backdrop-filter: blur(10px);
        }

        @keyframes nav-dd-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-search-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(203, 213, 225, 0.08);
        }

        .nav-search-item:last-child {
          border-bottom: none;
        }

        .nav-search-item:hover {
          background: linear-gradient(90deg, rgba(200, 168, 109, 0.1), rgba(79, 163, 216, 0.08));
        }

        .nav-search-poster {
          width: 34px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
          background: rgba(14, 24, 40, 0.9);
          border: 1px solid rgba(203, 213, 225, 0.12);
          flex-shrink: 0;
        }

        .nav-search-movie-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .nav-search-movie-title {
          font-size: 0.85rem;
          color: #e6ebf5;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-search-movie-meta {
          font-size: 0.72rem;
          color: #94a0b6;
          letter-spacing: 0.02em;
        }

        .nav-search-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          background: rgba(14, 24, 40, 0.9);
          border: 1px solid rgba(203, 213, 225, 0.14);
          flex-shrink: 0;
        }

        .nav-search-avatar-fallback {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(200, 168, 109, 0.16);
          color: #d4b57a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        .nav-search-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .nav-search-name {
          font-size: 0.85rem;
          color: #e6ebf5;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-search-username {
          font-size: 0.72rem;
          color: #94a0b6;
          letter-spacing: 0.03em;
        }

        .nav-search-empty {
          padding: 1.5rem 1rem;
          text-align: center;
          color: #8f9cb4;
          font-size: 0.8rem;
        }

        .nav-search-loading {
          padding: 1rem;
          text-align: center;
          color: #9ca7bc;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
        }

        .nav-people-wrap {
          position: relative;
        }

        .nav-people-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          border: 1px solid rgba(203, 213, 225, 0.2);
          background: linear-gradient(135deg, rgba(8, 15, 26, 0.88), rgba(12, 22, 36, 0.76));
          color: #dce1ea;
          border-radius: 999px;
          padding: 0.45rem 0.7rem;
          font-size: 0.73rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .nav-people-btn:hover {
          border-color: rgba(200, 168, 109, 0.52);
          box-shadow: 0 0 0 3px rgba(200, 168, 109, 0.12);
        }

        .nav-people-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          background: linear-gradient(160deg, rgba(10, 17, 29, 0.97), rgba(11, 20, 34, 0.94));
          border: 1px solid rgba(203, 213, 225, 0.18);
          border-radius: 12px;
          overflow: hidden;
          z-index: 60;
          box-shadow: 0 20px 40px rgba(2, 8, 20, 0.52);
          backdrop-filter: blur(10px);
          animation: nav-dd-in 0.15s ease;
        }

        .nav-people-head {
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid rgba(203, 213, 225, 0.1);
        }

        .nav-people-results {
          max-height: 280px;
          overflow-y: auto;
        }

        @media (max-width: 1024px) {
          .nav-search-input-wrap {
            min-width: 240px;
          }

          .nav-people-btn .label {
            display: none;
          }

          .nav-people-panel {
            width: 260px;
          }
        }
      `}</style>

      <nav className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0c0c0c]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0c0c0c]/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <Film className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.1em' }}>Moventia</span>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={location.pathname === item.id ? 'default' : 'ghost'}
                    onClick={() => navigate(item.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            {/* Right Side: Search + Actions */}
            <div className="flex items-center gap-2">
              {/* Search Bar (visible when logged in) */}
              {isLoggedIn && (
                <div className="nav-search-wrap" ref={movieSearchRef}>
                  <div className="nav-search-input-wrap">
                    <Search className="nav-search-icon" />
                    <input
                      className="nav-search-input"
                      type="text"
                      placeholder="Search movies..."
                      value={movieSearchQuery}
                      onChange={(e) => setMovieSearchQuery(e.target.value)}
                      onFocus={() => { if (movieResults.length > 0) setShowMovieResults(true); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitMovieSearch();
                        }
                      }}
                    />
                    {movieSearchQuery && (
                      <button className="nav-search-clear" onClick={() => { setMovieSearchQuery(''); setMovieResults([]); setShowMovieResults(false); }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {showMovieResults && (
                    <div className="nav-search-dropdown">
                      {movieSearchLoading ? (
                        <div className="nav-search-loading">Searching movies...</div>
                      ) : movieResults.length > 0 ? (
                        movieResults.slice(0, 8).map((movie) => (
                          <div key={movie.id} className="nav-search-item" onClick={() => handleMovieResultClick(movie.id)}>
                            <img className="nav-search-poster" src={movie.poster} alt={movie.title} />
                            <div className="nav-search-movie-info">
                              <span className="nav-search-movie-title">{movie.title}</span>
                              <span className="nav-search-movie-meta">
                                {movie.year}{movie.rating ? ` • ★ ${movie.rating}` : ''}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="nav-search-empty">No movies found</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isLoggedIn && (
                <div className="nav-people-wrap" ref={userSearchRef}>
                  <button
                    className="nav-people-btn"
                    onClick={() => setUserSearchOpen((v) => !v)}
                    aria-label="Search users"
                  >
                    <User className="h-4 w-4" />
                    <span className="label">People</span>
                  </button>

                  {userSearchOpen && (
                    <div className="nav-people-panel">
                      <div className="nav-people-head">
                        <div className="nav-search-input-wrap" style={{ minWidth: 'auto' }}>
                          <Search className="nav-search-icon" />
                          <input
                            className="nav-search-input"
                            type="text"
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            autoFocus
                          />
                          {userSearchQuery && (
                            <button className="nav-search-clear" onClick={() => { setUserSearchQuery(''); setUserResults([]); }}>
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="nav-people-results">
                        {userSearchLoading ? (
                          <div className="nav-search-loading">Searching users...</div>
                        ) : userSearchQuery.trim() && userResults.length > 0 ? (
                          userResults.map((u) => (
                            <div key={u.id} className="nav-search-item" onClick={() => handleUserResultClick(u.username)}>
                              {u.avatarUrl ? (
                                <img className="nav-search-avatar" src={u.avatarUrl} alt={u.fullName} />
                              ) : (
                                <div className="nav-search-avatar-fallback">{u.fullName?.[0] || '?'}</div>
                              )}
                              <div className="nav-search-info">
                                <span className="nav-search-name">{u.fullName}</span>
                                <span className="nav-search-username">@{u.username}</span>
                              </div>
                            </div>
                          ))
                        ) : userSearchQuery.trim() ? (
                          <div className="nav-search-empty">No users found</div>
                        ) : (
                          <div className="nav-search-empty">Type a name to find people</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLoggedIn ? (
                <>
                  <Button
                    variant={location.pathname === '/notifications' ? 'default' : 'ghost'}
                    size="icon"
                    className="relative"
                    onClick={() => navigate('/notifications')}
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/profile')}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || user?.avatar} alt={user?.fullName || user?.name || 'User'} />
                      <AvatarFallback>{(user?.fullName || user?.name || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium text-foreground">{user?.username || 'User'}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-transparent border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70 text-xs tracking-widest uppercase"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
