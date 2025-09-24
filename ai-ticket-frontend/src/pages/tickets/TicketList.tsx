import React, { useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ListBulletIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  aiResponse?: string;
}

const TicketList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  // Get current filters from URL
  const currentFilters = {
    status: searchParams.getAll('status'),
    priority: searchParams.getAll('priority'),
    assignedTo: searchParams.getAll('assignedTo'),
    createdBy: searchParams.getAll('createdBy'),
    search: searchParams.get('search') || '',
  };

  // Default to "My Tickets" for regular users
  useEffect(() => {
    if (!user) return;
    const isRegularUser = user.role === 'user';
    const hasCreatedBy = searchParams.getAll('createdBy').length > 0;
    if (isRegularUser && !hasCreatedBy) {
      const params = new URLSearchParams(searchParams);
      params.append('createdBy', user._id);
      setSearchParams(params);
    }
  }, [user]);

  // Build API URL with filters - Alternative approach
  const buildApiUrl = () => {
    const params = new URLSearchParams();

    // Add filters to params - Join multiple values with commas
    if (currentFilters.status.length > 0) {
      params.set('status', currentFilters.status.join(','));
    }
    if (currentFilters.priority.length > 0) {
      params.set('priority', currentFilters.priority.join(','));
    }
    if (currentFilters.assignedTo.length > 0) {
      params.set('assignedTo', currentFilters.assignedTo.join(','));
    }
    if (currentFilters.createdBy.length > 0) {
      params.set('createdBy', currentFilters.createdBy.join(','));
    }
    // ✅ FIXED: Proper search parameter handling
    if (currentFilters.search && currentFilters.search.trim()) {
      params.set('search', currentFilters.search.trim());
    }

    const queryString = params.toString();
    console.log('🔍 Final query string:', queryString);

    return `http://localhost:5000/api/tickets${
      queryString ? `?${queryString}` : ''
    }`;
  };

  // Fetch tickets with current filters
  const {
    data: ticketsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tickets', currentFilters],
    queryFn: async () => {
      // Build clean parameters without arrays
      const cleanParams: any = {};

      // Convert arrays to single values or comma-separated strings
      if (currentFilters.status.length > 0) {
        cleanParams.status = currentFilters.status[0]; // Take first value only
      }
      if (currentFilters.priority.length > 0) {
        cleanParams.priority = currentFilters.priority[0]; // Take first value only
      }
      if (currentFilters.assignedTo.length > 0) {
        cleanParams.assignedTo = currentFilters.assignedTo[0]; // Take first value only
      }
      if (currentFilters.createdBy.length > 0) {
        cleanParams.createdBy = currentFilters.createdBy[0]; // Take first value only
      }
      if (currentFilters.search) {
        cleanParams.q = currentFilters.search;
      }

      // ✅ ADD THIS CLEANUP CODE HERE
      Object.keys(cleanParams).forEach((key) => {
        const value = cleanParams[key];
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          value === 'undefined' ||
          String(value) === 'undefined'
        ) {
          delete cleanParams[key];
        }
      });

      console.log('🔍 Clean params being sent:', cleanParams);

      return api.get<{ tickets: Ticket[]; pagination: any }>('/tickets', {
        params: cleanParams, // Use clean params instead of currentFilters
      });
    },
  });

  // Extract tickets from response
  let tickets = (ticketsResponse as any)?.data?.tickets || [];

  // For regular users, ensure we only show tickets they created (not assigned)
  // BUT don't filter when searching - let backend handle it
  tickets = useMemo(() => {
    const current = ((ticketsResponse as any)?.data?.tickets || []) as any[];

    console.log(
      '🔍 Raw backend data:',
      current.length,
      current.map((t) => t.title)
    );

    // If user is searching, filter the results client-side since backend isn't filtering properly
    if (currentFilters.search && currentFilters.search.trim()) {
      console.log('🔍 Search mode: filtering backend results client-side');
      const searchTerm = currentFilters.search.toLowerCase();
      const filtered = current.filter(
        (ticket: any) =>
          ticket.title.toLowerCase().includes(searchTerm) ||
          ticket.description.toLowerCase().includes(searchTerm)
      );
      console.log(
        '🔍 Found matching tickets:',
        filtered.length,
        filtered.map((t) => t.title)
      );
      return filtered;
    }

    // Only apply "My Tickets" filter when not searching
    if (!user || user.role !== 'user') return current;
    const currentUserId = (user as any).id || (user as any)._id;
    console.log('🔍 Filtering for user:', currentUserId);

    const isMine = (t: any) => {
      const createdBy = t?.createdBy;
      const userField = t?.user;
      const createdById =
        typeof createdBy === 'string' ? createdBy : createdBy?._id;
      const userFieldId =
        typeof userField === 'string' ? userField : userField?._id;
      const matches =
        createdById === currentUserId || userFieldId === currentUserId;
      console.log(
        `🔍 Ticket "${t.title}": createdBy=${createdById}, user=${userFieldId}, matches=${matches}`
      );
      return matches;
    };

    const filtered = current.filter(isMine);
    console.log('🔍 After filtering:', filtered.length, 'tickets');
    return filtered;
  }, [ticketsResponse, user, currentFilters.search]);

  // Helper functions
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-600 bg-red-100',
      critical: 'text-red-600 bg-red-100',
      high: 'text-orange-600 bg-orange-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-green-600 bg-green-100',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-blue-600 bg-blue-100',
      'in-progress': 'text-yellow-600 bg-yellow-100',
      resolved: 'text-green-600 bg-green-100',
      closed: 'text-gray-600 bg-gray-100',
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  // Quick filter handlers
  const applyFilter = (filterType: string, filterValue: any) => {
    const params = new URLSearchParams(searchParams);

    // Clear existing filters of this type
    params.delete(filterType);

    // Add new filter value(s)
    if (Array.isArray(filterValue)) {
      filterValue.forEach((value) => params.append(filterType, value));
    } else if (filterValue) {
      params.set(filterType, filterValue);
    }

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const viewAIResponse = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowAIModal(true);
  };

  // Replace your quickFilters array with this:
  const quickFilters = [
    {
      label: 'My Tickets',
      onClick: () => {
        const params = new URLSearchParams();
        params.set('createdBy', user?.id || '');
        setSearchParams(params);
      },
      icon: <EyeIcon className="w-4 h-4" />, // ← Render as JSX element
      active: currentFilters.createdBy.includes(user?.id),
    },
    // {
    //   label: 'Unassigned',
    //   onClick: () => {
    //     const params = new URLSearchParams();
    //     params.set('assignedTo', 'unassigned');
    //     setSearchParams(params);
    //   },
    //   icon: <ClockIcon className="w-4 h-4" />, // ← Render as JSX element
    //   active: currentFilters.assignedTo.includes('unassigned'),
    // },
    {
      label: 'Urgent',
      onClick: () => {
        const params = new URLSearchParams();
        params.set('priority', 'urgent');
        setSearchParams(params);
      },
      icon: <ExclamationTriangleIcon className="w-4 h-4" />, // ← Render as JSX element
      active: currentFilters.priority.includes('urgent'),
    },
    {
      label: 'Open',
      onClick: () => {
        const params = new URLSearchParams();
        params.set('status', 'open');
        setSearchParams(params);
      },
      icon: <ListBulletIcon className="w-4 h-4" />, // ← Render as JSX element
      active: currentFilters.status.includes('open'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tickets
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading...' : `${tickets.length} tickets found`}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);

                  // ✅ FIXED: Proper search parameter handling
                  const params = new URLSearchParams(searchParams);
                  if (value.trim()) {
                    params.set('search', value.trim()); // Use 'set' instead of 'append'
                  } else {
                    params.delete('search');
                  }
                  setSearchParams(params);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(currentFilters.status.length > 0 ||
            currentFilters.priority.length > 0 ||
            currentFilters.assignedTo.length > 0 ||
            currentFilters.createdBy.length > 0 ||
            currentFilters.search) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={filter.onClick}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                filter.active
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter.icon}
              <span className="ml-1">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              Error loading tickets
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-4">
              <ListBulletIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No tickets found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {Object.keys(currentFilters).some((key) =>
                    Array.isArray(
                      currentFilters[key as keyof typeof currentFilters]
                    )
                      ? (
                          currentFilters[
                            key as keyof typeof currentFilters
                          ] as string[]
                        ).length > 0
                      : currentFilters[key as keyof typeof currentFilters]
                  )
                    ? 'No tickets match your current filters. Try adjusting your search criteria.'
                    : 'Create your first ticket to get started!'}
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                {Object.keys(currentFilters).some((key) =>
                  Array.isArray(
                    currentFilters[key as keyof typeof currentFilters]
                  )
                    ? (
                        currentFilters[
                          key as keyof typeof currentFilters
                        ] as string[]
                      ).length > 0
                    : currentFilters[key as keyof typeof currentFilters]
                ) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Title</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1">Created By</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Ticket Rows */}
            {tickets.map((ticket: Ticket) => (
              <div
                key={ticket._id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Title */}
                  <div className="col-span-4">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ticket.description}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  {/* Created */}
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Created By */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {ticket.createdBy.name}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    {ticket.aiResponse && (
                      <button
                        onClick={() => viewAIResponse(ticket)}
                        className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View AI Response"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Response Modal */}
      {showAIModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  AI Response - {selectedTicket.title}
                </h3>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Original Issue:
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTicket.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    AI Generated Solution:
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: (selectedTicket.aiResponse || '').replace(
                          /(https?:\/\/[^\s)]+)|www\.[^\s)]+/g,
                          (m) =>
                            `<a href="${
                              m.startsWith('http') ? m : 'https://' + m
                            }" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${m}</a>`
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
