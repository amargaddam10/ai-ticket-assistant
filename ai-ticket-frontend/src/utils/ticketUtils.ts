export const getPriorityColor = (priority: string): string => {
  const colors = {
    low: '#10b981', // green
    medium: '#f59e0b', // yellow
    high: '#f97316', // orange
    urgent: '#ef4444', // red
  };
  return colors[priority as keyof typeof colors] || colors.medium;
};

export const getStatusColor = (status: string): string => {
  const colors = {
    open: '#6b7280', // gray
    'in-progress': '#3b82f6', // blue
    resolved: '#10b981', // green
    closed: '#6b7280', // gray
    escalated: '#ef4444', // red
  };
  return colors[status as keyof typeof colors] || colors.open;
};

export const getPriorityBadgeClass = (priority: string): string => {
  const classes = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return classes[priority as keyof typeof classes] || classes.medium;
};

export const getStatusBadgeClass = (status: string): string => {
  const classes = {
    open: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    'in-progress':
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    resolved:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    escalated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return classes[status as keyof typeof classes] || classes.open;
};
