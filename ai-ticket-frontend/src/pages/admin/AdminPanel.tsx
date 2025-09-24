import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ChartBarIcon,
  PencilIcon,
  TicketIcon,
  UsersIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  skills: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  stats?: {
    createdTickets: number;
    assignedTickets: number;
    completedTickets: number;
    totalHandled: number;
  };
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: string;
  requiredSkills: string[];
  aiNotes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    skills: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalModerators: number;
  totalAdmins: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'analytics'>(
    'users'
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalModerators: 0,
    totalAdmins: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
  });

  // Filters
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: 'all',
    isActive: 'all',
  });

  const [ticketFilters, setTicketFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
  });

  useEffect(() => {
    fetchUsers();
    fetchTickets();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.role !== 'all') params.append('role', userFilters.role);
      if (userFilters.isActive !== 'all')
        params.append('isActive', userFilters.isActive);

      const response = await fetch(
        `http://localhost:5000/api/users/admin/all-users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (ticketFilters.search) params.append('search', ticketFilters.search);
      if (ticketFilters.status !== 'all')
        params.append('status', ticketFilters.status);
      if (ticketFilters.priority !== 'all')
        params.append('priority', ticketFilters.priority);
      if (ticketFilters.assignedTo !== 'all')
        params.append('assignedTo', ticketFilters.assignedTo);

      const response = await fetch(
        `http://localhost:5000/api/tickets/admin/overview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data.data.tickets);
    } catch (error) {
      toast.error('Failed to fetch tickets');
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersResponse, ticketsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/users/admin/all-users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/tickets/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersResponse.json();
      const ticketsData = await ticketsResponse.json();

      const userStats = {
        totalUsers: usersData.data.users.length,
        totalModerators: usersData.data.users.filter(
          (u: User) => u.role === 'moderator'
        ).length,
        totalAdmins: usersData.data.users.filter(
          (u: User) => u.role === 'admin'
        ).length,
        totalTickets: ticketsData.data.summary.totalTickets,
        openTickets: ticketsData.data.summary.openTickets,
        resolvedTickets: ticketsData.data.summary.resolvedTickets,
        urgentTickets: ticketsData.data.summary.urgentTickets,
      };

      setStats(userStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/users/admin/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) throw new Error('Failed to update user role');

      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error);
    }
  };

  const updateUserSkills = async (userId: string, skills: string[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/users/admin/${userId}/skills`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ skills }),
        }
      );

      if (!response.ok) throw new Error('Failed to update user skills');

      toast.success('User skills updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user skills');
      console.error('Error updating user skills:', error);
    }
  };

  const promoteToModerator = async (userId: string, skills: string[] = []) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:5000/api/users/promote-to-moderator',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, initialSkills: skills }),
        }
      );

      if (!response.ok) throw new Error('Failed to promote user');

      toast.success('User promoted to moderator successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to promote user');
      console.error('Error promoting user:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'escalated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <ShieldCheckIcon className="h-8 w-8 mr-3 text-blue-600" />
              Admin Panel
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage users, tickets, and system settings
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-xl font-semibold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Moderators
                </p>
                <p className="text-xl font-semibold">{stats.totalModerators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <TicketIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tickets
                </p>
                <p className="text-xl font-semibold">{stats.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Urgent Tickets
                </p>
                <p className="text-xl font-semibold">{stats.urgentTickets}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', name: 'User Management', icon: UserGroupIcon },
              { id: 'tickets', name: 'Ticket Overview', icon: TicketIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userFilters.search}
                    onChange={(e) =>
                      setUserFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <select
                value={userFilters.role}
                onChange={(e) =>
                  setUserFilters((prev) => ({ ...prev, role: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>

              <select
                value={userFilters.isActive}
                onChange={(e) =>
                  setUserFilters((prev) => ({
                    ...prev,
                    isActive: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 inline" />
                Apply Filters
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Skills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                              <div className="ml-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    : users.map((user) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                updateUserRole(user._id, e.target.value)
                              }
                              className={`text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${getRoleColor(
                                user.role
                              )}`}
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.skills?.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {user.skills?.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                  +{user.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="text-xs">
                              <div>
                                Created: {user.stats?.createdTickets || 0}
                              </div>
                              <div>
                                Assigned: {user.stats?.assignedTickets || 0}
                              </div>
                              <div>
                                Completed: {user.stats?.completedTickets || 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit User"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              {user.role === 'user' && (
                                <button
                                  onClick={() => promoteToModerator(user._id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Promote to Moderator"
                                >
                                  <UserGroupIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                </tbody>
              </table>
            </div>

            {!loading && users.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No users match the current filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Ticket Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={ticketFilters.search}
                    onChange={(e) =>
                      setTicketFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <select
                value={ticketFilters.status}
                onChange={(e) =>
                  setTicketFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="escalated">Escalated</option>
              </select>

              <select
                value={ticketFilters.priority}
                onChange={(e) =>
                  setTicketFilters((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 inline" />
                Apply Filters
              </button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Skills Required
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      AI Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          </td>
                        </tr>
                      ))
                    : tickets.map((ticket) => (
                        <motion.tr
                          key={ticket._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {ticket.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {ticket.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {ticket.status.charAt(0).toUpperCase() +
                                ticket.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority.charAt(0).toUpperCase() +
                                ticket.priority.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {ticket.createdBy.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {ticket.createdBy.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {ticket.assignedTo ? (
                              <div>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {ticket.assignedTo.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {ticket.assignedTo.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {ticket.requiredSkills
                                ?.slice(0, 2)
                                .map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {ticket.requiredSkills?.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                  +{ticket.requiredSkills.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {ticket.aiNotes ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {ticket.aiNotes}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                No AI notes
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                        </motion.tr>
                      ))}
                </tbody>
              </table>
            </div>

            {!loading && tickets.length === 0 && (
              <div className="text-center py-12">
                <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No tickets found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No tickets match the current filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analytics dashboard coming soon...
          </p>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={(userId, updates) => {
            if (updates.skills) {
              updateUserSkills(userId, updates.skills);
            }
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSave = () => {
    onSave(user._id, { skills });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit User Skills
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>Name:</strong> {user.name}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <strong>Email:</strong> {user.email}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addSkill())
              }
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm flex items-center gap-1"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
