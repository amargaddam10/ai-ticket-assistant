import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authSlice from './slices/authSlice';
import ticketSlice from './slices/ticketSlice';
import userSlice from './slices/userSlice';
import notificationSlice from './slices/notificationSlice';
import analyticsSlice from './slices/analyticsSlice';
import settingsSlice from './slices/settingsSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tickets: ticketSlice,
    users: userSlice,
    notifications: notificationSlice,
    analytics: analyticsSlice,
    settings: settingsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
