import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'MMM dd, yyyy') : 'Invalid date';
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj)
      ? format(dateObj, 'MMM dd, yyyy HH:mm')
      : 'Invalid date';
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj)
      ? formatDistanceToNow(dateObj, { addSuffix: true })
      : 'Unknown time';
  } catch (error) {
    return 'Unknown time';
  }
};
