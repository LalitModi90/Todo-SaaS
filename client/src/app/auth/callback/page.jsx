'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMe } from '@/api/authApi';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      router.push('/login?error=' + error);
      return;
    }

    if (token) {
      // Clear guest flag so real user account is active
      localStorage.removeItem('isGuest');
      // Store the JWT exactly like every other login method
      localStorage.setItem('token', token);

      // Fetch the full user profile and set in context
      getMe()
        .then((user) => {
          setUser(user);
          router.push('/dashboard/projects');
        })
        .catch((err) => {
          console.error('Failed to fetch user after Google login:', err);
          localStorage.removeItem('token');
          router.push('/login?error=auth_failed');
        });
    } else {
      router.push('/login?error=no_token');
    }
  }, [searchParams, router, setUser]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      color: '#6366f1',
      gap: '12px',
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" opacity=".3"/>
        <path d="M12 2v4a8 8 0 0 1 0 16v4a12 12 0 0 0 0-24z"/>
      </svg>
      <span style={{ fontSize: '0.95rem', color: '#71717a' }}>Completing sign in…</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
