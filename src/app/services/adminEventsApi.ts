import { API_BASE_URL, getHeaders } from '../config';
import type { ApiResponse, Event } from '../types';

export const adminEventsApi = {
  // Get all events (admin)
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<{ events: Event[]; pagination: any }>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${API_BASE_URL}/admin/events?${queryParams.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Fetch events error:', error);
      return { success: false, message: 'Failed to fetch events' };
    }
  },

  // Get single event
  getById: async (id: number): Promise<ApiResponse<Event>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Fetch event detail error:', error);
      return { success: false, message: 'Failed to fetch event detail' };
    }
  },

  // Create event
  create: async (data: Partial<Event>): Promise<ApiResponse<Event>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Create event error:', error);
      return { success: false, message: 'Failed to create event' };
    }
  },

  // Update event
  update: async (id: number, data: Partial<Event>): Promise<ApiResponse<Event>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Update event error:', error);
      return { success: false, message: 'Failed to update event' };
    }
  },

  // Delete event
  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Delete event error:', error);
      return { success: false, message: 'Failed to delete event' };
    }
  },
  
  // Update Status
  updateStatus: async (id: number, status: string): Promise<ApiResponse<Event>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/events/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return await response.json();
    } catch (error) {
       console.error('Update status error:', error);
       return { success: false, message: 'Failed to update status' };
    }
  }
};
