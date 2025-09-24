import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentChartBarIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  FunnelIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'sla' | 'customer' | 'agent';
  lastGenerated: string;
  status: 'ready' | 'generating' | 'scheduled';
  size?: string;
}

interface ReportFilter {
  dateRange: {
    start: Date;
    end: Date;
    preset: string;
  };
  categories: string[];
  priorities: string[];
  agents: string[];
  status: string[];
}

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: {
      start: subDays(new Date(), 30),
      end: new Date(),
      preset: '30d',
    },
    categories: [],
    priorities: [],
    agents: [],
    status: [],
  });

  const reports: Report[] = [
    {
      id: '1',
      name: 'Monthly Performance Report',
      description:
        'Comprehensive analysis of ticket resolution metrics, agent performance, and SLA compliance',
      type: 'performance',
      lastGenerated: '2024-01-15T10:30:00Z',
      status: 'ready',
      size: '2.4 MB',
    },
    {
      id: '2',
      name: 'SLA Compliance Report',
      description:
        'Detailed breakdown of SLA adherence, breaches, and trend analysis',
      type: 'sla',
      lastGenerated: '2024-01-14T14:22:00Z',
      status: 'ready',
      size: '1.8 MB',
    },
    {
      id: '3',
      name: 'Customer Satisfaction Report',
      description:
        'Analysis of customer feedback, ratings, and satisfaction trends',
      type: 'customer',
      lastGenerated: '2024-01-13T09:15:00Z',
      status: 'generating',
    },
    {
      id: '4',
      name: 'Agent Performance Report',
      description:
        'Individual and team performance metrics, workload distribution, and efficiency analysis',
      type: 'agent',
      lastGenerated: '2024-01-12T16:45:00Z',
      status: 'scheduled',
      size: '3.1 MB',
    },
    {
      id: '5',
      name: 'Category Analysis Report',
      description:
        'Breakdown of tickets by category, trending issues, and resolution patterns',
      type: 'performance',
      lastGenerated: '2024-01-11T11:20:00Z',
      status: 'ready',
      size: '1.2 MB',
    },
  ];

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-100 text-blue-800';
      case 'sla':
        return 'bg-red-100 text-red-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'agent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setGenerating(reportId);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(null);
    }, 3000);
  };

  const handleDateRangeChange = (preset: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case '7d':
        start = subDays(today, 7);
        break;
      case '30d':
        start = subDays(today, 30);
        break;
      case '90d':
        start = subDays(today, 90);
        break;
      case 'thisWeek':
        start = startOfWeek(today);
        end = endOfWeek(today);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        start = subDays(today, 30);
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end, preset },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate and download detailed analytics reports
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Report Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange.preset}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="thisWeek">This week</option>
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categories
              </label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option>Technical</option>
                <option>Billing</option>
                <option>General</option>
                <option>Feature Request</option>
              </select>
            </div>

            {/* Priorities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priorities
              </label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selected range: {format(filters.dateRange.start, 'MMM dd, yyyy')}{' '}
              - {format(filters.dateRange.end, 'MMM dd, yyyy')}
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Reports
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Daily Summary', description: "Today's ticket activity" },
            { name: 'Weekly Overview', description: "This week's performance" },
            { name: 'Agent Workload', description: 'Current assignments' },
            { name: 'SLA Status', description: 'Active SLA monitoring' },
          ].map((quickReport, index) => (
            <button
              key={index}
              className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
            >
              <h4 className="font-medium text-gray-900 dark:text-white">
                {quickReport.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {quickReport.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Available Reports
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {reports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <DocumentChartBarIcon className="h-8 w-8 text-gray-400" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {report.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReportTypeColor(
                            report.type
                          )}`}
                        >
                          {report.type}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                        {report.size && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {report.size}
                          </span>
                        )}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Last generated:{' '}
                          {format(
                            new Date(report.lastGenerated),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {report.status === 'ready' && (
                    <>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Preview report"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Download report"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={
                      generating === report.id || report.status === 'generating'
                    }
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                      generating === report.id || report.status === 'generating'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                    }`}
                  >
                    {generating === report.id ||
                    report.status === 'generating' ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Scheduled Reports
          </h3>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Create Schedule
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Weekly Performance Report
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Every Monday at 9:00 AM
              </p>
            </div>
            <span className="text-sm text-green-600">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Monthly SLA Report
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                First day of each month at 8:00 AM
              </p>
            </div>
            <span className="text-sm text-green-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
