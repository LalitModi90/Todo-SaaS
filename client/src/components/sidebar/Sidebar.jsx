'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { useRouter } from 'next/navigation';
import './sidebar.css';

const THEME_OPTIONS = [
  { 
    key: 'light', 
    label: 'Light', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    ) 
  },
  { 
    key: 'dark', 
    label: 'Dark', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    ) 
  },
  { 
    key: 'system', 
    label: 'System', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    ) 
  },
];

const COLOR_OPTIONS = [
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Blue', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Black', color: '#09090b' },
];

export default function Sidebar() {
  const router = useRouter();
  const { user, logoutUser, isGuestUser } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [profileOpen, setProfileOpen]             = useState(false);
  const [selectedTheme, setSelectedTheme]         = useState('light');
  const [selectedColor, setSelectedColor]         = useState(COLOR_OPTIONS[1]); // Default Blue
  const [showThemeSubmenu, setShowThemeSubmenu]   = useState(false);
  const [showColorSubmenu, setShowColorSubmenu]   = useState(false);
  const [workspaceOpen, setWorkspaceOpen]         = useState(true);
  const [toastBanner, setToastBanner]             = useState('');

  const dropdownRef = useRef(null);

  // Restore saved theme & color mode from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('themeMode');
      if (savedTheme) {
        setSelectedTheme(savedTheme);
        let activeTheme = savedTheme;
        if (savedTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          activeTheme = prefersDark ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);
      }

      const savedColor = localStorage.getItem('colorMode');
      if (savedColor) {
        const parsed = JSON.parse(savedColor);
        if (parsed && parsed.name && parsed.color) {
          setSelectedColor(parsed);
          document.documentElement.style.setProperty('--primary-color', parsed.color);
        }
      }
    } catch (e) {}
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
        setShowThemeSubmenu(false);
        setShowColorSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerSidebarToast = (msg) => {
    setToastBanner(msg);
    setTimeout(() => setToastBanner(''), 3000);
  };

  const toggleProfile = () => {
    if (isCollapsed) {
      toggleSidebar();
      return;
    }
    setProfileOpen(!profileOpen);
    setShowThemeSubmenu(false);
    setShowColorSubmenu(false);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleSidebar();
    setProfileOpen(false);
  };

  const handleSelectTheme = (themeKey) => {
    setSelectedTheme(themeKey);
    setShowThemeSubmenu(false);

    let activeTheme = themeKey;
    if (themeKey === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('themeMode', themeKey);
    triggerSidebarToast(`Theme set to ${themeKey.toUpperCase()} mode`);
  };

  const handleSelectColorMode = (colorObj) => {
    setSelectedColor(colorObj);
    setShowColorSubmenu(false);
    document.documentElement.style.setProperty('--primary-color', colorObj.color);
    localStorage.setItem('colorMode', JSON.stringify(colorObj));
    triggerSidebarToast(`Color Mode updated to ${colorObj.name}`);
  };

  const displayName = isGuestUser ? "Guest User" : (user?.name || 'User');
  const displayEmail = isGuestUser ? "guest@example.com" : (user?.email || 'user@example.com');
  const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      
      {/* Toast Feedback Banner */}
      {toastBanner && (
        <div className="sidebar-toast-notification">
          {toastBanner}
        </div>
      )}

      <div className="user-profile-wrapper" ref={dropdownRef}>
        <div className="user-profile" onClick={toggleProfile} title={isCollapsed ? displayName : undefined}>
          <div className="user-info">
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="user-avatar"
            />
            {!isCollapsed && <span className="user-name">{displayName}</span>}
          </div>
          <button 
            className="sidebar-toggle-btn"
            onClick={handleToggle}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`chevron-icon ${isCollapsed ? 'collapsed-chevron' : ''}`}
            >
              <path d={isCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
            </svg>
          </button>
        </div>

        {/* ── Profile Dropdown Card (Matches Reference Screenshot) ── */}
        {profileOpen && !isCollapsed && (
          <div className="profile-dropdown-card">
            
            {/* Header: Avatar, Name & Email */}
            <div className="profile-card-header">
              <img src={avatarUrl} alt={displayName} className="profile-card-large-avatar" />
              <div className="profile-card-user-details">
                <span className="profile-card-name">{displayName}</span>
                <span className="profile-card-email">{displayEmail}</span>
              </div>
            </div>

            {/* Menu Options */}
            <div className="profile-card-menu">
              
              {/* 1. Change Theme with Flyout Submenu */}
              <div 
                className="profile-menu-row flyout-parent-row"
                onMouseEnter={() => { setShowThemeSubmenu(true); setShowColorSubmenu(false); }}
                onClick={() => setShowThemeSubmenu(!showThemeSubmenu)}
              >
                <div className="menu-row-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  <span>Change Theme</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>

                {/* Theme Flyout Submenu */}
                {showThemeSubmenu && (
                  <div className="flyout-submenu-box theme-position" onClick={(e) => e.stopPropagation()}>
                    <div className="flyout-menu-header">Theme</div>
                    {THEME_OPTIONS.map(t => (
                      <div 
                        key={t.key}
                        className={`flyout-menu-item ${selectedTheme === t.key ? 'active-color' : ''}`}
                        onClick={() => handleSelectTheme(t.key)}
                      >
                        <div className="flyout-item-left">
                          <span style={{ display: 'flex', alignItems: 'center' }}>{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                        {selectedTheme === t.key && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Color Mode with Flyout Submenu */}
              <div 
                className="profile-menu-row flyout-parent-row"
                onMouseEnter={() => { setShowColorSubmenu(true); setShowThemeSubmenu(false); }}
                onClick={() => setShowColorSubmenu(!showColorSubmenu)}
              >
                <div className="menu-row-left">
                  <span className="color-swatch-box" style={{ background: selectedColor.color }} />
                  <span>Color Mode</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>

                {/* Color Mode Flyout Submenu */}
                {showColorSubmenu && (
                  <div className="flyout-submenu-box color-position" onClick={(e) => e.stopPropagation()}>
                    <div className="flyout-menu-header">Color Mode</div>
                    {COLOR_OPTIONS.map(c => (
                      <div 
                        key={c.name}
                        className={`flyout-menu-item ${selectedColor.name === c.name ? 'active-color' : ''}`}
                        onClick={() => handleSelectColorMode(c)}
                      >
                        <div className="flyout-item-left">
                          <span className="color-swatch-box" style={{ background: c.color }} />
                          <span>{c.name}</span>
                        </div>
                        {selectedColor.name === c.name && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Settings */}
              <div 
                className="profile-menu-row" 
                onClick={() => { setProfileOpen(false); router.push('/settings/profile'); }}
              >
                <div className="menu-row-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  <span>Settings</span>
                </div>
              </div>

              {/* 4. Logout */}
              <div 
                className="profile-menu-row logout-row" 
                onClick={() => { setProfileOpen(false); logoutUser(); }}
              >
                <div className="menu-row-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Logout</span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      <div className="sidebar-section">
        {!isCollapsed && (
          <div 
            className="section-header" 
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="section-title">Workspace</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="chevron-icon"
              style={{ transition: 'transform 0.2s ease', transform: workspaceOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        )}
        
        {workspaceOpen && (
          <nav className="nav-menu">
            <a href="/dashboard/tasks" className="nav-item active" title="Tasks">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {!isCollapsed && <span className="nav-label">Tasks</span>}
            </a>
            
            <a href="/dashboard/projects" className="nav-item" title="Projects">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {!isCollapsed && <span className="nav-label">Projects</span>}
            </a>
          </nav>
        )}
      </div>
    </aside>
  );
}
