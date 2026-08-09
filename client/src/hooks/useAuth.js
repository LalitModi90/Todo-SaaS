'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/authApi';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export const GUEST_USER = {
  id: "guest",
  name: "Guest User",
  email: "guest@example.com",
  role: "guest",
  isGuest: true
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Silent background ping to wake up backend server as soon as website opens
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const backendUrl = isLocal ? 'http://localhost:4000' : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : 'https://todo-saas.onrender.com');
      fetch(backendUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
    }

    // 2. Auth initialization
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          localStorage.removeItem('isGuest');
          try {
            const userData = await getMe();
            setUser(userData);
          } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('token');
            setUser(null);
          }
        } else if (localStorage.getItem('isGuest') === 'true') {
          setUser(GUEST_USER);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginAsGuest = () => {
    localStorage.removeItem('token');
    localStorage.setItem('isGuest', 'true');
    setUser(GUEST_USER);
    router.push('/dashboard/projects');
  };

  const logoutUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('isGuest');
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.push('/login');
    }
  };

  const checkGuestAction = (actionName = "use this feature") => {
    if (user?.isGuest || user?.role === 'guest') {
      alert(`Guest mode: Login required to ${actionName}`);
      return true;
    }
    return false;
  };

  const isGuestUser = user?.isGuest || user?.role === 'guest';

  useEffect(() => {
    if (!loading) {
      if (!user && pathname && pathname.startsWith('/dashboard')) {
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard/projects');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      loginAsGuest, 
      logoutUser, 
      isGuestUser, 
      checkGuestAction 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
