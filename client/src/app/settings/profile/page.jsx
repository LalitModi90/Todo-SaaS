'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar, updateUser } from '@/api/userApi';

export default function ProfileSettingsPage() {
  const { user, setUser, checkGuestAction } = useAuth();
  const [name, setName] = useState(user?.name || 'User');
  const [title, setTitle] = useState(user?.title || 'Designer');
  const [username, setUsername] = useState(user?.username || 'User');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = React.useRef(null);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    if (checkGuestAction("update profile picture")) return;

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage('Uploading profile picture...');
      const res = await uploadAvatar(file);
      setUser(res.user);
      setMessage('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setMessage('Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (checkGuestAction("update profile")) return;
    try {
      setMessage('Saving profile...');
      const updated = await updateUser(user?._id || user?.id, { name, title, username });
      setUser(updated);
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('Failed to update profile.');
    }
  };

  const handleLeaveWorkspace = () => {
    if (window.confirm('Are you sure you want to leave this workspace?')) {
      alert('You have requested to leave the workspace.');
    }
  };

  const displayName = user?.name || 'User';
  const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
  const userEmail = user?.email || 'dexter@gmail.com';

  return (
    <div className="settings-content">
      <h1 className="settings-title">Profile</h1>

      {message && (
        <div className="settings-message-toast">
          {message}
        </div>
      )}

      {/* Main Profile Info Card */}
      <form onSubmit={handleSaveProfile}>
        <div className="settings-card">
          
          {/* Row 1: Profile Picture */}
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">Profile picture</span>
            </div>
            <div className="settings-value">
              <div 
                className="profile-avatar-wrapper" 
                onClick={handleAvatarClick}
                title="Click to change profile picture"
              >
                <img src={avatarUrl} alt="Profile" className="profile-avatar-img" />
                {uploading && <div className="avatar-uploading-overlay">...</div>}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Row 2: Email */}
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">Email</span>
            </div>
            <div className="settings-value email-value-group">
              <span className="email-text">{userEmail}</span>
              <button type="button" className="icon-btn-ghost-edit" title="Edit email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            </div>
          </div>

          {/* Row 3: Full Name */}
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">Full name</span>
            </div>
            <div className="settings-value">
              <input 
                type="text" 
                className="settings-pill-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
          </div>

          {/* Row 4: Title */}
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">Title</span>
              <span className="settings-description">Your job title or role</span>
            </div>
            <div className="settings-value">
              <input 
                type="text" 
                className="settings-pill-input" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Designer"
              />
            </div>
          </div>

          {/* Row 5: Username */}
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">Username</span>
              <span className="settings-description">One word, like a nickname or first name</span>
            </div>
            <div className="settings-value">
              <input 
                type="text" 
                className="settings-pill-input" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Dexuser"
              />
            </div>
          </div>

        </div>
      </form>

      {/* Section 2: Workspace Access */}
      <div className="settings-section">
        <h2 className="section-title">Workspace access</h2>
        <div className="settings-card">
          <div className="settings-row" style={{ borderBottom: 'none' }}>
            <div className="settings-row-info">
              <span className="settings-description-gray">Remove yourself from the workspace</span>
            </div>
            <div className="settings-value">
              <button 
                type="button" 
                className="leave-workspace-btn"
                onClick={handleLeaveWorkspace}
              >
                Leave Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
