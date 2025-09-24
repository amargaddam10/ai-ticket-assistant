import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management with force save
const getToken = (): string | null => {
  try {
    const token = localStorage.getItem('token');
    console.log(
      '🔍 Getting token from localStorage:',
      token ? `${token.substring(0, 30)}...` : 'null'
    );

    if (
      !token ||
      token === 'undefined' ||
      token === 'null' ||
      token.trim() === ''
    ) {
      console.log('❌ No valid token found');
      return null;
    }

    return token;
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

const setToken = (token: string): boolean => {
  try {
    if (!token || token === 'undefined' || token === 'null') {
      console.error('❌ Attempted to save invalid token:', token);
      return false;
    }

    console.log(
      '💾 Saving token to localStorage:',
      token.substring(0, 30) + '...'
    );
    localStorage.setItem('token', token);

    // Immediate verification
    const saved = localStorage.getItem('token');
    const success = saved === token;

    console.log('✅ Token save verification:', success);

    if (!success) {
      console.error('❌ Token was not saved correctly!', {
        attempted: token.substring(0, 30) + '...',
        actual: saved ? saved.substring(0, 30) + '...' : 'null',
      });
    }

    return success;
  } catch (error) {
    console.error('❌ Error setting token:', error);
    return false;
  }
};

const removeToken = (): void => {
  try {
    localStorage.removeItem('token');
    console.log('🗑️ Token removed from localStorage');

    // Verify removal
    const remaining = localStorage.getItem('token');
    if (remaining) {
      console.error('❌ Token was not removed correctly!');
    }
  } catch (error) {
    console.error('❌ Error removing token:', error);
  }
};

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    console.log('📤 Request to:', config.method?.toUpperCase(), config.url);
    console.log('🔑 Token available for request:', !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header set');
    } else {
      console.log('❌ No token - sending request without auth');
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error(
      '📥 Response error:',
      error.response?.status,
      error.config?.url
    );

    const response = error.response;
    const requestUrl = error.config?.url || '';

    // Check if this is an authentication endpoint
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (response?.status === 401) {
      // Only treat 401s as "session expired" for NON-authentication endpoints
      if (!isAuthEndpoint) {
        const data = response.data as any;
        console.log('🚨 401 Unauthorized - clearing token and redirecting');

        removeToken();
        toast.error('Your session has expired. Please login again.');

        // Force redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1000);

        return Promise.reject(new Error('Session expired'));
      } else {
        // For auth endpoints, just pass through the error without removing tokens
        console.log('🔑 401 on auth endpoint - letting component handle it');
      }
    }

    if (response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    }

    if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// Auth API with enhanced token handling
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('🔐 Login API call for:', credentials.email);

      const response = await api.post('/auth/login', credentials);
      const data = response.data;

      console.log('📋 Login response:', {
        success: data.success,
        hasToken: !!data.token,
        hasUser: !!data.data?.user,
        tokenLength: data.token ? data.token.length : 0,
      });

      if (data.success && data.token) {
        const saved = setToken(data.token);
        if (!saved) {
          throw new Error('Failed to save authentication token');
        }

        // Double verify token is available for next requests
        const verified = getToken();
        if (!verified) {
          throw new Error('Token verification failed after save');
        }

        console.log('✅ Login successful and token saved');
      } else {
        console.error('❌ Login response missing token or not successful');
        throw new Error('Invalid login response');
      }

      return data;
    } catch (error) {
      console.error('❌ Login API error:', error);
      removeToken(); // Clear any partial token
      throw error;
    }
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    try {
      console.log('📝 Register API call for:', userData.email);

      const response = await api.post('/auth/register', userData);
      const data = response.data;

      if (data.success && data.token) {
        setToken(data.token);
        console.log('✅ Registration successful and token saved');
      }

      return data;
    } catch (error) {
      console.error('❌ Register API error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('⚠️ Logout API call failed (continuing anyway)');
    } finally {
      removeToken();
    }
  },

  getProfile: async () => {
    try {
      console.log('👤 Profile API call');
      const token = getToken();
      console.log('🔑 Current token for profile:', !!token);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('❌ Profile API error:', error);
      throw error;
    }
  },
};

export { getToken, setToken, removeToken };
export default api;
