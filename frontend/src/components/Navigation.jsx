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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

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

  // ── Debounced search ────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`${API_URL}/profile/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch {
        // silent fail
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ── Close dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (username) => {
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
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
          background: #0a0a0a;
          border: 1px solid #1e1e1e;
          border-radius: 6px;
          padding: 0 0.75rem;
          transition: border-color 0.2s;
          min-width: 220px;
        }

        .nav-search-input-wrap:focus-within {
          border-color: rgba(196, 156, 85, 0.35);
        }

        .nav-search-icon {
          color: #3a3a3a;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .nav-search-input {
          background: transparent;
          border: none;
          outline: none;
          padding: 0.5rem 0.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: #c8c0b0;
          width: 100%;
          letter-spacing: 0.02em;
        }

        .nav-search-input::placeholder {
          color: #333;
          font-style: italic;
        }

        .nav-search-clear {
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .nav-search-clear:hover { color: #c49c55; }

        .nav-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #101010;
          border: 1px solid #1e1e1e;
          border-radius: 6px;
          overflow: hidden;
          z-index: 60;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          max-height: 320px;
          overflow-y: auto;
          animation: nav-dd-in 0.15s ease;
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
          border-bottom: 1px solid #151515;
        }

        .nav-search-item:last-child {
          border-bottom: none;
        }

        .nav-search-item:hover {
          background: rgba(196, 156, 85, 0.06);
        }

        .nav-search-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          background: #1a1a1a;
          flex-shrink: 0;
        }

        .nav-search-avatar-fallback {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(196, 156, 85, 0.15);
          color: #c49c55;
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
          color: #e8e0d0;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-search-username {
          font-size: 0.72rem;
          color: #555;
          letter-spacing: 0.03em;
        }

        .nav-search-empty {
          padding: 1.5rem 1rem;
          text-align: center;
          color: #444;
          font-size: 0.8rem;
        }

        .nav-search-loading {
          padding: 1rem;
          text-align: center;
          color: #555;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
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
                <div className="nav-search-wrap" ref={searchRef}>
                  <div className="nav-search-input-wrap">
                    <Search className="nav-search-icon" />
                    <input
                      className="nav-search-input"
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                    />
                    {searchQuery && (
                      <button className="nav-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {showResults && (
                    <div className="nav-search-dropdown">
                      {searchLoading ? (
                        <div className="nav-search-loading">Searching…</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((u) => (
                          <div key={u.id} className="nav-search-item" onClick={() => handleResultClick(u.username)}>
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
                      ) : (
                        <div className="nav-search-empty">No users found</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isLoggedIn ? (
                <>
                  <Button
                    variant="ghost"
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
