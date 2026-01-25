import { Copy, CheckCircle2, Clock, QrCode, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PendingOrder } from '@/app/types/pendingOrder';

interface PaymentDetailPageProps {
  pendingOrder: PendingOrder;
  tickets?: any[];
  onPaymentSuccess: () => void;
  onManualCheck: () => void;
  onCancel: () => void;
}

export function PaymentDetailPage({ 
  pendingOrder,
  tickets = [],
  onPaymentSuccess,
  onManualCheck,
  onCancel
}: PaymentDetailPageProps) {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const status = (pendingOrder.status || 'pending').toLowerCase();

  // Sync timeLeft when pendingOrder changes or on mount
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiry = typeof pendingOrder.expiryTime === 'string' 
        ? new Date(String(pendingOrder.expiryTime).replace(' ', 'T')).getTime()
        : pendingOrder.expiryTime;
      
      const remaining = expiry - Date.now();
      return Math.max(0, Math.floor(remaining / 1000));
    };

    setTimeLeft(calculateTimeLeft());
  }, [pendingOrder.expiryTime]);

  // Sync timeLeft when pendingOrder changes or on mount
  useEffect(() => {
    const updateCountdown = () => {
      let expiry: number;
      if (typeof pendingOrder.expiryTime === 'number') {
        expiry = pendingOrder.expiryTime;
      } else {
        expiry = new Date(String(pendingOrder.expiryTime).replace(' ', 'T')).getTime();
      }
      
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
      
      return remaining;
    };

    // Initial run
    const currentRemaining = updateCountdown();
    if (status !== 'pending' || currentRemaining <= 0) return;

    // Set interval to update every second
    const timer = setInterval(() => {
      const rem = updateCountdown();
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingOrder.expiryTime, status]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard');
  };

  const checkPaymentStatus = async () => {
    setIsCheckingStatus(true);
    try {
      await onManualCheck();
    } catch (error) {
      toast.error('Terjadi kesalahan saat memeriksa status pembayaran.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Backward compatibility for old data structure
  const paymentType = pendingOrder.paymentType || 'va';
  const paymentMethod = pendingOrder.paymentMethod || (pendingOrder as any).bank || 'BCA';
  const vaNumber = (pendingOrder as any).virtualAccountNumber || pendingOrder.vaNumber || (pendingOrder as any).vaNumber;
  
  // Status Badge Logic
  const renderStatusBadge = () => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-lg px-4 py-1">Lunas</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-lg px-4 py-1">Dibatalkan</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-lg px-4 py-1">Kedaluwarsa</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-lg px-4 py-1">Menunggu Pembayaran</Badge>;
    }
  };

  const getHeaderColor = () => {
    switch (status) {
      case 'paid': return 'from-green-600 to-green-700';
      case 'cancelled': return 'from-red-600 to-red-700';
      case 'expired': return 'from-gray-600 to-gray-700';
      default: return 'from-sky-600 to-sky-700';
    }
  };

  const getHeaderIcon = () => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-8 w-8 text-white" />;
      case 'cancelled': return <XCircle className="h-8 w-8 text-white" />;
      case 'expired': return <AlertCircle className="h-8 w-8 text-white" />;
      default: return <Clock className="h-8 w-8 text-white" />;
    }
  };

  const getHeaderText = () => {
    switch (status) {
      case 'paid': return 'Pesanan Selesai';
      case 'cancelled': return 'Pesanan Dibatalkan';
      case 'expired': return 'Pesanan Kedaluwarsa';
      default: return 'Menunggu Pembayaran';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Status Header */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
          <div className={`p-6 border-b bg-gradient-to-r ${getHeaderColor()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  {getHeaderIcon()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{getHeaderText()}</h1>
                  <p className="text-white/90 text-sm opacity-90">Order ID: {pendingOrder.orderId}</p>
                </div>
              </div>
              <div className="hidden md:block">
                 {renderStatusBadge()}
              </div>
            </div>
            <div className="md:hidden mt-4">
                {renderStatusBadge()}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
             {/* Payment Instructions - Only for pending */}
             {status === 'pending' && (
                <Card className="bg-white p-6 shadow-sm">
                  {/* Timer */}
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-1">Selesaikan pembayaran dalam</p>
                        <p className="text-2xl font-bold text-orange-600">{formatTime(timeLeft)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {pendingOrder.paymentUrl ? (
                    <div className="text-center space-y-4">
                        <div className="bg-sky-50 rounded-lg p-6 border border-sky-100">
                          <h3 className="text-lg font-semibold text-sky-900 mb-2">Lanjut ke Pembayaran</h3>
                          <p className="text-sm text-sky-700 mb-6">
                            Klik tombol di bawah untuk menyelesaikan pembayaran melalui {pendingOrder.paymentMethod || 'E-Wallet/Link'}.
                          </p>
                          <Button 
                            size="lg"
                            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 min-w-[200px]"
                            onClick={() => window.open(pendingOrder.paymentUrl!, '_blank')}
                          >
                            Bayar Sekarang
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Halaman pembayaran akan terbuka di tab baru.
                        </p>
                    </div>
                  ) : paymentType === 'qris' ? (
                     <div className="text-center">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Scan QR Code
                        </label>
                        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 inline-block mb-4">
                            <QrCode className="h-32 w-32 text-gray-800 mx-auto" />
                            <p className="text-xs text-gray-400 mt-2">QRIS Code</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{formatPrice(pendingOrder.amount)}</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div>
                           <label className="text-sm font-medium text-gray-700 mb-1 block">
                              {paymentType === 'ewallet' ? 'Nomor E-Wallet' : 'Nomor Virtual Account'}
                           </label>
                           <div className="flex gap-2">
                              <div className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-md font-mono text-xl font-bold text-gray-900 tracking-wider">
                                 {vaNumber || '-'}
                              </div>
                              <Button variant="outline" size="icon" onClick={() => copyToClipboard(vaNumber || '')}>
                                <Copy className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                        <div>
                           <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Total Transfer
                           </label>
                           <div className="flex gap-2">
                              <div className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-xl font-bold text-gray-900">
                                 {formatPrice(pendingOrder.amount)}
                              </div>
                              <Button variant="outline" size="icon" onClick={() => copyToClipboard(String(pendingOrder.amount))}>
                                <Copy className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Actions */}
                  <div className="mt-8 space-y-3">
                    <Button
                        onClick={checkPaymentStatus}
                        className="w-full bg-sky-600 hover:bg-sky-700"
                        disabled={isCheckingStatus}
                    >
                        {isCheckingStatus ? 'Memeriksa...' : 'Cek Status Pembayaran'}
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="w-full border-gray-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    >
                        Batalkan Pesanan
                    </Button>
                  </div>
                </Card>
             )}

             {/* Order Items & Tickets */}
             <Card className="bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Detail Tiket</h3>
                
                {tickets.length > 0 ? (
                   <div className="space-y-4">
                      {tickets.map((ticket, idx) => (
                         <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <p className="font-bold text-gray-900">{ticket.ticket_type?.name || 'Tiket'}</p>
                                  <p className="text-sm text-gray-600">{ticket.ticket_code}</p>
                               </div>
                               {/* Use 'attendee_name' from ticket, or fallback to customer info if single/same */}
                               <div className="text-right">
                                  <p className="text-sm font-medium">{ticket.attendee_name || pendingOrder.customerInfo?.name}</p>
                               </div>
                            </div>
                            
                            {/* Custom Fields */}
                            {ticket.custom_field_responses && (
                               <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Informasi Tambahan</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                     {Object.entries(JSON.parse(ticket.custom_field_responses || '{}')).map(([key, value]) => (
                                        <div key={key}>
                                           <span className="text-gray-500">{key}:</span> <span className="font-medium text-gray-900">{String(value)}</span>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      ))}
                   </div>
                ) : (
                   // Fallback to order items if no tickets (e.g. pending order before tickets generated? usually tickets generated at checkout but maybe separate)
                   // But since checkout creates tickets, they should be there.
                   // If fetchTickets failed, fallback to summary.
                   <div className="space-y-3">
                     {pendingOrder.orderDetails?.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-start py-3 border-b last:border-0 border-dashed">
                          <div>
                            <p className="font-medium text-gray-900">{item.eventTitle}</p>
                            <p className="text-sm text-gray-600">{item.ticketType} × {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                   </div>
                )}
             </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <Card className="bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Info Pembeli</h3>
                 <div className="space-y-4 text-sm">
                    <div className="flex flex-col">
                       <p className="text-gray-500 text-xs mb-0.5">Nama</p>
                       <p className="font-medium text-gray-900 break-words">{pendingOrder.customerInfo?.name}</p>
                    </div>
                    <div className="flex flex-col">
                       <p className="text-gray-500 text-xs mb-0.5">Email</p>
                       <p className="font-medium text-gray-900 break-words">{pendingOrder.customerInfo?.email}</p>
                    </div>
                    <div className="flex flex-col">
                       <p className="text-gray-500 text-xs mb-0.5">Telepon</p>
                       <p className="font-medium text-gray-900 break-words">{pendingOrder.customerInfo?.phone}</p>
                    </div>
                 </div>
             </Card>
             
             {/* Payment Info */}
             <Card className="bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Rincian Pembayaran</h3>
                 <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                       <span className="text-gray-500 flex-shrink-0">Metode</span>
                       <span className="font-medium text-gray-900 uppercase text-right break-words">{paymentMethod}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                       <span className="text-gray-500 flex-shrink-0">Harga Tiket</span>
                       <span className="font-medium text-gray-900 text-right">
                          {formatPrice(pendingOrder.totalAmount - (pendingOrder.adminFee || 0))}
                       </span>
                    </div>
                    {pendingOrder.adminFee && pendingOrder.adminFee > 0 && (
                       <div className="flex justify-between gap-4">
                          <span className="text-gray-500 flex-shrink-0">Biaya Layanan</span>
                          <span className="font-medium text-gray-900 text-right">{formatPrice(pendingOrder.adminFee)}</span>
                       </div>
                    )}
                    {status === 'pending' && vaNumber && (
                      <div className="flex justify-between gap-4">
                         <span className="text-gray-500 flex-shrink-0">No. VA</span>
                         <span className="font-medium text-gray-900 text-right break-all">{vaNumber}</span>
                      </div>
                    )}
                   <div className="border-t pt-3 flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-sky-600">{formatPrice(pendingOrder.amount)}</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}