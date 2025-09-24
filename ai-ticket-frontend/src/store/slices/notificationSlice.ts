import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Notification {
  id: string;
  type:
    | 'ticket_created'
    | 'ticket_updated'
    | 'ticket_assigned'
    | 'sla_breach'
    | 'comment_added';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticket?: {
    _id: string;
    title: string;
  };
  user?: {
    _id: string;
    name: string;
  };
}

interface NotificationState {
  items: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string) => {
    await api.patch(`/notifications/${notificationId}/read`);
    return notificationId;
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string) => {
    await api.delete(`/notifications/${notificationId}`);
    return notificationId;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await api.patch('/notifications/mark-all-read');
    return true;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount++;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(
        (item) => item.id === action.payload
      );
      if (notification && !notification.isRead) {
        state.unreadCount--;
      }
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateNotification: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Notification> }>
    ) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        const wasUnread = !state.items[index].isRead;
        const willBeRead = action.payload.updates.isRead;

        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
        };

        if (wasUnread && willBeRead) {
          state.unreadCount--;
        } else if (!wasUnread && !willBeRead) {
          state.unreadCount++;
        }
      }
    },
    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })

      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.items.find(
          (item) => item.id === action.payload
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount--;
        }
      })

      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.items.find(
          (item) => item.id === action.payload
        );
        if (notification && !notification.isRead) {
          state.unreadCount--;
        }
        state.items = state.items.filter((item) => item.id !== action.payload);
      })

      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          item.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const {
  addNotification,
  removeNotification,
  updateNotification,
  clearAllNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
