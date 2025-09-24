import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface SettingsState {
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    ticketUpdates: boolean;
    weeklyReports: boolean;
    securityAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    activityTracking: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showAvatars: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    ticketUpdates: true,
    weeklyReports: true,
    securityAlerts: true,
  },
  privacy: {
    profileVisibility: 'public',
    activityTracking: true,
    dataSharing: false,
  },
  appearance: {
    theme: 'light',
    compactMode: false,
    showAvatars: true,
  },
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const response = await api.get('/users/settings');
    return response.data;
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settings: Partial<Omit<SettingsState, 'loading' | 'error'>>) => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateLocalSettings: (
      state,
      action: PayloadAction<Partial<Omit<SettingsState, 'loading' | 'error'>>>
    ) => {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update settings';
      });
  },
});

export const { updateLocalSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
