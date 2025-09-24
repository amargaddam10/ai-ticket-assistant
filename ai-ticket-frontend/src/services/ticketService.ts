import { apiClient } from './apiClient';

// ✅ Get a list of tickets with filters, sorting, pagination
const getTickets = async ({
  filters,
  sort,
  page,
  limit,
}: {
  filters?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v as any));
        } else {
          params.set(key, String(value));
        }
      }
    });
  }

  if (sort) {
    params.set('sortBy', sort.field);
    params.set('sortDir', sort.direction);
  }

  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));

  const response = await apiClient.get(`/tickets?${params.toString()}`);
  return response.data;
};

// Get a single ticket by ID
const getTicketById = async (id: string) => {
  const response = await apiClient.get(`/tickets/${id}`);
  return response.data;
};

// Create a new ticket
const createTicket = async (ticketData: any) => {
  const response = await apiClient.post('/tickets/create', ticketData);
  return response.data;
};

// Bulk actions on tickets
const bulkAction = async (action: string, ticketIds: string[], data?: any) => {
  const response = await apiClient.post('/tickets/bulk', {
    action,
    ticketIds,
    data,
  });
  return response.data;
};

export const ticketService = {
  getTickets,
  getTicketById,
  createTicket,
  bulkAction,
};
