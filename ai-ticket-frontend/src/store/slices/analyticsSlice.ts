import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface AnalyticsData {
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    slaCompliance: number;
  };
  trends: {
    ticketVolume: Array<{ date: string; count: number }>;
    resolutionTimes: Array<{ date: string; avgTime: number }>;
    categories: Array<{ name: string; count: number; percentage: number }>;
    priorities: Array<{ level: string; count: number; percentage: number }>;
  };
  performance: {
    topAgents: Array<{
      id: string;
      name: string;
      resolvedTickets: number;
      avgResolutionTime: number;
      satisfaction: number;
    }>;
    slaBreaches: Array<{
      ticketId: string;
      title: string;
      daysOverdue: number;
      priority: string;
    }>;
  };
}

interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (timeRange: string = '30d') => {
    const response = await api.get(`/analytics/dashboard?range=${timeRange}`);
    return response.data;
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'analytics/fetchDashboardStats',
  async () => {
    const response = await api.get('/analytics/dashboard-stats');
    return response.data;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        // Merge dashboard stats into existing data
        if (state.data) {
          state.data.overview = { ...state.data.overview, ...action.payload };
        } else {
          state.data = {
            overview: action.payload,
            trends: {
              ticketVolume: [],
              resolutionTimes: [],
              categories: [],
              priorities: [],
            },
            performance: { topAgents: [], slaBreaches: [] },
          };
        }
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard stats';
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
