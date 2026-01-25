import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Mail, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  DollarSign,
  ShoppingCart,
  Edit2,
  Check,
  X,
  LayoutDashboard,
  Calendar,
  Tags,
  Loader2,
  Eye,
  User
} from 'lucide-react';
import { formatDateTime } from '@/app/utils/helpers';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { adminApi, type Transaction, type AdminStats, type TransactionTimelineItem } from '@/app/services/adminApi';
import { AdminEvents } from '@/app/components/admin/AdminEvents';
import { AdminCategories } from '@/app/components/admin/AdminCategories';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_transactions: 0,
    paid_transactions: 0,
    pending_transactions: 0,
    total_revenue: 0,
    total_users: 0,
    total_events: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isMounted = useRef(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Alert Dialog State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
    variant?: 'default' | 'destructive';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default',
    confirmText: 'Ya, Lanjutkan'
  });

  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated) {
      if (!user || user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [user, isAuthenticated, navigate]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // Fetch transactions logic
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;


    setIsLoading(true);
    try {
      const response = await adminApi.getTransactions({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        search: debouncedSearch,
      });



      setTransactions(() => response.data?.transactions || []);
      setTotalPages(response.data?.pagination?.total_pages || 1);
      setTotalItems(response.data?.pagination?.total_items || 0);
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearch, isAuthenticated, user]);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;

    try {
      const response = await adminApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Fetch stats error:', error);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  // Timeline State
  const [timeline, setTimeline] = useState<TransactionTimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Fetch Timeline when selectedTransaction changes
  useEffect(() => {
    const fetchTimeline = async () => {
      if (!selectedTransaction) {
        setTimeline([]);
        return;
      }

      setIsLoadingTimeline(true);
      try {
        const response = await adminApi.getTransactionTimeline(selectedTransaction.id.toString());
        if (response.success && response.data) {
          setTimeline(response.data);
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
        toast.error('Gagal memuat riwayat status');
      } finally {
        setIsLoadingTimeline(false);
      }
    };

    fetchTimeline();
  }, [selectedTransaction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleResendEmail = (transaction: Transaction) => {
    setAlertConfig({
      isOpen: true,
      title: 'Kirim Ulang Tiket',
      description: `Apakah Anda yakin ingin mengirim ulang tiket ke ${transaction.customer_email}?`,
      confirmText: 'Kirim Email',
      onConfirm: async () => {
        setResendingId(transaction.id);
        try {
          const response = await adminApi.resendEmail(transaction.id.toString());
          toast.success(response.message);
          fetchData(); 
        } catch (error: any) {
          toast.error(error.message || 'Gagal mengirim ulang email');
        } finally {
          setResendingId(null);
        }
      }
    });
  };

  const handleChangeStatus = (transaction: Transaction, status: string) => {
    if (transaction.status === 'paid' || transaction.status === 'cancelled') {
        toast.error('Transaksi yang sudah dibayar atau dibatalkan tidak dapat diubah statusnya');
        return;
    }

    setAlertConfig({
      isOpen: true,
      title: 'Konfirmasi Perubahan Status',
      description: `Ubah status transaksi ${transaction.order_number} menjadi ${status}?`,
      variant: 'destructive',
      confirmText: 'Ya, Ubah Status',
      onConfirm: async () => {
        try {
          const response = await adminApi.updateTransactionStatus(transaction.id.toString(), status);
          if (!response.success) {
            throw new Error(response.message || 'Gagal mengubah status di server');
          }
          toast.success('Status berhasil diubah');
          await fetchData();
          await fetchStats();
          setEditingStatusId(null);
          setNewStatus('');
        } catch (error: any) {
          toast.error(error.message || 'Gagal mengubah status');
        }
      }
    });
  };

  const formatPrice = (price: number = 0) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  /* Removed local formatDate */

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: { className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Lunas' },
      pending: { className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Menunggu Pembayaran' },
      expired: { className: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle, label: 'Kadaluarsa' },
      cancelled: { className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Dibatalkan' },
    };

    const config = variants[status as keyof typeof variants];
    
    if (!config) {
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
    }

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
          <p className="text-gray-600 mt-1">Kelola transaksi, event, dan kategori</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 border shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <Calendar className="h-4 w-4 mr-2" />
              Event
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <Tags className="h-4 w-4 mr-2" />
              Kategori
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
             {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingCart className="h-8 w-8 opacity-80" />
                    <span className="text-2xl font-bold">{stats.total_transactions}</span>
                  </div>
                  <p className="text-sm text-sky-100">Total Transaksi</p>
                </Card>
                {/* ... other stats cards ... */}
                 <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-8 w-8 opacity-80" />
                    <span className="text-2xl font-bold">{stats.paid_transactions}</span>
                  </div>
                  <p className="text-sm text-green-100">Lunas</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-8 w-8 opacity-80" />
                    <span className="text-2xl font-bold">{stats.pending_transactions}</span>
                  </div>
                  <p className="text-sm text-yellow-100">Menunggu Pembayaran</p>
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
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    type="text"
                    placeholder="Cari order number, nama, email, atau event..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                      <SelectItem value="paid">Lunas</SelectItem>
                      <SelectItem value="pending">Menunggu Pembayaran</SelectItem>
                      <SelectItem value="expired">Kadaluarsa</SelectItem>
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
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                            <p>Loading...</p>
                          </div>
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
                            <div className="text-sm text-gray-900">
                              {transaction.tickets?.[0]?.event?.title || transaction.order_number || 'No Title'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.tickets?.[0]?.event?.event_date && transaction.tickets[0].event.event_date !== '0001-01-01T00:00:00Z' 
                                ? new Date(transaction.tickets[0].event.event_date).toLocaleDateString('id-ID') 
                                : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{transaction.tickets?.[0]?.ticket_type?.name || 'Standard'}</div>
                            <div className="text-xs text-gray-500">{transaction.tickets?.length || 0}x tiket</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-gray-900">{formatPrice(transaction.total_amount)}</div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{formatDateTime(transaction.created_at)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {transaction.status === 'paid' && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                  onClick={() => handleResendEmail(transaction)}
                                  disabled={resendingId === transaction.id}
                                  title="Kirim ulang tiket"
                                >
                                  {resendingId === transaction.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
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
                                    <option value="paid">Lunas</option>
                                    <option value="pending">Menunggu Pembayaran</option>
                                    <option value="expired">Kadaluarsa</option>
                                    <option value="cancelled">Dibatalkan</option>
                                  </select>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      if (newStatus && newStatus !== transaction.status) {
                                        handleChangeStatus(transaction, newStatus);
                                      } else {
                                        setEditingStatusId(null);
                                      }
                                    }}
                                    title="Simpan"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setEditingStatusId(null);
                                      setNewStatus('');
                                    }}
                                    title="Batal"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                transaction.status !== 'paid' && transaction.status !== 'cancelled' && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => {
                                      setEditingStatusId(transaction.id);
                                      setNewStatus(transaction.status);
                                    }}
                                    title="Edit status"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )
                              )}
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => setSelectedTransaction(transaction)}
                                title="Lihat detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                    Menampilkan {transactions.length} dari {totalItems} transaksi | Halaman {currentPage} dari {totalPages}
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
          </TabsContent>

          <TabsContent value="events">
            <AdminEvents />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories />
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedTransaction(null)}
        >
          {/* ... modal content ... */}
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
           {/* Replicating the existing modal structure implicitly by strictly following where it was. 
               Wait, I should just append the Alert after the selectedTransaction modal block. 
               The instruction is to replace end of file, or specifically where the JSX ends. 
               Wait, the tool needs a target content. I'll rely on the closing tags. 
           */}
            <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-sky-700 text-white p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sky-100 text-2xl font-bold">Detail Transaksi</h2>
                  <p className="text-sky-100 mt-1">{selectedTransaction.order_number}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Buyer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-600" />
                  Informasi Pembeli
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span className="font-medium text-gray-900">{selectedTransaction.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{selectedTransaction.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telepon:</span>
                    <span className="font-medium text-gray-900">{selectedTransaction.customer_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">{formatPrice(selectedTransaction.total_amount - (selectedTransaction.admin_fee || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Admin:</span>
                    <span className="font-medium text-gray-900">{formatPrice(selectedTransaction.admin_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600 font-semibold">Total Pembayaran:</span>
                    <span className="font-bold text-sky-600 text-xl">{formatPrice(selectedTransaction.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <div>{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                </div>
              </div>

              {/* Tickets/Attendees */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Daftar Peserta ({selectedTransaction.tickets?.length || 0})</h3>
                <div className="space-y-3">
                  {selectedTransaction.tickets && selectedTransaction.tickets.length > 0 ? (
                    selectedTransaction.tickets.map((ticket, index) => {
                      let customFieldResponses: Record<string, any> = {};
                      try {
                        if (ticket.custom_field_responses) {
                          customFieldResponses = JSON.parse(ticket.custom_field_responses);
                        }
                      } catch (error) {
                        console.error('Failed to parse custom field responses:', error);
                      }

                      return (
                        <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">Peserta {index + 1}</p>
                              <p className="text-sm text-gray-600">{ticket.ticket_type?.name || 'Standard'}</p>
                            </div>
                            <Badge className="bg-sky-50 text-sky-700 border-sky-200">
                              {ticket.ticket_code}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Nama:</span>
                              <span className="font-medium text-gray-900">{ticket.attendee_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium text-gray-900">{ticket.attendee_email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Telepon:</span>
                              <span className="font-medium text-gray-900">{ticket.attendee_phone}</span>
                            </div>
                          </div>

                          {/* Custom Field Responses */}
                          {Object.keys(customFieldResponses).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Informasi Tambahan:</p>
                              <div className="space-y-1">
                                {Object.entries(customFieldResponses).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="font-medium text-gray-900">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">Tidak ada data tiket</p>
                  )}
                </div>
              </div>

              {/* Event Information */}
              {selectedTransaction.tickets?.[0]?.event && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi Event</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event:</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.tickets[0].event.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTransaction.tickets[0].event.event_date && selectedTransaction.tickets[0].event.event_date !== '0001-01-01T00:00:00Z'
                          ? new Date(selectedTransaction.tickets[0].event.event_date).toLocaleDateString('id-ID')
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lokasi:</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.tickets[0].event.venue}, {selectedTransaction.tickets[0].event.city}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-sky-600" />
                  Activity Log
                </h3>
                <div className="bg-white border rounded-lg p-6">
                  {isLoadingTimeline ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                    </div>
                  ) : timeline.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">Belum ada riwayat status.</p>
                  ) : (
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                       {timeline
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Ensure newest first
                        .map((item, index) => (
                        <div key={item.id} className="relative">
                           {/* Dot Indicator */}
                           <div className={`absolute -left-[22.5px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                              index === 0 ? 'bg-sky-600 ring-4 ring-sky-100' : 'bg-gray-300'
                           }`} />
                           
                           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                              <div>
                                 <div className="mb-1">
                                    {getStatusBadge(item.status)}
                                 </div>
                                 <p className="text-sm text-gray-900 font-medium">
                                    {item.notes || 'Status diperbarui'}
                                 </p>
                              </div>
                              <span className="text-xs text-gray-500 font-mono whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                                 {formatDateTime(item.created_at)}
                              </span>
                           </div>
                        </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Action Confirmation Dialog */}
      <AlertDialog 
        open={alertConfig.isOpen} 
        onOpenChange={(open) => {
          if (!open) setAlertConfig(prev => ({ ...prev, isOpen: false }));
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Prevent auto-close if async? No, usually fine.
                const result = alertConfig.onConfirm();
                if (result instanceof Promise) {
                   result.finally(() => setAlertConfig(prev => ({ ...prev, isOpen: false })));
                } else {
                   setAlertConfig(prev => ({ ...prev, isOpen: false }));
                }
              }}
              className={alertConfig.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'}
            >
              {alertConfig.confirmText || 'Lanjutkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}