'use client';

import React, { useState, useEffect } from 'react';

export default function ThemeSettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('themeMode') || 'system';
      setSelectedTheme(savedTheme);
    }
  }, []);

  const handleSelectTheme = (themeKey) => {
    setSelectedTheme(themeKey);
    let activeTheme = themeKey;

    if (themeKey === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('themeMode', themeKey);
    
    const labelMap = { light: 'Light', dark: 'Dark', system: 'System Default' };
    setMessage(`Theme updated to ${labelMap[themeKey]}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const themes = [
    {
      id: 'light',
      name: 'Light',
      desc: 'Clean, high-visibility light interface',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      )
    },
    {
      id: 'dark',
      name: 'Dark',
      desc: 'Sleek, low-glare dark interface for night work',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )
    },
    {
      id: 'system',
      name: 'System Default',
      desc: 'Automatically syncs with your operating system theme',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    }
  ];

  return (
    <div className="settings-content">
      <h1 className="settings-title">Theme</h1>

      {message && (
        <div className="settings-message-toast">
          {message}
        </div>
      )}

      {/* Main Appearance Selector Card */}
      <div className="settings-card">
        <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: '16px' }}>
          <div className="settings-row-info">
            <span className="settings-label">Appearance</span>
            <span className="settings-description">Customize how Pyramid looks on your device</span>
          </div>
          <div className="settings-value">
            <select
              value={selectedTheme}
              onChange={(e) => handleSelectTheme(e.target.value)}
              className="settings-theme-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </div>

        {/* Visual Cards Selection Grid */}
        <div className="theme-options-grid">
          {themes.map(t => {
            const isSelected = selectedTheme === t.id;
            return (
              <div
                key={t.id}
                className={`theme-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectTheme(t.id)}
              >
                <div className="theme-card-header">
                  <div className="theme-card-icon-title">
                    {t.icon}
                    <span className="theme-card-title">{t.name}</span>
                  </div>
                  {isSelected && (
                    <span className="theme-card-checkmark">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  )}
                </div>
                <div className="theme-card-desc">{t.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
