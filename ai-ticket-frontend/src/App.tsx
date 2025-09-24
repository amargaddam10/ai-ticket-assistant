import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import { store } from '@/store/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';

// Layout Components
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

import Dashboard from '@/pages/Dashboard';
import TicketList from '@/pages/tickets/TicketList';
import TicketDetail from '@/pages/tickets/TicketDetail';
import CreateTicket from '@/pages/tickets/CreateTicket';
import UserProfile from '@/pages/user/UserProfile';
import UserSettings from '@/pages/user/UserSettings';
import TeamManagement from '@/pages/admin/TeamManagement';
import AdminPanel from '@/pages/admin/AdminPanel'; // Add this new import
import Analytics from '@/pages/Analytics';
import Reports from '@/pages/Reports';

// Guards
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import PublicRoute from '@/components/guards/PublicRoute';
import AdminRoute from '@/components/guards/AdminRoute';

// Error Pages
import NotFound from '@/pages/errors/NotFound';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Global Styles
import '@/styles/globals.css';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
    },
    mutations: {
      retry: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <SocketProvider>
                  <Router
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                      <Routes>
                        {/* Public Routes */}
                        <Route
                          path="/auth/*"
                          element={
                            <PublicRoute>
                              <AuthLayout />
                            </PublicRoute>
                          }
                        >
                          <Route path="login" element={<Login />} />
                          <Route path="register" element={<Register />} />
                          <Route
                            path="forgot-password"
                            element={<ForgotPassword />}
                          />
                          <Route
                            path="reset-password"
                            element={<ResetPassword />}
                          />
                          <Route
                            path=""
                            element={<Navigate to="login" replace />}
                          />
                        </Route>

                        {/* Protected Routes */}
                        <Route
                          path="/*"
                          element={
                            <ProtectedRoute>
                              <DashboardLayout />
                            </ProtectedRoute>
                          }
                        >
                          {/* Dashboard */}
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route
                            path=""
                            element={<Navigate to="dashboard" replace />}
                          />

                          {/* Tickets */}
                          <Route path="tickets" element={<TicketList />} />
                          <Route
                            path="tickets/create"
                            element={<CreateTicket />}
                          />
                          <Route
                            path="tickets/:id"
                            element={<TicketDetail />}
                          />

                          {/* User */}
                          <Route path="profile" element={<UserProfile />} />
                          <Route path="settings" element={<UserSettings />} />

                          {/* Analytics */}
                          <Route path="analytics" element={<Analytics />} />
                          <Route path="reports" element={<Reports />} />

                          {/* Admin Routes - CORRECTED STRUCTURE */}
                          <Route
                            path="admin/*"
                            element={
                              <AdminRoute>
                                <Routes>
                                  <Route
                                    path="panel"
                                    element={<AdminPanel />}
                                  />
                                  <Route
                                    path="team"
                                    element={<TeamManagement />}
                                  />
                                  <Route
                                    path=""
                                    element={<Navigate to="panel" replace />}
                                  />
                                </Routes>
                              </AdminRoute>
                            }
                          />

                          {/* 404 */}
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>

                      {/* Global Toast Notifications */}
                      <Toaster
                        position="top-right"
                        toastOptions={{
                          duration: 4000,
                          className: 'font-medium',
                          style: {
                            background: 'var(--toast-bg)',
                            color: 'var(--toast-color)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--toast-border)',
                          },
                          success: {
                            iconTheme: {
                              primary: '#22c55e',
                              secondary: '#ffffff',
                            },
                          },
                          error: {
                            iconTheme: {
                              primary: '#ef4444',
                              secondary: '#ffffff',
                            },
                          },
                        }}
                      />
                    </div>
                  </Router>
                </SocketProvider>
              </AuthProvider>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
