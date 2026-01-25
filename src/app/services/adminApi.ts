import { API_BASE_URL, getHeaders } from '../config';
import type { 
  ApiResponse,
  PaginatedResponse, 
  Event, 
  Category, 
  PaginationMetadata 
} from '../types';

// Transaction interface matching backend
export interface Transaction {
  id: number;
  user_id: number | null;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  admin_fee: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  payment_method: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  paid_at: string | null;
  tickets: TransactionTicket[];
}

export interface TransactionTicket {
  id: number;
  event_id: number;
  event: Event;
  ticket_type_id: number;
  ticket_type: {
    id: number;
    name: string;
    price: number;
  };
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  custom_field_responses?: string; // JSON string of custom field responses
  status: string;
}

export interface TransactionStats {
  total: number;
  paid: number;
  pending: number;
  expired: number;
  cancelled: number;
  total_revenue: number;
}

export interface TransactionListResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    stats: TransactionStats;
    pagination: PaginationMetadata;
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  data: Transaction;
}

export interface ResendEmailResponse {
  success: boolean;
  message: string;
}

export interface AdminStats {
  total_transactions: number;
  paid_transactions: number;
  pending_transactions: number;
  total_revenue: number;
  total_users: number;
  total_events: number;
}

export interface AdminStatsResponse {
  success: boolean;
  data: AdminStats;
}

export interface TransactionTimelineItem {
  id: number;
  status: string;
  notes: string;
  created_at: string;
}

// Mock API Functions
export const adminApi = {
  // GET /api/admin/transactions
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<TransactionListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const response = await fetch(`${API_BASE_URL}/admin/transactions?${queryParams.toString()}`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Gagal mengambil data transaksi');
    }
  },

  // GET /api/v1/admin/stats
  getStats: async (): Promise<AdminStatsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Gagal mengambil statistik admin');
    }
  },

  // GET /api/admin/transactions/:id
  getTransactionDetail: async (id: string): Promise<TransactionDetailResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/transactions/${id}`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw new Error('Gagal mengambil detail transaksi');
    }
  },

  // PUT /api/admin/transactions/:id/status
  updateTransactionStatus: async (id: string, status: string): Promise<ApiResponse<Transaction>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/transactions/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      throw new Error('Gagal mengubah status transaksi');
    }
  },

  // POST /api/admin/transactions/:id/resend-email
  resendEmail: async (id: string): Promise<ResendEmailResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/transactions/${id}/resend-email`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error resending email:', error);
      throw new Error('Gagal mengirim ulang email');
    }
  },

  // GET /api/v1/admin/transactions/:id/timeline
  getTransactionTimeline: async (id: string): Promise<{ success: boolean; data: TransactionTimelineItem[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/transactions/${id}/timeline`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction timeline:', error);
      throw new Error('Gagal mengambil riwayat transaksi');
    }
  },

  // POST /api/admin/upload
  uploadImage: async (file: File): Promise<{ success: boolean; data: { url: string } }> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': getHeaders()['Authorization'],
          // Content-Type header not needed for FormData, browser sets it with boundary
        },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Gagal mengupload gambar');
    }
  },

  // Events CRUD
  events: {
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Event, 'events'>> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const response = await fetch(`${API_BASE_URL}/admin/events?${queryParams.toString()}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        console.error('Error fetching admin events:', error);
        throw error;
      }
    },

    create: async (data: any) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/events`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        console.error('Error creating event:', error);
        throw error;
      }
    },

    update: async (id: number | string, data: any) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        console.error('Error updating event:', error);
        throw error;
      }
    },

    updateStatus: async (id: number | string, status: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/events/${id}/status`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status }),
        });
        return await response.json();
      } catch (error) {
        console.error('Error updating event status:', error);
        throw error;
      }
    },

    delete: async (id: number | string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
      }
    },
  },

  // Categories CRUD
  categories: {
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Category, 'categories'>> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        queryParams.append('include_inactive', 'true');

        const response = await fetch(`${API_BASE_URL}/admin/categories?${queryParams.toString()}`, {
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        console.error('Error fetching admin categories:', error);
        throw error;
      }
    },

    create: async (data: { 
      name: string; 
      description?: string;
      slug?: string;
      icon?: string;
      image?: string;
      display_order?: number;
      is_active?: boolean;
    }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/categories`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        console.error('Error creating category:', error);
        throw error;
      }
    },

    update: async (id: number | string, data: { 
      name?: string; 
      description?: string;
      slug?: string;
      icon?: string;
      image?: string;
      display_order?: number;
      is_active?: boolean;
    }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });

        return await response.json();
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    },

    delete: async (id: number | string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        return await response.json();
      } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
    },
  },
};

