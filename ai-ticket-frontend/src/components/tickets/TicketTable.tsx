import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../store/store';
import {
  fetchTickets,
  updateTicketStatus,
  deleteTicket,
} from '../../store/slices/ticketSlice';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

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
}

interface TicketTableProps {
  tickets: Ticket[];
  loading?: boolean;
  onTicketClick?: (ticket: Ticket) => void;
  onStatusUpdate?: (ticketId: string, status: string) => void;
  onDelete?: (ticketId: string) => void;
}

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  loading = false,
  onTicketClick,
  onStatusUpdate,
  onDelete,
}) => {
  const [sortField, setSortField] = useState<keyof Ticket>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const dispatch = useAppDispatch();

  const handleSort = (field: keyof Ticket) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'urgent':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-50';
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'resolved':
        return 'text-green-600 bg-green-50';
      case 'closed':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(ticketId, newStatus);
      } else {
        await dispatch(
          updateTicketStatus({ ticketId, status: newStatus })
        ).unwrap();
      }
      toast.success('Ticket status updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        if (onDelete) {
          await onDelete(ticketId);
        } else {
          await dispatch(deleteTicket(ticketId)).unwrap();
        }
        toast.success('Ticket deleted successfully');
      } catch (error) {
        toast.error('Failed to delete ticket');
      }
    }
  };

  const toggleSelectTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedTickets(
      selectedTickets.length === tickets.length
        ? []
        : tickets.map((ticket) => ticket._id)
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700"></div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-600 border-t"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedTickets.length === tickets.length &&
                    tickets.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Title</span>
                  {sortField === 'title' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    ))}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortField === 'status' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    ))}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center space-x-1">
                  <span>Priority</span>
                  {sortField === 'priority' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    ))}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned To
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {sortField === 'createdAt' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    ))}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {sortedTickets.map((ticket) => (
                <motion.tr
                  key={ticket._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket._id)}
                      onChange={() => toggleSelectTicket(ticket._id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => onTicketClick?.(ticket)}
                      >
                        {ticket.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {ticket.description}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          #{ticket._id.slice(-8)}
                        </span>
                        {ticket.category && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                            {ticket.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        handleStatusChange(ticket._id, e.target.value)
                      }
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {ticket.priority === 'urgent' && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority.charAt(0).toUpperCase() +
                          ticket.priority.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assignedTo ? (
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {ticket.assignedTo.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {ticket.assignedTo.name}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(ticket.createdAt), 'HH:mm')}
                      </div>
                      {ticket.dueDate && (
                        <div className="flex items-center mt-1">
                          <ClockIcon className="h-3 w-3 text-orange-500 mr-1" />
                          <span className="text-xs text-orange-600">
                            Due: {format(new Date(ticket.dueDate), 'MMM dd')}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onTicketClick?.(ticket)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onTicketClick?.(ticket)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ticket._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {tickets.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            No tickets found
          </div>
        </div>
      )}

      {selectedTickets.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedTickets.length} ticket(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Bulk Update Status
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Bulk Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
