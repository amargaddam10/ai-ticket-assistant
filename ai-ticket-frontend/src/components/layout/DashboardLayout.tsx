import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  TicketIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const DashboardLayout: React.FC = () => {
  const { user, signout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive hook to detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;

      setIsMobile(mobile);

      // Auto-collapse based on screen size
      if (mobile) {
        setSidebarCollapsed(true);
      } else if (tablet) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'My Tickets', href: '/tickets', icon: TicketIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
    ...(user?.role === 'admin'
      ? [{ name: 'Admin Panel', href: '/admin/panel', icon: ShieldCheckIcon }]
      : []),
  ];

  const handleLogout = async () => {
    try {
      await signout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - FIXED LAYOUT */}
      <div
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}
      >
        {/* FIXED Header Section */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarCollapsed ? (
            // Collapsed: Center everything vertically and horizontally
            <div className="flex items-center justify-center w-full h-full">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Expand Sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            // Expanded: Logo left, button right
            <>
              <div className="flex items-center flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  🎫 Ticket AI
                </h1>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                title="Collapse Sidebar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation - FIXED */}
        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      sidebarCollapsed ? 'mx-auto' : 'mr-3'
                    } ${
                      isActive
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
                    } transition-all duration-200`}
                    aria-hidden="true"
                  />
                  {!sidebarCollapsed && (
                    <div className="flex-1 flex items-center justify-between transition-all duration-300">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* AI Assistant Status - Only when expanded */}
        {!sidebarCollapsed && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-green-800 dark:text-green-300">
                    AI Assistant
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Online & Ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIXED User Profile Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {sidebarCollapsed ? (
            // Collapsed: Stack vertically and center
            <div className="flex flex-col items-center space-y-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Expanded: Horizontal layout
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-semibold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Remove screen size indicator - not needed in production */}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.name ? `Hi, ${user.name}` : 'Welcome'}
              </h2>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
