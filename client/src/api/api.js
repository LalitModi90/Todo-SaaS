import axios from 'axios';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://todo-saas.onrender.com/api';
  }
  return 'https://todo-saas.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to format 401 unauthenticated errors into user-friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const serverMsg = error.response.data?.error || '';
      if (
        !serverMsg ||
        serverMsg.toLowerCase().includes('token') ||
        serverMsg.toLowerCase().includes('authorization') ||
        serverMsg.toLowerCase().includes('denied')
      ) {
        error.response.data = error.response.data || {};
        error.response.data.error = '⚠️ Please create an account or log in to perform this action.';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
