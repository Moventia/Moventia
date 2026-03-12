import { useState } from 'react';
import { Film, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const API_URL = 'http://localhost:8080/api/auth';

export function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || data.message || 'Login failed'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ email: data.email, username: data.username, fullName: data.fullName }));
      onLogin(data);
    } catch {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: signupData.name, username: signupData.username, email: signupData.email, password: signupData.password })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || data.message || 'Signup failed'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ email: data.email, username: data.username, fullName: data.fullName }));
      onLogin(data);
    } catch {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .cin-root {
          min-height: 100vh;
          background-color: #080808;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180, 130, 60, 0.12) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          font-family: 'DM Sans', sans-serif;
        }

        .cin-wrap {
          width: 100%;
          max-width: 420px;
        }

        /* ── Brand ── */
        .cin-brand {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .cin-logo-ring {
          width: 52px;
          height: 52px;
          border: 1px solid rgba(196, 156, 85, 0.4);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          background: rgba(196, 156, 85, 0.06);
        }

        .cin-logo-ring svg {
          color: #c49c55;
          width: 22px;
          height: 22px;
        }

        .cin-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.4rem;
          font-weight: 300;
          letter-spacing: 0.18em;
          color: #e8e0d0;
          text-transform: uppercase;
          margin: 0;
          line-height: 1;
        }

        .cin-tagline {
          margin-top: 0.5rem;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #5a5a5a;
          font-weight: 300;
        }

        /* ── Card ── */
        .cin-card {
          background: #101010;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          overflow: hidden;
        }

        /* ── Tabs ── */
        .cin-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #1a1a1a;
        }

        .cin-tab {
          padding: 1rem;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          color: #3d3d3d;
          position: relative;
        }

        .cin-tab.active {
          color: #c49c55;
          background: rgba(196, 156, 85, 0.04);
        }

        .cin-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #c49c55;
        }

        .cin-tab:hover:not(.active) {
          color: #666;
        }

        /* ── Form body ── */
        .cin-form-body {
          padding: 2rem;
        }

        /* ── Error ── */
        .cin-error {
          margin-bottom: 1.5rem;
          padding: 0.75rem 1rem;
          background: rgba(180, 40, 40, 0.08);
          border: 1px solid rgba(180, 40, 40, 0.2);
          border-left: 2px solid #b42828;
          font-size: 0.8rem;
          color: #c97070;
          letter-spacing: 0.02em;
          line-height: 1.5;
        }

        /* ── Field ── */
        .cin-field {
          margin-bottom: 1.25rem;
        }

        .cin-label {
          display: block;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #4a4a4a;
          margin-bottom: 0.5rem;
          font-weight: 400;
        }

        .cin-input-wrap {
          position: relative;
        }

        .cin-input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #2e2e2e;
          width: 14px;
          height: 14px;
          pointer-events: none;
          transition: color 0.2s;
        }

        .cin-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #1e1e1e;
          border-radius: 2px;
          padding: 0.75rem 0.9rem 0.75rem 2.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 300;
          color: #c8c0b0;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
          letter-spacing: 0.02em;
        }

        .cin-input::placeholder {
          color: #2a2a2a;
          font-style: italic;
        }

        .cin-input:focus {
          border-color: rgba(196, 156, 85, 0.35);
          background: #0c0c0c;
        }

        .cin-input:focus + .cin-focus-line,
        .cin-input-wrap:focus-within .cin-input-icon {
          color: rgba(196, 156, 85, 0.5);
        }

        .cin-eye-btn {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #2e2e2e;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .cin-eye-btn:hover { color: #5a5a5a; }
        .cin-eye-btn svg { width: 14px; height: 14px; }

        /* ── Forgot ── */
        .cin-forgot {
          display: block;
          text-align: right;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: #3a3a3a;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: color 0.2s;
        }
        .cin-forgot:hover { color: #c49c55; }

        /* ── Submit ── */
        .cin-submit {
          width: 100%;
          padding: 0.85rem;
          background: transparent;
          border: 1px solid rgba(196, 156, 85, 0.4);
          border-radius: 2px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c49c55;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          margin-top: 0.25rem;
        }

        .cin-submit:hover:not(:disabled) {
          background: rgba(196, 156, 85, 0.08);
          border-color: rgba(196, 156, 85, 0.7);
        }

        .cin-submit:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ── Divider ── */
        .cin-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .cin-divider-line {
          flex: 1;
          height: 1px;
          background: #181818;
        }

        .cin-divider-text {
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #2a2a2a;
        }

        /* ── Footer ── */
        .cin-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          color: #282828;
          line-height: 1.6;
        }

        /* ── Film strip decoration ── */
        .cin-filmstrip {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-bottom: 1.5rem;
        }

        .cin-filmstrip-dot {
          width: 3px;
          height: 3px;
          background: #1e1e1e;
          border-radius: 50%;
        }

        .cin-filmstrip-dot:nth-child(3) {
          background: rgba(196, 156, 85, 0.4);
        }
      `}</style>

      <div className="cin-root">
        <div className="cin-wrap">

          {/* Brand */}
          <div className="cin-brand">
            <div className="cin-logo-ring">
              <Film />
            </div>
            <h1 className="cin-title">moventia</h1>
            <p className="cin-tagline">Your personal film journal</p>
          </div>

          {/* Card */}
          <div className="cin-card">

            {/* Tabs */}
            <div className="cin-tabs">
              <button
                className={`cin-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`cin-tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => { setActiveTab('signup'); setError(''); }}
              >
                Register
              </button>
            </div>

            {/* Form body */}
            <div className="cin-form-body">

              {error && <div className="cin-error">{error}</div>}

              {/* ── LOGIN ── */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="cin-field">
                    <label className="cin-label">Email</label>
                    <div className="cin-input-wrap">
                      <Mail className="cin-input-icon" />
                      <input
                        className="cin-input"
                        type="email"
                        placeholder="your@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="cin-field">
                    <label className="cin-label">Password</label>
                    <div className="cin-input-wrap">
                      <Lock className="cin-input-icon" />
                      <input
                        className="cin-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        style={{ paddingRight: '2.5rem' }}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <button type="button" className="cin-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <button type="button" className="cin-forgot">Forgot password?</button>

                  <button type="submit" className="cin-submit" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Enter'}
                  </button>
                </form>
              )}

              {/* ── SIGNUP ── */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignup}>
                  <div className="cin-field">
                    <label className="cin-label">Full Name</label>
                    <div className="cin-input-wrap">
                      <User className="cin-input-icon" />
                      <input
                        className="cin-input"
                        type="text"
                        placeholder="John Doe"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="cin-field">
                    <label className="cin-label">Username</label>
                    <div className="cin-input-wrap">
                      <User className="cin-input-icon" />
                      <input
                        className="cin-input"
                        type="text"
                        placeholder="johndoe"
                        value={signupData.username}
                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="cin-field">
                    <label className="cin-label">Email</label>
                    <div className="cin-input-wrap">
                      <Mail className="cin-input-icon" />
                      <input
                        className="cin-input"
                        type="email"
                        placeholder="your@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="cin-field" style={{ marginBottom: '1.5rem' }}>
                    <label className="cin-label">Password</label>
                    <div className="cin-input-wrap">
                      <Lock className="cin-input-icon" />
                      <input
                        className="cin-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        style={{ paddingRight: '2.5rem' }}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                      <button type="button" className="cin-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="cin-submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}

            </div>
          </div>

          {/* Footer */}
          <p className="cin-footer">
            By continuing you agree to our Terms of Service<br />and Privacy Policy
          </p>

        </div>
      </div>
    </>
  );
}