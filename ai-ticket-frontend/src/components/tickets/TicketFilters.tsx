import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { DatePicker } from '@/components/ui/DatePicker';

interface FilterOptions {
  status: string[];
  priority: string[];
  category: string[];
  assignedTo: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  search: string;
  tags: string[];
}

interface TicketFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories?: string[];
  users?: Array<{ _id: string; name: string }>;
  tags?: string[];
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onFiltersChange,
  categories = [],
  users = [],
  tags = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const statusOptions = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
    {
      value: 'in-progress',
      label: 'In Progress',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 'resolved',
      label: 'Resolved',
      color: 'bg-green-100 text-green-800',
    },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    {
      value: 'medium',
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-800',
    },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterToggle = (key: keyof FilterOptions, value: string) => {
    const currentArray = localFilters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    handleFilterChange(key, newArray);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: [],
      priority: [],
      category: [],
      assignedTo: [],
      dateRange: {},
      search: '',
      tags: [],
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount =
    localFilters.status.length +
    localFilters.priority.length +
    localFilters.category.length +
    localFilters.assignedTo.length +
    localFilters.tags.length +
    (localFilters.search ? 1 : 0) +
    (localFilters.dateRange.start || localFilters.dateRange.end ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleArrayFilterToggle('status', option.value)
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        localFilters.status.includes(option.value)
                          ? `${option.color} border-current`
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleArrayFilterToggle('priority', option.value)
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        localFilters.priority.includes(option.value)
                          ? `${option.color} border-current`
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() =>
                          handleArrayFilterToggle('category', category)
                        }
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                          localFilters.category.includes(category)
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned To Filter */}
              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned To
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <label key={user._id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localFilters.assignedTo.includes(user._id)}
                          onChange={() =>
                            handleArrayFilterToggle('assignedTo', user._id)
                          }
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {user.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={
                        localFilters.dateRange.start
                          ? localFilters.dateRange.start
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        handleFilterChange('dateRange', {
                          ...localFilters.dateRange,
                          start: e.target.value
                            ? new Date(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={
                        localFilters.dateRange.end
                          ? localFilters.dateRange.end
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        handleFilterChange('dateRange', {
                          ...localFilters.dateRange,
                          end: e.target.value
                            ? new Date(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tags Filter */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleArrayFilterToggle('tags', tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                          localFilters.tags.includes(tag)
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketFilters;
