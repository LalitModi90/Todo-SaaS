'use client';

import React, { useState, useEffect } from 'react';

const COLOR_OPTIONS = [
  { name: 'Amber', color: '#f59e0b', desc: 'Warm amber glow accent' },
  { name: 'Blue', color: '#3b82f6', desc: 'Classic indigo blue accent' },
  { name: 'Pink', color: '#ec4899', desc: 'Vibrant pink magenta accent' },
  { name: 'Rose', color: '#f43f5e', desc: 'Modern rose red accent' },
  { name: 'Emerald', color: '#10b981', desc: 'Fresh emerald green accent' },
  { name: 'Black', color: '#18181b', desc: 'Sleek monochrome dark accent' }
];

export default function ColorSettingsPage() {
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[1]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('colorMode');
      if (savedColor) {
        try {
          const parsed = JSON.parse(savedColor);
          const matched = COLOR_OPTIONS.find(c => c.name === parsed.name) || parsed;
          setSelectedColor(matched);
        } catch (e) {}
      }
    }
  }, []);

  const handleSelectColor = (colorObj) => {
    setSelectedColor(colorObj);
    document.documentElement.style.setProperty('--primary-color', colorObj.color);
    localStorage.setItem('colorMode', JSON.stringify(colorObj));

    setMessage(`Color mode updated to ${colorObj.name}`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="settings-content">
      <h1 className="settings-title">Color Mode</h1>

      {message && (
        <div className="settings-message-toast">
          {message}
        </div>
      )}

      {/* Main Accent Color Selection Card */}
      <div className="settings-card">
        <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: '16px' }}>
          <div className="settings-row-info">
            <span className="settings-label">Primary Accent Color</span>
            <span className="settings-description">Customize the primary brand highlight color for buttons and badges</span>
          </div>
          <div className="settings-value">
            <span className="current-color-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <span className="swatch-square" style={{ background: selectedColor.color }} />
              {selectedColor.name}
            </span>
          </div>
        </div>

        {/* Color Swatch Options Grid */}
        <div className="color-options-grid">
          {COLOR_OPTIONS.map(c => {
            const isSelected = selectedColor.name === c.name;
            return (
              <div
                key={c.name}
                className={`color-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectColor(c)}
              >
                <div className="color-card-header">
                  <div className="color-swatch-info">
                    <span className="color-swatch-box" style={{ background: c.color }} />
                    <span className="color-name-text">{c.name}</span>
                  </div>
                  {isSelected && (
                    <span className="color-card-checkmark" style={{ color: c.color }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  )}
                </div>
                <div className="color-card-desc">{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
