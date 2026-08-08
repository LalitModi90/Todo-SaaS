'use client';

import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import Navbar from '@/components/layout/Navbar';
import './layout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />
        <main className="main-content" style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
