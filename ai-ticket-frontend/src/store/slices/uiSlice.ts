import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  // Sidebar state
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Loading states
  globalLoading: boolean;

  // Modal states
  modals: {
    createTicket: boolean;
    editTicket: boolean;
    deleteConfirm: boolean;
    userProfile: boolean;
  };

  // Notification state
  notifications: {
    show: boolean;
    count: number;
  };

  // Layout preferences
  layout: {
    ticketListView: 'table' | 'cards';
    density: 'compact' | 'comfortable' | 'spacious';
  };

  // Search and filters
  search: {
    query: string;
    isAdvanced: boolean;
  };
}

const initialState: UiState = {
  sidebarCollapsed: false,
  theme: 'light',
  globalLoading: false,
  modals: {
    createTicket: false,
    editTicket: false,
    deleteConfirm: false,
    userProfile: false,
  },
  notifications: {
    show: false,
    count: 0,
  },
  layout: {
    ticketListView: 'table',
    density: 'comfortable',
  },
  search: {
    query: '',
    isAdvanced: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },

    // Modal actions
    openModal: (state, action: PayloadAction<keyof UiState['modals']>) => {
      state.modals[action.payload] = true;
    },

    closeModal: (state, action: PayloadAction<keyof UiState['modals']>) => {
      state.modals[action.payload] = false;
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((modal) => {
        state.modals[modal as keyof UiState['modals']] = false;
      });
    },

    // Notification actions
    setNotificationCount: (state, action: PayloadAction<number>) => {
      state.notifications.count = action.payload;
    },

    toggleNotifications: (state) => {
      state.notifications.show = !state.notifications.show;
    },

    closeNotifications: (state) => {
      state.notifications.show = false;
    },

    // Layout actions
    setTicketListView: (state, action: PayloadAction<'table' | 'cards'>) => {
      state.layout.ticketListView = action.payload;
    },

    setDensity: (
      state,
      action: PayloadAction<'compact' | 'comfortable' | 'spacious'>
    ) => {
      state.layout.density = action.payload;
    },

    // Search actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.search.query = action.payload;
    },

    setAdvancedSearch: (state, action: PayloadAction<boolean>) => {
      state.search.isAdvanced = action.payload;
    },

    clearSearch: (state) => {
      state.search.query = '';
      state.search.isAdvanced = false;
    },
  },
});

export const {
  setSidebarCollapsed,
  toggleSidebar,
  setTheme,
  setGlobalLoading,
  openModal,
  closeModal,
  closeAllModals,
  setNotificationCount,
  toggleNotifications,
  closeNotifications,
  setTicketListView,
  setDensity,
  setSearchQuery,
  setAdvancedSearch,
  clearSearch,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectSidebarCollapsed = (state: { ui: UiState }) =>
  state.ui.sidebarCollapsed;
export const selectTheme = (state: { ui: UiState }) => state.ui.theme;
export const selectGlobalLoading = (state: { ui: UiState }) =>
  state.ui.globalLoading;
export const selectModals = (state: { ui: UiState }) => state.ui.modals;
export const selectNotifications = (state: { ui: UiState }) =>
  state.ui.notifications;
export const selectLayout = (state: { ui: UiState }) => state.ui.layout;
export const selectSearch = (state: { ui: UiState }) => state.ui.search;
