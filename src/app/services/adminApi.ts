// Mock Admin API Service
// In production, ganti dengan real API endpoints

import { MOCK_TRANSACTIONS, generateMockTransactions } from '@/app/data/mockTransactions';

// Base URL - Ganti ini dengan backend URL production
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

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

// Initialize mock data
if (!localStorage.getItem('admin_transactions')) {
  localStorage.setItem('admin_transactions', JSON.stringify(MOCK_TRANSACTIONS));
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/admin/transactions?${new URLSearchParams(params)}`);
      // return await response.json();

      // Mock implementation
      const transactions: Transaction[] = JSON.parse(
        localStorage.getItem('admin_transactions') || '[]'
      );

      let filtered = [...transactions];

      // Filter by status
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter(t => t.status === params.status);
      }

      // Search
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        filtered = filtered.filter(
          t =>
            t.order_number.toLowerCase().includes(searchLower) ||
            t.customer_name.toLowerCase().includes(searchLower) ||
            t.customer_email.toLowerCase().includes(searchLower) ||
            t.event_title.toLowerCase().includes(searchLower)
        );
      }

      // Calculate stats
      const stats: TransactionStats = {
        total: transactions.length,
        completed: transactions.filter(t => t.status === 'completed').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        expired: transactions.filter(t => t.status === 'expired').length,
        cancelled: transactions.filter(t => t.status === 'cancelled').length,
        total_revenue: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.total_amount, 0),
      };

      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);

      return {
        success: true,
        data: {
          transactions: paginated,
          stats,
          pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
          },
        },
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Gagal mengambil data transaksi');
    }
  },

  // GET /api/admin/transactions/:id
  getTransactionDetail: async (id: string): Promise<TransactionDetailResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/admin/transactions/${id}`);
      // return await response.json();

      // Mock implementation
      const transactions: Transaction[] = JSON.parse(
        localStorage.getItem('admin_transactions') || '[]'
      );

      const transaction = transactions.find(t => t.id === id);

      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw new Error('Gagal mengambil detail transaksi');
    }
  },

  // POST /api/admin/transactions/:id/resend-email
  resendEmail: async (id: string): Promise<ResendEmailResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/admin/transactions/${id}/resend-email`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      //   },
      // });
      // return await response.json();

      // Mock implementation
      const transactions: Transaction[] = JSON.parse(
        localStorage.getItem('admin_transactions') || '[]'
      );

      const transaction = transactions.find(t => t.id === id);

      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      if (transaction.status !== 'completed') {
        throw new Error('Hanya transaksi completed yang bisa resend email');
      }

      // Simulate sending email
      console.log(`📧 Sending email to ${transaction.customer_email}`);
      console.log(`Order: ${transaction.order_number}`);

      return {
        success: true,
        message: `Email tiket berhasil dikirim ulang ke ${transaction.customer_email}`,
      };
    } catch (error: any) {
      console.error('Error resending email:', error);
      throw new Error(error.message || 'Gagal mengirim ulang email');
    }
  },

  // GET /api/admin/stats
  getStats: async (): Promise<{ success: boolean; data: TransactionStats }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/admin/stats`);
      // return await response.json();

      // Mock implementation
      const transactions: Transaction[] = JSON.parse(
        localStorage.getItem('admin_transactions') || '[]'
      );

      const stats: TransactionStats = {
        total: transactions.length,
        completed: transactions.filter(t => t.status === 'completed').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        expired: transactions.filter(t => t.status === 'expired').length,
        cancelled: transactions.filter(t => t.status === 'cancelled').length,
        total_revenue: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.total_amount, 0),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Gagal mengambil statistik');
    }
  },
};
