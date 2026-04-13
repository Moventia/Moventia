import { useState } from 'react';
import { Film, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppNavigate as useNavigate } from '../hooks/useAppNavigate';

const API_URL = 'http://localhost:8080/api/auth';

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
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
      navigate(from, { replace: true });
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
      navigate(from, { replace: true });
    } catch {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .cin-root {
          min-height: 100vh;
          background-color: #070a11;
          background-image:
            radial-gradient(circle at 15% 5%, rgba(79, 163, 216, 0.14) 0%, transparent 38%),
            radial-gradient(circle at 90% 0%, rgba(200, 168, 109, 0.16) 0%, transparent 30%),
            linear-gradient(180deg, #070a11 0%, #0a1220 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .cin-wrap {
          width: 100%;
          max-width: 420px;
        }

        /* ── Brand ── */
        .cin-brand {
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .cin-logo-ring {
          width: 52px;
          height: 52px;
          border: 1px solid rgba(200, 168, 109, 0.55);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          background: rgba(200, 168, 109, 0.1);
        }

        .cin-logo-ring svg {
          color: #c8a86d;
          width: 22px;
          height: 22px;
        }

        .cin-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #f5f7fc;
          text-transform: none;
          margin: 0;
          line-height: 1;
        }

        .cin-tagline {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          letter-spacing: 0.01em;
          text-transform: none;
          color: #b8c2d7;
          font-weight: 500;
        }

        /* ── Card ── */
        .cin-card {
          background: linear-gradient(155deg, rgba(14, 22, 36, 0.95), rgba(10, 16, 28, 0.9));
          border: 1px solid rgba(203, 213, 225, 0.16);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(4, 10, 20, 0.5);
          backdrop-filter: blur(10px);
        }

        /* ── Tabs ── */
        .cin-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid rgba(203, 213, 225, 0.12);
        }

        .cin-tab {
          padding: 1rem;
          background: none;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-transform: none;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          color: #8d98ae;
          position: relative;
        }

        .cin-tab.active {
          color: #f2f4f9;
          background: rgba(200, 168, 109, 0.1);
        }

        .cin-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #c8a86d;
        }

        .cin-tab:hover:not(.active) {
          color: #c4cbdb;
        }

        /* ── Form body ── */
        .cin-form-body {
          padding: 1.75rem;
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
          font-size: 0.8rem;
          letter-spacing: 0;
          text-transform: none;
          color: #c9d0df;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .cin-input-wrap {
          position: relative;
        }

        .cin-input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #62708a;
          width: 14px;
          height: 14px;
          pointer-events: none;
          transition: color 0.2s;
        }

        .cin-input {
          width: 100%;
          background: rgba(9, 16, 28, 0.85);
          border: 1px solid rgba(203, 213, 225, 0.16);
          border-radius: 10px;
          padding: 0.75rem 0.9rem 0.75rem 2.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #e6e8ee;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
          letter-spacing: 0.02em;
        }

        .cin-input::placeholder {
          color: #77849d;
          font-style: normal;
        }

        .cin-input:focus {
          border-color: rgba(200, 168, 109, 0.5);
          background: rgba(11, 19, 33, 0.95);
        }

        .cin-input:focus + .cin-focus-line,
        .cin-input-wrap:focus-within .cin-input-icon {
          color: rgba(200, 168, 109, 0.8);
        }

        .cin-eye-btn {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #7e8ca8;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .cin-eye-btn:hover { color: #c8a86d; }
        .cin-eye-btn svg { width: 14px; height: 14px; }

        /* ── Forgot ── */
        .cin-forgot {
          display: block;
          text-align: right;
          font-size: 0.78rem;
          letter-spacing: 0;
          color: #95a1b7;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 1.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          text-decoration: none;
          transition: color 0.2s;
        }
        .cin-forgot:hover { color: #c8a86d; }

        /* ── Submit ── */
        .cin-submit {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(120deg, #d6b476, #b88f4b);
          border: 1px solid rgba(218, 185, 119, 0.9);
          border-radius: 999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: none;
          color: #11131a;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          margin-top: 0.25rem;
        }

        .cin-submit:hover:not(:disabled) {
          background: linear-gradient(120deg, #e1c188, #c79a52);
          border-color: rgba(234, 203, 141, 1);
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
          background: rgba(203, 213, 225, 0.14);
        }

        .cin-divider-text {
          font-size: 0.72rem;
          letter-spacing: 0;
          text-transform: none;
          color: #8f9bb1;
        }

        /* ── Footer ── */
        .cin-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.76rem;
          letter-spacing: 0;
          color: #9aa6bc;
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
          background: rgba(203, 213, 225, 0.2);
          border-radius: 50%;
        }

        .cin-filmstrip-dot:nth-child(3) {
          background: rgba(200, 168, 109, 0.9);
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
            <p className="cin-footer" style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c49c55',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.72rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
              >
                ← Back to browsing
              </button>
            </p>

        </div>
      </div>
    </>
  );
}