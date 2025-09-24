import React from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  comments?: any[];
  attachments?: any[];
}

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  onStatusChange?: (status: string) => void;
  onAssign?: () => void;
  className?: string;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  onStatusChange,
  onAssign,
  className = '',
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();
  const isDueSoon =
    ticket.dueDate &&
    new Date(ticket.dueDate).getTime() - new Date().getTime() <
      24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                {ticket.title}
              </h3>
              {ticket.priority === 'urgent' && (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {ticket.description}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                ticket.status
              )}`}
            >
              {ticket.status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <TagIcon className="h-4 w-4 mr-1" />#{ticket._id.slice(-8)}
            </span>

            {ticket.category && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {ticket.category}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {ticket.comments && ticket.comments.length > 0 && (
              <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                {ticket.comments.length}
              </span>
            )}

            {ticket.attachments && ticket.attachments.length > 0 && (
              <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <PaperClipIcon className="h-4 w-4 mr-1" />
                {ticket.attachments.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {ticket.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {ticket.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{ticket.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Assignment and Time Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {ticket.assignedTo ? (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {ticket.assignedTo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ticket.assignedTo.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assigned
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign?.();
                }}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <UserIcon className="h-4 w-4 mr-1" />
                Unassigned
              </button>
            )}
          </div>

          <div className="text-right">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-3 w-3 mr-1" />
              <span>
                {formatDistanceToNow(new Date(ticket.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {ticket.dueDate && (
              <div
                className={`text-xs mt-1 ${
                  isOverdue
                    ? 'text-red-600'
                    : isDueSoon
                    ? 'text-orange-600'
                    : 'text-gray-500'
                }`}
              >
                Due: {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}
                {isOverdue && ' (Overdue)'}
                {isDueSoon && !isOverdue && ' (Due Soon)'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created by {ticket.user.name}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={ticket.status}
              onChange={(e) => {
                e.stopPropagation();
                onStatusChange?.(e.target.value);
              }}
              className="text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketCard;
