import { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { useAuth } from '@/app/contexts/AuthContext';
import { adminApi, type Transaction, type TransactionStats } from '@/app/services/adminApi';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    completed: 0,
    pending: 0,
    expired: 0,
    cancelled: 0,
    total_revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const hasCheckedAuth = useRef(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isMounted = useRef(true);

  // Check if user is admin - only once on mount
  useEffect(() => {
    console.log('🔐 Auth check effect triggered', { 
      hasCheckedAuth: hasCheckedAuth.current, 
      isAuthenticated,
      userRole: user?.role 
    });
    
    if (!hasCheckedAuth.current && isAuthenticated) {
      if (!user || user.role !== 'admin') {
        console.log('❌ Not admin, redirecting...');
        navigate('/');
        return;
      }
      console.log('✅ Admin verified');
      hasCheckedAuth.current = true;
    }
  }, [user, isAuthenticated, navigate]);

  // Debounce search input
  useEffect(() => {
    console.log('🔍 Search debounce effect', { searchQuery });
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      console.log('⏱️ Search debounce complete, setting:', searchQuery);
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // Fetch transactions - simplified and isolated
  useEffect(() => {
    console.log('📊 Fetch effect triggered', {
      hasCheckedAuth: hasCheckedAuth.current,
      userRole: user?.role,
      currentPage,
      statusFilter,
      debouncedSearch,
      isMounted: isMounted.current
    });
    
    // Only proceed if we've checked auth and user is admin
    if (!hasCheckedAuth.current) {
      console.log('⏸️ Skipping - auth not checked yet');
      return;
    }
    if (!user || user.role !== 'admin') {
      console.log('⏸️ Skipping - not admin');
      return;
    }
    
    const fetchData = async () => {
      console.log('🚀 Starting fetch...');
      if (!isMounted.current) {
        console.log('⏸️ Component unmounted, skipping fetch');
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await adminApi.getTransactions({
          page: currentPage,
          limit: 10,
          status: statusFilter,
          search: debouncedSearch,
        });

        console.log('✅ Fetch success', {
          transactionsCount: response.data.transactions.length,
          stats: response.data.stats
        });

        if (isMounted.current) {
          setTransactions(response.data.transactions);
          setStats(response.data.stats);
          setTotalPages(response.data.pagination.totalPages);
        }
      } catch (error: any) {
        console.error('❌ Fetch error:', error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          console.log('🏁 Fetch complete');
        }
      }
    };

    fetchData();
  }, [currentPage, statusFilter, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    console.log('🎬 Component mounted');
    return () => {
      console.log('💀 Component unmounting');
      isMounted.current = false;
    };
  }, []);

  const handleResendEmail = async (transaction: Transaction) => {
    if (!confirm(`Kirim ulang tiket ke ${transaction.customer_email}?`)) {
      return;
    }

    setResendingId(transaction.id);
    try {
      const response = await adminApi.resendEmail(transaction.id);
      alert(response.message);
    } catch (error: any) {
      alert(error.message || 'Gagal mengirim ulang email');
    } finally {
      setResendingId(null);
    }
  };

  const handleChangeStatus = async (transaction: Transaction, status: string) => {
    if (!confirm(`Ubah status transaksi ${transaction.order_number} menjadi ${status}?`)) {
      return;
    }

    try {
      const oldStatus = transaction.status;
      
      // Update local state immediately for better UX
      setTransactions(prev => 
        prev.map(t => t.id === transaction.id ? { ...t, status: status as any } : t)
      );
      
      // Update stats
      setStats(prev => {
        const newStats = { ...prev };
        // Decrease old status count
        if (oldStatus === 'completed') newStats.completed--;
        else if (oldStatus === 'pending') newStats.pending--;
        else if (oldStatus === 'expired') newStats.expired--;
        else if (oldStatus === 'cancelled') newStats.cancelled--;
        
        // Increase new status count
        if (status === 'completed') newStats.completed++;
        else if (status === 'pending') newStats.pending++;
        else if (status === 'expired') newStats.expired++;
        else if (status === 'cancelled') newStats.cancelled++;
        
        return newStats;
      });

      alert(`Status berhasil diubah menjadi ${status}`);
      setEditingStatusId(null);
      setNewStatus('');
    } catch (error: any) {
      alert(error.message || 'Gagal mengubah status');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Selesai' },
      pending: { className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
      expired: { className: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle, label: 'Expired' },
      cancelled: { className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Dibatalkan' },
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Kelola semua transaksi dan pembelian tiket</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="h-8 w-8 opacity-80" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-sm text-sky-100">Total Transaksi</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-8 w-8 opacity-80" />
                <span className="text-2xl font-bold">{stats.completed}</span>
              </div>
              <p className="text-sm text-green-100">Selesai</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 opacity-80" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
              <p className="text-sm text-yellow-100">Pending</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 opacity-80" />
                <span className="text-xl font-bold">{formatPrice(stats.total_revenue)}</span>
              </div>
              <p className="text-sm text-purple-100">Total Revenue</p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Cari order number, nama, email, atau event..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tiket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{transaction.order_number}</div>
                        <div className="text-xs text-gray-500">{transaction.payment_method}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{transaction.customer_name}</div>
                        <div className="text-xs text-gray-500">{transaction.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{transaction.event_title}</div>
                        <div className="text-xs text-gray-500">{new Date(transaction.event_date).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{transaction.ticket_type}</div>
                        <div className="text-xs text-gray-500">{transaction.quantity}x tiket</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{formatPrice(transaction.total_amount)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{formatDate(transaction.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {transaction.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendEmail(transaction)}
                              disabled={resendingId === transaction.id}
                              className="text-xs"
                            >
                              {resendingId === transaction.id ? (
                                <>Sending...</>
                              ) : (
                                <>
                                  <Mail className="h-3 w-3 mr-1" />
                                  Resend
                                </>
                              )}
                            </Button>
                          )}
                          
                          {editingStatusId === transaction.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={newStatus || transaction.status}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                              >
                                <option value="completed">Selesai</option>
                                <option value="pending">Pending</option>
                                <option value="expired">Expired</option>
                                <option value="cancelled">Dibatalkan</option>
                              </select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (newStatus && newStatus !== transaction.status) {
                                    handleChangeStatus(transaction, newStatus);
                                  } else {
                                    setEditingStatusId(null);
                                  }
                                }}
                                className="p-1 h-7 w-7"
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingStatusId(null);
                                  setNewStatus('');
                                }}
                                className="p-1 h-7 w-7"
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingStatusId(transaction.id);
                                setNewStatus(transaction.status);
                              }}
                              className="text-xs"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Status
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}