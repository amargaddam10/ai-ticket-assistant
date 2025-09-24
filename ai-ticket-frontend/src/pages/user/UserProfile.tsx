import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircleIcon,
  ChartBarIcon,
  ClockIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CameraIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  TrophyIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface UserProfileStats {
  totalTicketsCreated: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: string;
  favoriteCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{ date: string; action: string; ticketTitle: string }>;
  monthlyTickets: number;
  resolutionRate: number;
}

interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'alert' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestion?: string;
}

const UserProfile: React.FC = () => {
  console.log('🚀 UserProfile component rendering...'); // ADD THIS
  const { user, refreshUser } = useAuth();
  console.log('✅ useAuth successful, user:', user); // ADD THIS
  console.log('✅ refreshUser available:', !!refreshUser); // ADD THIS
  const [activeTab, setActiveTab] = useState('overview');
  const [profileStats, setProfileStats] = useState<UserProfileStats | null>(
    null
  );
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('🔍 UserProfile - User object:', user);
    console.log('🔍 UserProfile - Profile photo:', user?.profilePhoto);
    console.log(
      '🔍 UserProfile - Backend URL:',
      import.meta.env.VITE_BACKEND_URL
    );
    if (user?.profilePhoto) {
      console.log(
        '🔍 UserProfile - Full image URL:',
        `${import.meta.env.VITE_BACKEND_URL}${user.profilePhoto}`
      );
    }
  }, [user]);

  // ✅ ADD THIS MISSING useEffect TO FETCH DATA
  useEffect(() => {
    console.log('🔄 UserProfile useEffect triggered, user available:', !!user);
    if (user) {
      console.log('🔄 User found, calling fetchUserStats...');
      fetchUserStats();
    } else {
      console.log('⚠️ No user available yet...');
    }
  }, [user]);
  const fetchUserStats = async () => {
    try {
      console.log('🔄 fetchUserStats: Starting...'); // ADD THIS
      setLoading(true);

      console.log('🔄 fetchUserStats: Making API call to /users/profile/stats'); // ADD THIS
      const response = await api.get('/users/profile/stats');
      console.log('✅ fetchUserStats: API response received:', response.data); // ADD THIS

      setProfileStats(response.data.data);
      console.log('✅ fetchUserStats: Profile stats set'); // ADD THIS

      // Fetch AI insights after getting stats
      console.log('🔄 fetchUserStats: Fetching AI insights...'); // ADD THIS
      await fetchAIInsights();
      console.log('✅ fetchUserStats: AI insights completed'); // ADD THIS
    } catch (error) {
      console.error('❌ fetchUserStats: Error occurred:', error); // ADD THIS
      console.log('🔄 fetchUserStats: Falling back to fetchTicketStats...'); // ADD THIS

      // Fallback with real data from tickets API
      const fallbackStats = await fetchTicketStats();
      console.log('✅ fetchUserStats: Fallback stats:', fallbackStats); // ADD THIS

      setProfileStats(fallbackStats);

      console.log('🔄 fetchUserStats: Fetching AI insights (fallback)...'); // ADD THIS
      await fetchAIInsights();
      console.log('✅ fetchUserStats: AI insights completed (fallback)'); // ADD THIS
    } finally {
      console.log('🔄 fetchUserStats: Setting loading to false'); // ADD THIS
      setLoading(false);
      console.log('✅ fetchUserStats: Completed'); // ADD THIS
    }
  };

  const fetchTicketStats = async () => {
    try {
      console.log('🔄 fetchTicketStats: Starting fallback stats...'); // ADD THIS
      const userId = user?.id || user?._id;
      console.log('🔄 fetchTicketStats: Using userId:', userId); // ADD THIS

      const [totalRes, openRes, resolvedRes] = await Promise.all([
        api.get(`/tickets/count?user=${userId}`),
        api.get(`/tickets/count?user=${userId}&status=open`),
        api.get(`/tickets/count?user=${userId}&status=resolved`),
      ]);

      const totalTickets = totalRes.data.count || 0;
      const openTickets = openRes.data.count || 0;
      const resolvedTickets = resolvedRes.data.count || 0;

      console.log('✅ fetchTicketStats: Ticket counts -', {
        // ADD THIS
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
      });

      const stats = {
        totalTicketsCreated: totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime: '2.3 hours',
        favoriteCategories: [
          { category: 'Technical', count: Math.ceil(totalTickets * 0.6) },
          { category: 'General', count: Math.ceil(totalTickets * 0.4) },
        ],
        recentActivity: [],
        monthlyTickets: totalTickets,
        resolutionRate:
          totalTickets > 0
            ? Math.round((resolvedTickets / totalTickets) * 100)
            : 0,
      };

      console.log('✅ fetchTicketStats: Final stats object:', stats); // ADD THIS
      return stats;
    } catch (error) {
      console.error('❌ fetchTicketStats: Fallback error:', error); // ADD THIS
      return {
        totalTicketsCreated: 0,
        openTickets: 0,
        resolvedTickets: 0,
        avgResponseTime: '0h',
        favoriteCategories: [],
        recentActivity: [],
        monthlyTickets: 0,
        resolutionRate: 0,
      };
    }
  };

  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    try {
      console.log('🔄 fetchAIInsights: Starting...'); // ADD THIS
      const response = await api.post('/ai/insights/profile');
      console.log('✅ fetchAIInsights: API response:', response.data); // ADD THIS

      if (response.data.success) {
        setAiInsights(response.data.insights || []);
        console.log(
          '✅ fetchAIInsights: Insights set:',
          response.data.insights?.length || 0,
          'insights'
        ); // ADD THIS
      }
    } catch (error) {
      console.error('❌ fetchAIInsights: Error:', error); // ADD THIS
      console.log('🔄 fetchAIInsights: Generating fallback insights...'); // ADD THIS

      // Generate fallback insights based on profile stats
      if (profileStats) {
        const fallbackInsights = generateProfileInsights(profileStats);
        console.log(
          '✅ fetchAIInsights: Fallback insights generated:',
          fallbackInsights.length
        ); // ADD THIS
        setAiInsights(fallbackInsights);
      }
    } finally {
      console.log('🔄 fetchAIInsights: Setting insights loading to false'); // ADD THIS
      setInsightsLoading(false);
      console.log('✅ fetchAIInsights: Completed'); // ADD THIS
    }
  };

  const generateProfileInsights = (stats: UserProfileStats): AIInsight[] => {
    const insights: AIInsight[] = [];

    // Resolution rate insight
    if (stats.totalTicketsCreated > 0) {
      insights.push({
        id: 'resolution-performance',
        type: 'trend',
        title: `${stats.resolutionRate}% Resolution Rate`,
        description: `You have successfully resolved ${
          stats.resolvedTickets
        } out of ${stats.totalTicketsCreated} tickets. ${
          stats.resolutionRate >= 80
            ? 'Excellent track record!'
            : stats.resolutionRate >= 60
            ? 'Good progress, keep it up!'
            : 'Consider providing more detailed information in your tickets.'
        }`,
        confidence: 0.9,
        actionable: stats.resolutionRate < 80,
        priority: stats.resolutionRate < 50 ? 'high' : 'medium',
        suggestion:
          stats.resolutionRate < 80
            ? 'Include more context and screenshots when creating tickets for faster resolution.'
            : undefined,
      });
    }

    // Open tickets insight
    if (stats.openTickets > 0) {
      insights.push({
        id: 'pending-tickets',
        type: 'alert',
        title: `${stats.openTickets} Open Tickets Pending`,
        description: `You currently have ${stats.openTickets} tickets awaiting response. These require attention from the support team.`,
        confidence: 0.95,
        actionable: true,
        priority: stats.openTickets > 3 ? 'high' : 'medium',
        suggestion:
          'Monitor your open tickets and provide additional information if requested by support.',
      });
    }

    // Activity insight
    if (stats.totalTicketsCreated >= 5) {
      insights.push({
        id: 'activity-pattern',
        type: 'recommendation',
        title: 'Active User Profile',
        description: `You've created ${
          stats.totalTicketsCreated
        } tickets, showing good engagement with the support system. Your most common category is ${
          stats.favoriteCategories[0]?.category || 'Technical'
        }.`,
        confidence: 0.85,
        actionable: false,
        priority: 'low',
        suggestion:
          'Continue documenting issues clearly to maintain good resolution rates.',
      });
    }

    // New user insight
    if (stats.totalTicketsCreated === 0) {
      insights.push({
        id: 'new-user-guide',
        type: 'recommendation',
        title: 'Welcome to Support System',
        description:
          'Get started by creating your first support ticket. Our AI system will help analyze and route your requests efficiently.',
        confidence: 0.95,
        actionable: true,
        priority: 'medium',
        suggestion:
          'Create a test ticket to familiarize yourself with the system.',
      });
    }

    return insights;
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      console.log('🔄 Uploading photo...'); // DEBUG LOG

      const response = await api.post('/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📸 Upload response:', response.data); // DEBUG LOG

      if (response.data.success) {
        toast.success('Profile photo updated successfully!');

        // ✅ SIMPLE FIX: Just reload the page
        console.log('🔄 Reloading page to show new photo...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Photo upload failed:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to upload photo';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return ArrowTrendingUpIcon;
      case 'recommendation':
        return SparklesIcon;
      case 'alert':
        return ExclamationCircleIcon;
      case 'prediction':
        return TrophyIcon;
      default:
        return SparklesIcon;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'recommendation':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'alert':
        return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'prediction':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserCircleIcon },
    { id: 'tickets', name: 'My Tickets', icon: TicketIcon },
    { id: 'insights', name: 'AI Insights', icon: SparklesIcon },
    { id: 'activity', name: 'Recent Activity', icon: ChartBarIcon },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg mb-6"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white"
      >
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold overflow-hidden">
              {/* {user?.profilePhoto ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    user.profilePhoto
                  }`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )} */}
              {user?.profilePhoto ? (
                <img
                  src={`${
                    import.meta.env.VITE_BACKEND_URL
                  }/api/image/${user.profilePhoto
                    .split('/')
                    .pop()}?t=${Date.now()}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                  onLoad={() =>
                    console.log('✅ Profile image loaded successfully')
                  }
                  onError={(e) => {
                    console.error(
                      '❌ Profile image failed to load:',
                      e.currentTarget.src
                    );
                    // Hide the broken image and show the initial instead
                    e.currentTarget.style.display = 'none';
                    // Find the parent div and show the text initial
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">${
                        user?.name?.charAt(0)?.toUpperCase() || 'U'
                      }</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <CameraIcon
                className={`h-4 w-4 ${uploading ? 'animate-spin' : ''}`}
              />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {user?.name || 'User Profile'}
            </h1>
            <p className="text-blue-100 mt-1">{user?.email}</p>
            <div className="flex items-center space-x-4 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {profileStats?.resolutionRate || 0}% Resolution Rate
              </span>
              <div className="flex items-center space-x-1">
                <TicketIcon className="h-4 w-4" />
                <span className="text-sm">
                  {profileStats?.totalTicketsCreated || 0} tickets created
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm">
                  Member since{' '}
                  {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
                {tab.id === 'insights' && aiInsights.length > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs px-2 py-1 rounded-full">
                    {aiInsights.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Total Tickets Created */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Tickets Created
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {profileStats?.totalTicketsCreated || 0}
                    </p>
                  </div>
                  <TicketIcon className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  All time
                </p>
              </div>

              {/* Open Tickets */}
              <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Open Tickets
                    </p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {profileStats?.openTickets || 0}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  Awaiting response
                </p>
              </div>

              {/* Resolved Tickets */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Resolved Tickets
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {profileStats?.resolvedTickets || 0}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {profileStats?.resolutionRate || 0}% success rate
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'tickets' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ticket Categories
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileStats?.favoriteCategories.map((category, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.count} tickets
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (category.count /
                                (profileStats?.totalTicketsCreated || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profileStats?.avgResponseTime || '0h'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Response Time
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profileStats?.monthlyTickets || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This Month
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profileStats?.resolutionRate || 0}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resolution Rate
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.max(
                        0,
                        (profileStats?.totalTicketsCreated || 0) -
                          (profileStats?.openTickets || 0) -
                          (profileStats?.resolvedTickets || 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      In Progress
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI-Powered Insights
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Personalized recommendations based on your ticket history
                  </p>
                </div>
                <button
                  onClick={fetchAIInsights}
                  disabled={insightsLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon
                    className={`h-4 w-4 mr-2 ${
                      insightsLoading ? 'animate-spin' : ''
                    }`}
                  />
                  Refresh Insights
                </button>
              </div>

              {insightsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"
                    ></div>
                  ))}
                </div>
              ) : aiInsights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.map((insight) => {
                    const Icon = getInsightIcon(insight.type);
                    return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-lg border-2 ${
                          insight.priority === 'high'
                            ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                            : insight.priority === 'medium'
                            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`p-3 rounded-full ${getInsightColor(
                              insight.type
                            )}`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                {insight.title}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  insight.priority === 'high'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                    : insight.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {insight.priority}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                              {insight.description}
                            </p>
                            {insight.suggestion && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-400">
                                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                  💡 Suggestion: {insight.suggestion}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-4">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Confidence:{' '}
                                {Math.round(insight.confidence * 100)}%
                              </span>
                              {insight.actionable && (
                                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                                  Actionable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Insights Available Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create some tickets to get personalized AI insights about
                    your support patterns.
                  </p>
                  <button
                    onClick={fetchAIInsights}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Generate Insights
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Activity tracking coming soon. Your ticket interactions will
                  be displayed here.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;