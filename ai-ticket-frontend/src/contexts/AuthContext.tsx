import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchUserProfile,
  clearError,
  clearAuth,
} from '../store/slices/authSlice';
import api from '../services/api'; // ✅ ADD THIS LINE

interface AuthContextType {
  // State
  user: any;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  clearAuthError: () => void;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<any>; // ✅ ADD THIS LINE

  // Utility
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, token, isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();
  const [initialized, setInitialized] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken && !user) {
        try {
          console.log('🔄 Initializing auth with stored token');
          await dispatch(fetchUserProfile()).unwrap();
          // console.log('✅ Auth initialized successfully');
        } catch (error) {
          console.log('❌ Auth initialization failed:', error);
          dispatch(clearAuth());
        }
      }

      setInitialized(true);
    };

    if (!initialized) {
      initializeAuth();
    }
  }, [dispatch, user, initialized]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 AuthContext login attempt for:', email);
      await dispatch(loginUser({ email, password })).unwrap();
      // console.log('✅ AuthContext login successful');
    } catch (error: any) {
      console.error('❌ AuthContext login error:', error);
      throw new Error(error || 'Login failed');
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      console.log('📝 AuthContext register attempt for:', email);
      await dispatch(registerUser({ name, email, password })).unwrap();
      // console.log('✅ AuthContext register successful');
    } catch (error: any) {
      console.error('❌ AuthContext register error:', error);
      throw new Error(error || 'Registration failed');
    }
  };

  // Signout function
  const signout = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext logout');
      await dispatch(logoutUser()).unwrap();
      // console.log('✅ AuthContext logout successful');
    } catch (error) {
      console.log('⚠️ AuthContext logout error (continuing anyway):', error);
      // Clear local state even if API call fails
      dispatch(clearAuth());
    }
  };

  // Clear authentication error
  const clearAuthError = (): void => {
    dispatch(clearError());
  };

  // Refresh user profile - ENHANCED VERSION
  const refreshProfile = async (): Promise<void> => {
    if (!token) return;

    try {
      // console.log('AuthContext refreshing profile');
      await dispatch(fetchUserProfile()).unwrap();
      // console.log('AuthContext profile refreshed');
    } catch (error) {
      console.error('AuthContext profile refresh failed:', error);
    }
  };

  // NEW: Direct API refresh for immediate updates (like after photo upload)
  const refreshUser = async (): Promise<any> => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        // Update the Redux store directly with fresh user data
        dispatch(
          loginUser.fulfilled(
            {
              user: response.data.data.user,
              token: token || '',
            },
            '',
            { email: '', password: '' }
          )
        );

        console.log('🔄 User context updated with:', response.data.data.user);
        return response.data.data.user;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
    return null;
  };

  // Derived state
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  const contextValue: AuthContextType = {
    // State
    user,
    token,
    loading: isLoading,
    error,

    // Actions
    login,
    register,
    signout,
    clearAuthError,
    refreshProfile,
    refreshUser, // ✅ ADD THIS LINE

    // Utility
    isAuthenticated,
    isAdmin,
    isModerator,
  };

  // Don't render children until auth is initialized
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export types
export type { AuthContextType };
