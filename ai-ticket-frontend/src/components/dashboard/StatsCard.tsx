import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  loading?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false,
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      icon: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'from-green-500 to-green-600',
      icon: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      icon: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    red: {
      bg: 'from-red-500 to-red-600',
      icon: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      icon: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    indigo: {
      bg: 'from-indigo-500 to-indigo-600',
      icon: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  };

  const styles = colorStyles[color];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-xl ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${styles.icon}`}>
            <Icon className={`h-6 w-6 ${styles.iconColor}`} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div
              className={`flex items-center text-sm font-medium ${
                trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : trend.value === 0
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend.value > 0 ? (
                <ChevronUpIcon className="h-4 w-4 mr-1" />
              ) : trend.value < 0 ? (
                <ChevronDownIcon className="h-4 w-4 mr-1" />
              ) : (
                <MinusIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}

        {trend?.label && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {trend.label}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
