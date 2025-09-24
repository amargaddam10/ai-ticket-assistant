import { apiClient } from './apiClient';

export interface User {
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

export interface Ticket {
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

export interface AdminStats {
  totalUsers: number;
  totalModerators: number;
  totalAdmins: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers?: number;
      totalTickets?: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface TicketOverviewResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    summary: {
      totalTickets: number;
      openTickets: number;
      inProgressTickets: number;
      resolvedTickets: number;
      closedTickets: number;
      escalatedTickets: number;
      urgentTickets: number;
      highPriorityTickets: number;
      unassignedTickets: number;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTickets: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface UserOverviewResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

class AdminService {
  // User Management
  async getAllUsers(filters: UserFilters = {}): Promise<UserOverviewResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.isActive && filters.isActive !== 'all') params.append('isActive', filters.isActive);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/users/admin/all-users?${params}`);
    return response.data;
  }

  async updateUserRole(userId: string, role: string): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await apiClient.put(`/users/admin/${userId}/role`, { role });
    return response.data;
  }

  async updateUserSkills(userId: string, skills: string[]): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await apiClient.put(`/users/admin/${userId}/skills`, { skills });
    return response.data;
  }

  async promoteToModerator(userId: string, initialSkills: string[] = []): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await apiClient.post('/users/promote-to-moderator', { 
      userId, 
      initialSkills 
    });
    return response.data;
  }

  async activateUser(userId: string, isActive: boolean): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await apiClient.post(`/users/${userId}/activate`, { isActive });
    return response.data;
  }

  // Ticket Management
  async getTicketOverview(filters: TicketFilters = {}): Promise<TicketOverviewResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.assignedTo && filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/tickets/admin/overview?${params}`);
    return response.data;
  }

  async getTicketAnalytics(period: number = 30): Promise<{
    success: boolean;
    data: {
      analytics: {
        totalTickets: number;
        avgResolutionTime: number;
        slaBreaches: number;
        byStatus: Array<{ status: string; count: number }>;
        byPriority: Array<{ priority: string; count: number }>;
        byType: Array<{ type: string; count: number }>;
      };
      dailyTrends: Array<{
        _id: string;
        created: number;
        resolved: number;
      }>;
      moderatorPerformance: Array<{
        _id: string;
        moderatorName: string;
        moderatorEmail: string;
        totalAssigned: number;
        resolved: number;
        avgResolutionTime: number;
        slaBreaches: number;
        resolutionRate: number;
      }>;
      period: string;
    };
  }> {
    const response = await apiClient.get(`/tickets/admin/analytics?period=${period}`);
    return response.data;
  }

  // Moderator Management
  async getModerators(filters: {
    search?: string;
    skills?: string[];
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data: {
      moderators: Array<User & {
        stats: {
          assignedTickets: number;
          completedTickets: number;
          totalHandled: number;
        };
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalModerators: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.skills) filters.skills.forEach(skill => params.append('skills', skill));
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/users/moderators?${params}`);
    return response.data;
  }

  async searchModeratorsBySkills(skills: string[], excludeAssigned: boolean = false): Promise<{
    success: boolean;
    data: {
      moderators: Array<{
        _id: string;
        name: string;
        email: string;
        skills: string[];
        matchingSkills: string[];
        matchScore: number;
        lastLogin?: string;
      }>;
      searchCriteria: {
        skills: string[];
        excludeAssigned: boolean;
      };
    };
  }> {
    const params = new URLSearchParams();
    skills.forEach(skill => params.append('skills', skill));
    if (excludeAssigned) params.append('excludeAssigned', 'true');

    const response = await apiClient.get(`/users/search-moderators?${params}`);
    return response.data;
  }

  async getModeratorWorkloadReport(period: number = 30): Promise<{
    success: boolean;
    data: {
      moderators: Array<{
        name: string;
        email: string;
        skills: string[];
        currentLoad: number;
        completedCount: number;
        totalAssigned: number;
        avgResolutionTime: number;
        lastLogin?: string;
        efficiency: number;
      }>;
      summary: {
        totalModerators: number;
        avgCurrentLoad: number;
        avgEfficiency: number;
        avgResolutionTime: number;
        period: string;
      };
    };
  }> {
    const response = await apiClient.get(`/users/workload-report?period=${period}`);
    return response.data;
  }

  // Skills Management
  async getAvailableSkills(): Promise<{
    success: boolean;
    data: {
      skills: Array<{
        skill: string;
        count: number;
        moderators: Array<{
          name: string;
          email: string;
          _id: string;
        }>;
      }>;
      totalSkills: number;
    };
  }> {
    const response = await apiClient.get('/users/skills/available');
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
