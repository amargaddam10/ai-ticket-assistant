import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserGroupIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../store/store';
import { fetchAnalytics } from '../store/slices/analyticsSlice';

interface AnalyticsData {
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    slaCompliance: number;
  };
  trends: {
    ticketVolume: Array<{ date: string; count: number }>;
    resolutionTimes: Array<{ date: string; avgTime: number }>;
    categories: Array<{ name: string; count: number; percentage: number }>;
    priorities: Array<{ level: string; count: number; percentage: number }>;
  };
  performance: {
    topAgents: Array<{
      id: string;
      name: string;
      resolvedTickets: number;
      avgResolutionTime: number;
      satisfaction: number;
    }>;
    slaBreaches: Array<{
      ticketId: string;
      title: string;
      daysOverdue: number;
      priority: string;
    }>;
  };
}

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock data for now
        const mockData: AnalyticsData = {
          overview: {
            totalTickets: 1247,
            openTickets: 89,
            resolvedTickets: 1158,
            avgResolutionTime: 2.4,
            customerSatisfaction: 4.3,
            slaCompliance: 94.2,
          },
          trends: {
            ticketVolume: [
              { date: '2024-01-01', count: 45 },
              { date: '2024-01-02', count: 52 },
              { date: '2024-01-03', count: 38 },
              { date: '2024-01-04', count: 61 },
              { date: '2024-01-05', count: 43 },
              { date: '2024-01-06', count: 55 },
              { date: '2024-01-07', count: 49 },
            ],
            resolutionTimes: [
              { date: '2024-01-01', avgTime: 2.1 },
              { date: '2024-01-02', avgTime: 2.8 },
              { date: '2024-01-03', avgTime: 1.9 },
              { date: '2024-01-04', avgTime: 3.2 },
              { date: '2024-01-05', avgTime: 2.4 },
            ],
            categories: [
              { name: 'Technical', count: 450, percentage: 36 },
              { name: 'Billing', count: 312, percentage: 25 },
              { name: 'General', count: 285, percentage: 23 },
              { name: 'Feature Request', count: 200, percentage: 16 },
            ],
            priorities: [
              { level: 'Low', count: 523, percentage: 42 },
              { level: 'Medium', count: 374, percentage: 30 },
              { level: 'High', count: 250, percentage: 20 },
              { level: 'Urgent', count: 100, percentage: 8 },
            ],
          },
          performance: {
            topAgents: [
              {
                id: '1',
                name: 'John Doe',
                resolvedTickets: 89,
                avgResolutionTime: 1.8,
                satisfaction: 4.7,
              },
              {
                id: '2',
                name: 'Jane Smith',
                resolvedTickets: 76,
                avgResolutionTime: 2.1,
                satisfaction: 4.5,
              },
              {
                id: '3',
                name: 'Mike Johnson',
                resolvedTickets: 64,
                avgResolutionTime: 2.3,
                satisfaction: 4.4,
              },
            ],
            slaBreaches: [
              {
                ticketId: 'T-001',
                title: 'System downtime issue',
                daysOverdue: 3,
                priority: 'urgent',
              },
              {
                ticketId: 'T-002',
                title: 'Payment processing error',
                daysOverdue: 1,
                priority: 'high',
              },
            ],
          },
        };
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <div
              className={`flex items-center mt-2 text-sm ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change > 0 ? (
                <ChevronUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}% from last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive insights into your ticket management performance
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tickets"
          value={data.overview.totalTickets.toLocaleString()}
          change={12}
          icon={TicketIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Open Tickets"
          value={data.overview.openTickets}
          change={-8}
          icon={ExclamationTriangleIcon}
          color="bg-orange-500"
        />
        <StatCard
          title="Resolved Tickets"
          value={data.overview.resolvedTickets.toLocaleString()}
          change={15}
          icon={CheckCircleIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${data.overview.avgResolutionTime} days`}
          change={-5}
          icon={ClockIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ticket Volume Trend
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.trends.ticketVolume.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                  style={{
                    height: `${
                      (item.count /
                        Math.max(
                          ...data.trends.ticketVolume.map((d) => d.count)
                        )) *
                      200
                    }px`,
                  }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(item.date).getDate()}
                </span>
                <span className="text-xs text-gray-900 dark:text-white font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Customer Satisfaction
              </span>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (data.overview.customerSatisfaction / 5) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.overview.customerSatisfaction}/5
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                SLA Compliance
              </span>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.overview.slaCompliance}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.overview.slaCompliance}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Categories and Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tickets by Category
          </h3>
          <div className="space-y-3">
            {data.trends.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className="text-sm text-gray-900 dark:text-white w-24">
                    {category.name}
                  </span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.count} ({category.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tickets by Priority
          </h3>
          <div className="space-y-3">
            {data.trends.priorities.map((priority, index) => {
              const colors = {
                Low: 'bg-green-500',
                Medium: 'bg-yellow-500',
                High: 'bg-orange-500',
                Urgent: 'bg-red-500',
              };

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-sm text-gray-900 dark:text-white w-16">
                      {priority.level}
                    </span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            colors[priority.level as keyof typeof colors]
                          }`}
                          style={{ width: `${priority.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {priority.count} ({priority.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Top Performers and SLA Breaches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Agents
          </h3>
          <div className="space-y-4">
            {data.performance.topAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {agent.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {agent.resolvedTickets} tickets •{' '}
                      {agent.avgResolutionTime} days avg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {agent.satisfaction}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      /5
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            SLA Breaches
          </h3>
          {data.performance.slaBreaches.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No SLA breaches found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.performance.slaBreaches.map((breach, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {breach.ticketId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {breach.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          breach.priority === 'urgent'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400'
                        }`}
                      >
                        {breach.priority}
                      </span>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {breach.daysOverdue} days overdue
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
