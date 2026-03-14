import { useState, useRef } from 'react';
import { X, User, FileText, Image as ImageIcon, Upload } from 'lucide-react';

const API_URL = 'http://localhost:8080/api';

export function EditProfileModal({ user, onClose, onSaved }) {
  const [fullName, setFullName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  
  // File upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatar || '');
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let finalAvatarUrl = avatarUrl;

      // 1. Upload avatar if a new file was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadRes = await fetch(`${API_URL}/profile/me/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Avatar upload failed');
        }
        const data = await uploadRes.json();
        finalAvatarUrl = `http://localhost:8080${data.avatarUrl}`; // Absolute URL for simplicity
      }

      // 2. Update profile data
      const res = await fetch(`${API_URL}/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, bio, avatarUrl: finalAvatarUrl }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Update failed');
      }
      const data = await res.json();
      
      // Cleanup ObjectURL to prevent memory leaks
      if (avatarFile) {
        URL.revokeObjectURL(previewUrl);
      }
      
      onSaved(data);
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .epm-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          animation: epm-fadeIn 0.2s ease;
        }

        @keyframes epm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes epm-slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .epm-card {
          background: #101010;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          width: 100%;
          max-width: 480px;
          margin: 1rem;
          overflow: hidden;
          animation: epm-slideUp 0.3s ease;
        }

        .epm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .epm-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 400;
          color: #e8e0d0;
          letter-spacing: 0.06em;
          margin: 0;
        }

        .epm-close {
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .epm-close:hover { color: #c49c55; }

        .epm-body {
          padding: 1.5rem;
        }

        .epm-field {
          margin-bottom: 1.25rem;
        }

        .epm-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4a4a4a;
          margin-bottom: 0.5rem;
          font-weight: 400;
        }

        .epm-label svg {
          width: 13px;
          height: 13px;
          color: #3a3a3a;
        }

        .epm-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          padding: 0.75rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 300;
          color: #c8c0b0;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          letter-spacing: 0.02em;
        }

        .epm-input:focus {
          border-color: rgba(196, 156, 85, 0.35);
        }

        .epm-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .epm-error {
          margin-bottom: 1rem;
          padding: 0.6rem 1rem;
          background: rgba(180, 40, 40, 0.08);
          border: 1px solid rgba(180, 40, 40, 0.2);
          border-left: 2px solid #b42828;
          font-size: 0.8rem;
          color: #c97070;
          border-radius: 2px;
        }

        .epm-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1rem 1.5rem;
          border-top: 1px solid #1a1a1a;
        }

        .epm-btn {
          padding: 0.65rem 1.5rem;
          border-radius: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }

        .epm-btn-cancel {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #666;
        }

        .epm-btn-cancel:hover {
          border-color: #444;
          color: #999;
        }

        .epm-btn-save {
          background: transparent;
          border: 1px solid rgba(196, 156, 85, 0.4);
          color: #c49c55;
        }

        .epm-btn-save:hover:not(:disabled) {
          background: rgba(196, 156, 85, 0.08);
          border-color: rgba(196, 156, 85, 0.7);
        }

        .epm-btn-save:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .epm-char-count {
          text-align: right;
          font-size: 0.68rem;
          color: #3a3a3a;
          margin-top: 0.25rem;
        }

        .epm-avatar-upload {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .epm-avatar-preview {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          object-fit: cover;
        }

        .epm-upload-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(196, 156, 85, 0.05);
          border: 1px solid rgba(196, 156, 85, 0.3);
          color: #c49c55;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .epm-upload-btn:hover {
          background: rgba(196, 156, 85, 0.1);
          border-color: rgba(196, 156, 85, 0.5);
        }
      `}</style>

      <div className="epm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="epm-card">
          <div className="epm-header">
            <h2 className="epm-title">Edit Profile</h2>
            <button className="epm-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="epm-body">
              {error && <div className="epm-error">{error}</div>}

              {/* Avatar Upload */}
              <div className="epm-field">
                <label className="epm-label"><ImageIcon /> Profile Picture</label>
                <div className="epm-avatar-upload">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="epm-avatar-preview" />
                  ) : (
                    <div className="epm-avatar-preview flex items-center justify-center text-[#555]">
                      <User size={24} />
                    </div>
                  )}
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <button 
                      type="button" 
                      className="epm-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      Choose Image
                    </button>
                  </div>
                </div>
              </div>

              <div className="epm-field">
                <label className="epm-label"><User /> Full Name</label>
                <input
                  className="epm-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="epm-field">
                <label className="epm-label"><FileText /> Bio</label>
                <textarea
                  className="epm-input epm-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <div className="epm-char-count">{bio.length}/500</div>
              </div>

            </div>

            <div className="epm-actions">
              <button type="button" className="epm-btn epm-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="epm-btn epm-btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
