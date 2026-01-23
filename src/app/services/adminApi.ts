import { API_BASE_URL, getHeaders } from '../config';

// Transaction interface matching backend
export interface Transaction {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_title: string;
  event_date: string;
  ticket_type: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  payment_method: string;
  created_at: string;
  expires_at: string | null;
  paid_at: string | null;
}

export interface TransactionStats {
  total: number;
  completed: number;
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
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
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

  // GET /api/admin/stats
  getStats: async (): Promise<{ success: boolean; data: TransactionStats }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Gagal mengambil statistik');
    }
  },
};
