'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import './navbar.css';

export default function Navbar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  
  // Format segments into clean breadcrumbs for all pages
  const rawSegments = pathname.split('/').filter(Boolean).filter(p => p !== 'dashboard');
  const segments = rawSegments.length > 0 ? rawSegments : ['Tasks'];

  return (
    <div className="top-navbar">
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar} 
        title="Toggle left sidebar"
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      {/* Subtle vertical divider | */}
      <div className="navbar-divider"></div>
      
      {/* Breadcrumb Navigation */}
      <div className="navbar-breadcrumb">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const formattedSegment = segment.length > 20 
            ? 'Details' 
            : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
          
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="breadcrumb-arrow">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              )}
              <span className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {formattedSegment}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
