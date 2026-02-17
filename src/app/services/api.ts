import { API_BASE_URL, getHeaders } from '../config';
import type {
  ApiResponse,
  PaginatedResponse,
  Event,
  Category,
  Order,
  Ticket,
  CheckoutRequest,
} from '../types';

// Real API Service
const api = {
  events: {
    getAll: async (params?: any): Promise<PaginatedResponse<Event, 'events'>> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page);
        if (params?.limit) queryParams.append('limit', params.limit);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured) queryParams.append('featured', 'true');

        const response = await fetch(`${API_BASE_URL}/events?${queryParams.toString()}`, {
          headers: getHeaders(),
        });
        
        return await response.json();
      } catch (error) {
        console.error('Get all events error:', error);
        throw error;
      }
    },

    getFeatured: async (): Promise<ApiResponse<Event[]>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/featured`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    getById: async (id: number | string): Promise<ApiResponse<Event>> => {
      try {
        // In real backend usually by slug or id. Frontend uses ID mostly.
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },
    
    // Alias for getById if slug usage differs
    getBySlug: async (slug: string): Promise<ApiResponse<Event>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${slug}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    getByCategory: async (categoryId: number): Promise<PaginatedResponse<Event, 'events'>> => {
       // Filter client side or call specific endpoint
       return api.events.getAll({ category: String(categoryId) });
    },

    search: async (query: string): Promise<PaginatedResponse<Event, 'events'>> => {
      return api.events.getAll({ search: query });
    },
  },

  categories: {
    getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Category, 'categories'>> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await fetch(`${API_BASE_URL}/categories?${queryParams.toString()}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        console.error('Get all categories error:', error);
        throw error;
      }
    },
  },

  orders: {
    create: async (data: CheckoutRequest): Promise<ApiResponse<Order>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    confirmPayment: async (orderId: number | string): Promise<ApiResponse<Order>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pay`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },
    
    getById: async (orderId: number | string): Promise<ApiResponse<Order>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    checkStatus: async (orderId: number | string): Promise<ApiResponse<Order>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    cancel: async (orderId: number | string): Promise<ApiResponse<Order>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    }
  },

  tickets: {
    getByOrder: async (orderId: number | string): Promise<ApiResponse<Ticket[]>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tickets`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    getMyTickets: async (): Promise<ApiResponse<{ upcoming: Ticket[], past: Ticket[] }>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/tickets/my-tickets`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    // Deprecated: use getMyTickets instead
    getByUser: async (): Promise<ApiResponse<Ticket[]>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/tickets`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },
  },

  settings: {
    get: async (): Promise<ApiResponse<Record<string, string>>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }
    },
  },
};

// Legacy service adapter for backward compatibility
export const eventService = {
  getAll: async () => {
    // This adapter logic mimics the old complex object return
    // It fetches from new APIs and composes the result
    try {
        const [eventsRes, catsRes, featuredRes] = await Promise.all([
            api.events.getAll({ limit: 12 }),
            api.categories.getAll({ limit: 100 }),
            api.events.getFeatured()
        ]);
        
        return {
            events: eventsRes.data.events || [],
            categories: catsRes.data.categories || [],
            featuredEvents: featuredRes.data || [], // getFeatured seems to still return flat array based on name, but usually it's also paginated
        };
    } catch (e) {
        console.error(e);
        return { events: [], categories: [], featuredEvents: [] };
    }
  },
};

export { api };
export default api;