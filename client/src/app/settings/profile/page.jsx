'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar, updateUser, deleteUser } from '@/api/userApi';

export default function ProfileSettingsPage() {
  const { user, setUser, checkGuestAction, logoutUser, isGuestUser } = useAuth();
  const [name, setName] = useState(user?.name || 'User');
  const [title, setTitle] = useState(user?.title || 'Designer');
  const [username, setUsername] = useState(user?.username || 'User');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Modal states for leave workspace & delete account
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setMessage('');
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setMessage('');
      if (!isGuestUser && typeof window !== 'undefined' && localStorage.getItem('token')) {
        try {
          await deleteUser('me');
        } catch (apiErr) {
          console.warn('Backend deletion call status:', apiErr);
        }
      }
    } catch (err) {
      console.error('Error during account deletion flow:', err);
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
      logoutUser();
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

      {/* 1. Confirmation Modal Popup */}
      {showConfirmModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-modal-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="delete-modal-title">Delete Account & Leave Workspace?</h3>
            <p className="delete-modal-description">
              Are you sure you want to delete your account? All your projects, tasks, comments, and workspace data will be permanently deleted from the database.
            </p>
            <div className="delete-modal-actions">
              <button 
                type="button" 
                className="delete-modal-cancel-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-modal-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting Data...' : 'Yes, Delete Account & Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Success Notification Modal Popup */}
      {showSuccessModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-modal-icon-wrapper success-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 className="delete-modal-title">Account & Data Deleted</h3>
            <p className="delete-modal-description">
              Your user account and all associated workspace data have been permanently deleted from the database.
            </p>
            <div className="delete-modal-actions">
              <button 
                type="button" 
                className="delete-modal-success-btn"
                onClick={() => logoutUser()}
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
