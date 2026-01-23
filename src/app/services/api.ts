import { API_BASE_URL, getHeaders } from '../config';
import type {
  ApiResponse,
  Event,
  Category,
  Order,
  Ticket,
  CheckoutRequest,
} from '../types';

// Real API Service
const api = {
  events: {
    getAll: async (params?: any): Promise<ApiResponse<Event[]>> => {
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
        
        const res = await response.json();
        // Since frontend expects flat array in some places but we agreed to support existing structure,
        // we might need to map if backend returns { data: { events: [] } } but frontend expects { data: [] }
        // For now assuming we adjusted backend spec to return flat list or we adapt here:
        
        if (res.success && res.data && res.data.events) {
           // Adapter: if backend returns pagination object
           return { ...res, data: res.data.events };
        }
        
        return res;
      } catch (error) {
        console.error('Get all events error:', error);
        return { success: false, message: 'Network error' };
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

    getById: async (id: number): Promise<ApiResponse<Event>> => {
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

    getByCategory: async (categoryId: number): Promise<ApiResponse<Event[]>> => {
       // Filter client side or call specific endpoint
       return api.events.getAll({ category_id: categoryId });
    },

    search: async (query: string): Promise<ApiResponse<Event[]>> => {
      return api.events.getAll({ search: query });
    },
  },

  categories: {
    getAll: async (): Promise<ApiResponse<Category[]>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
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

    confirmPayment: async (orderId: number): Promise<ApiResponse<Order>> => {
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
    
    getById: async (orderId: number): Promise<ApiResponse<Order>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    }
  },

  tickets: {
    getByOrder: async (orderId: number): Promise<ApiResponse<Ticket[]>> => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tickets`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        return { success: false, message: 'Network error' };
      }
    },

    getByUser: async (userId: number): Promise<ApiResponse<Ticket[]>> => {
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
};

// Legacy service adapter for backward compatibility
export const eventService = {
  getAll: async () => {
    // This adapter logic mimics the old complex object return
    // It fetches from new APIs and composes the result
    try {
        const [eventsRes, catsRes, featuredRes] = await Promise.all([
            api.events.getAll(),
            api.categories.getAll(),
            api.events.getFeatured()
        ]);
        
        return {
            events: eventsRes.data || [],
            categories: catsRes.data || [],
            featuredEvents: featuredRes.data || [],
        };
    } catch (e) {
        console.error(e);
        return { events: [], categories: [], featuredEvents: [] };
    }
  },
};

export { api };
export default api;