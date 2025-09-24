import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  attachments: string[];
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
    };
    message: string;
    createdAt: string;
  }>;
}

interface TicketState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status: string[];
    priority: string[];
    category: string[];
    assignedTo: string[];
    search: string;
    dateRange: {
      start?: string;
      end?: string;
    };
  };
}

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    status: [],
    priority: [],
    category: [],
    assignedTo: [],
    search: '',
    dateRange: {},
  },
};

// Async thunks
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params?: {
    page?: number;
    limit?: number;
    status?: string[];
    priority?: string[];
    search?: string;
  }) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId: string) => {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data;
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: Partial<Ticket>) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({
    ticketId,
    updates,
  }: {
    ticketId: string;
    updates: Partial<Ticket>;
  }) => {
    const response = await api.put(`/tickets/${ticketId}`, updates);
    return response.data;
  }
);

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateTicketStatus',
  async ({ ticketId, status }: { ticketId: string; status: string }) => {
    const response = await api.patch(`/tickets/${ticketId}/status`, { status });
    return response.data;
  }
);

export const assignTicket = createAsyncThunk(
  'tickets/assignTicket',
  async ({
    ticketId,
    assignedTo,
  }: {
    ticketId: string;
    assignedTo: string;
  }) => {
    const response = await api.patch(`/tickets/${ticketId}/assign`, {
      assignedTo,
    });
    return response.data;
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId: string) => {
    await api.delete(`/tickets/${ticketId}`);
    return ticketId;
  }
);

export const addComment = createAsyncThunk(
  'tickets/addComment',
  async ({ ticketId, message }: { ticketId: string; message: string }) => {
    const response = await api.post(`/tickets/${ticketId}/comments`, {
      message,
    });
    return response.data;
  }
);

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<TicketState['filters']>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.currentTicket = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<Partial<TicketState['pagination']>>
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
      })

      // Fetch single ticket
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ticket';
      })

      // Create ticket
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload);
      })

      // Update ticket
      .addCase(updateTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(
          (ticket) => ticket._id === action.payload._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload;
        }
      })

      // Update ticket status
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(
          (ticket) => ticket._id === action.payload._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload;
        }
      })

      // Delete ticket
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter(
          (ticket) => ticket._id !== action.payload
        );
        if (state.currentTicket?._id === action.payload) {
          state.currentTicket = null;
        }
      })

      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(
          (ticket) => ticket._id === action.payload._id
        );
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload;
        }
      });
  },
});

export const { setFilters, clearFilters, setCurrentTicket, setPagination } =
  ticketSlice.actions;
export default ticketSlice.reducer;
