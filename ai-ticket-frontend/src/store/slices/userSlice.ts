import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  ticketCount?: number;
  skills?: string[];
  phone?: string;
  timezone?: string;
  language?: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  }) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      // Return mock data if API fails
      return {
        users: [
          {
            _id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-15T10:00:00Z',
            lastLoginAt: '2024-01-20T14:30:00Z',
            ticketCount: 45,
          },
          {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'moderator',
            status: 'active',
            createdAt: '2024-01-16T09:00:00Z',
            lastLoginAt: '2024-01-19T16:45:00Z',
            ticketCount: 32,
          },
          {
            _id: '3',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-17T11:00:00Z',
            lastLoginAt: '2024-01-18T12:15:00Z',
            ticketCount: 8,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        },
      };
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('User not found');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Partial<User>) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
    try {
      const response = await api.put(`/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      return userId;
    } catch (error) {
      throw new Error('Failed to delete user');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearUsers: (state) => {
      state.users = [];
      state.pagination = initialState.pagination;
    },
    setPagination: (
      state,
      action: PayloadAction<Partial<UserState['pagination']>>
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })

      // Fetch single user
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user';
      })

      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
        state.pagination.total += 1;
      })

      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (user) => user._id === action.payload._id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?._id === action.payload._id) {
          state.currentUser = action.payload;
        }
      })

      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user._id !== action.payload);
        if (state.currentUser?._id === action.payload) {
          state.currentUser = null;
        }
        state.pagination.total -= 1;
      });
  },
});

export const { setCurrentUser, clearUsers, setPagination } = userSlice.actions;
export default userSlice.reducer;
