import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'moderator';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      skills?: string[];
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  token: string;
}

export interface ProfileUpdateData {
  name?: string;
  skills?: string[];
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService login attempt for:', credentials.email);
      const response = await api.post('/auth/login', credentials);
      console.log('✅ AuthService login response:', response.data?.success);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService login error:', error);
      throw error;
    }
  },

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 AuthService register attempt for:', data.email);
      const response = await api.post('/auth/register', data);
      console.log('✅ AuthService register response:', response.data?.success);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService register error:', error);
      throw error;
    }
  },

  // Get current user profile
  async getProfile(): Promise<{ success: boolean; data: { user: any } }> {
    try {
      console.log('👤 AuthService fetching profile');
      const response = await api.get('/auth/me');
      console.log(
        '✅ AuthService profile response:',
        !!response.data?.data?.user
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService profile error:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(
    data: ProfileUpdateData
  ): Promise<{ success: boolean; data: { user: any } }> {
    try {
      console.log('📝 AuthService updating profile');
      const response = await api.put('/auth/profile', data);
      console.log(
        '✅ AuthService profile update response:',
        response.data?.success
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService profile update error:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(
    data: PasswordChangeData
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔒 AuthService changing password');
      const response = await api.put('/auth/change-password', data);
      console.log(
        '✅ AuthService password change response:',
        response.data?.success
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService password change error:', error);
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚪 AuthService logout');
      const response = await api.post('/auth/logout');
      console.log('✅ AuthService logout response:', response.data?.success);
      return response.data;
    } catch (error: any) {
      console.log(
        '⚠️ AuthService logout error (this is okay):',
        error?.message
      );
      // Return success even if API call fails
      return { success: true, message: 'Logged out locally' };
    }
  },

  // Refresh token (if implemented)
  async refreshToken(): Promise<AuthResponse> {
    try {
      console.log('🔄 AuthService refreshing token');
      const response = await api.post('/auth/refresh');
      console.log(
        '✅ AuthService token refresh response:',
        response.data?.success
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService token refresh error:', error);
      throw error;
    }
  },

  // Forgot password
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 AuthService forgot password for:', email);
      const response = await api.post('/auth/forgot-password', { email });
      console.log(
        '✅ AuthService forgot password response:',
        response.data?.success
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(
    token: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔑 AuthService reset password');
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });
      console.log(
        '✅ AuthService reset password response:',
        response.data?.success
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService reset password error:', error);
      throw error;
    }
  },
};

export default authService;
