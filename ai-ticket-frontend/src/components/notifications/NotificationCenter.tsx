import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../store/store';
import {
  fetchNotifications,
  markAsRead,
  deleteNotification,
} from '../../store/slices/notificationSlice';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
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

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(
    (state) => state.notifications?.items || []
  );
  const loading = useAppSelector(
    (state) => state.notifications?.loading || false
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, dispatch]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    for (const notification of unreadNotifications) {
      await dispatch(markAsRead(notification._id));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
      case 'ticket_updated':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'ticket_assigned':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case 'sla_breach':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'comment_added':
        return <InformationCircleIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      default:
        return true;
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Notification Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['all', 'unread', 'read'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium capitalize ${
                  filter === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab}
                {tab === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 text-xs">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse mb-4">
                    <div className="flex space-x-3">
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'all'
                    ? 'No notifications yet'
                    : `No ${filter} notifications`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                        !notification.isRead
                          ? 'bg-blue-50 dark:bg-blue-900/10'
                          : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3
                              className={`text-sm font-medium ${
                                !notification.isRead
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-1">
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification._id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                          {notification.ticket && (
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              Ticket: {notification.ticket.title}
                            </div>
                          )}
                          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            <span>
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
