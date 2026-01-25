import { API_BASE_URL, getHeaders } from '../config';
import type { User, ApiResponse } from '../types';

interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
}

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Gagal terhubung ke server' };
    }
  },
  
  register: async (name: string, email: string, phone: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          password,
          password_confirmation: password 
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Gagal terhubung ke server' };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  },

  updateProfile: async (data: { name?: string; email?: string; phone?: string; password?: string; password_confirmation?: string }): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Gagal mengirim permintaan reset password' };
    }
  },

  resetPassword: async (data: { email: string; token: string; password: string; password_confirmation: string }): Promise<ApiResponse<null>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            email: data.email,
            token: data.token,
            password: data.password,
            password_confirm: data.password_confirmation 
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Gagal mereset password' };
    }
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, message: 'Failed to fetch user' };
    }
  }
};
