import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const ResponsiveSidebar: React.FC = () => {
  const { user, signout } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();

  // State management
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Auto-expand/collapse based on screen size
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsCollapsed(false);
    } else if (isTablet) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
      setIsSidebarOpen(true);
    }
  }, [isMobile, isTablet]);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'My Tickets',
      href: '/tickets',
      icon: TicketIcon,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
    },
    ...(user?.role === 'admin'
      ? [
          {
            name: 'Admin Panel',
            href: '/admin/panel',
            icon: ShieldCheckIcon,
          },
        ]
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
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const sidebarWidth = isCollapsed && !isMobile ? 'w-16' : 'w-64';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || !isMobile) && (
          <motion.div
            initial={isMobile ? { x: -256 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -256 } : false}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`${
              isMobile ? 'fixed' : 'relative'
            } ${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 transition-all duration-300 ease-in-out`}
          >
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
              {!isCollapsed || isMobile ? (
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl font-bold text-gray-900 dark:text-white"
                >
                  🎫 Ticket AI
                </motion.h1>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl"
                >
                  🎫
                </motion.div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={isCollapsed && !isMobile ? item.name : undefined}
                  >
                    <item.icon
                      className={`flex-shrink-0 ${
                        isCollapsed && !isMobile ? 'h-6 w-6' : 'mr-3 h-5 w-5'
                      } ${
                        isActive
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    {(!isCollapsed || isMobile) && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 flex items-center justify-between"
                      >
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* AI Assistant Status */}
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-gray-200 dark:border-gray-700 p-4 mb-4"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
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
              </motion.div>
            )}

            {/* User Profile Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.role || 'User'}
                    </p>
                  </motion.div>
                )}
                <button
                  onClick={handleLogout}
                  className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile hamburger / Desktop collapse button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {isMobile ? (
                  isSidebarOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )
                ) : isCollapsed ? (
                  <Bars3Icon className="h-6 w-6" />
                ) : (
                  <XMarkIcon className="h-6 w-6" />
                )}
              </button>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.name ? `Hi, ${user.name}` : 'Welcome'}
              </h2>
            </div>

            {/* Desktop logout button */}
            {!isMobile && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Logout
              </button>
            )}
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

export default ResponsiveSidebar;
