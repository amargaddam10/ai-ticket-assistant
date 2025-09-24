import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { setToken, removeToken } from '../../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.login(credentials);
      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    userData: { name: string; email: string; password: string; role?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.register(userData);
      if (!response.success) {
        return rejectWithValue(response.message || 'Registration failed');
      }
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch profile');
      }
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch profile';
      return rejectWithValue(message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    profileData: { name?: string; skills?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to update profile');
      }
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await authService.logout();
    } catch (error) {
      console.log('Logout API call failed, but continuing with local logout');
    }

    removeToken();
    return {};
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      removeToken();
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('🔄 Login fulfilled in Redux:', {
          success: action.payload.success,
          hasToken: !!action.payload.token,
          hasUser: !!action.payload.data?.user,
        });

        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.token;
        state.error = null;

        // Force save token to localStorage
        if (action.payload.token) {
          const saved = setToken(action.payload.token);
          console.log('💾 Token force save result:', saved);

          if (!saved) {
            state.error = 'Failed to save authentication token';
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
        removeToken();
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.token;
        state.error = null;

        // Force save token
        if (action.payload.token) {
          setToken(action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
        removeToken();
      });

    // Fetch Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;

        if (
          action.payload === 'jwt malformed' ||
          action.payload === 'jwt expired' ||
          action.payload === 'Token is malformed'
        ) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          removeToken();
        }
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { clearError, setAuthenticated, clearAuth } = authSlice.actions;
export default authSlice.reducer;
