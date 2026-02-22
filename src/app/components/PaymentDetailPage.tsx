import { TicketCard } from "@/app/components/TicketCard";
import type { Ticket as DomainTicket } from "@/app/components/MyTickets";
import { Copy, CheckCircle2, Clock, QrCode, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { PendingOrder } from '@/app/types/pendingOrder';
import QRCode from 'qrcode';
import { createPortal } from 'react-dom';


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
  onManualCheck,
  onCancel
}: Omit<PaymentDetailPageProps, 'onPaymentSuccess'>) {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<DomainTicket | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Generate QR code when modal opens
  useEffect(() => {
    if (selectedTicketForQR && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, selectedTicketForQR.ticketCode, { 
        width: 200,
        margin: 2,
        color: {
          dark: '#b31356', // Match theme primary color
          light: '#ffffff'
        }
      });
    }
  }, [selectedTicketForQR]);

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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Tanggal tidak valid';
      return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      return 'Tanggal tidak valid';
    }
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
      default: return 'from-primary to-primary-hover';
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

        <div className="space-y-6">
          {/* Top Info Section: Combined Info & Payment */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white p-6 shadow-sm border-0">
               <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                 <Building2 className="h-5 w-5 text-primary" />
                 Info Pembeli
               </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                   <div className="flex flex-col">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Nama</p>
                      <p className="font-bold text-slate-800 break-words text-base">{pendingOrder.customerInfo?.name}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Email</p>
                      <p className="font-bold text-slate-800 break-words text-base">{pendingOrder.customerInfo?.email}</p>
                   </div>
                   <div className="flex flex-col sm:col-span-2">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Telepon</p>
                      <p className="font-bold text-slate-800 break-words text-base">{pendingOrder.customerInfo?.phone}</p>
                   </div>
                </div>
            </Card>
            
            <Card className="bg-white p-6 shadow-sm border-0">
               <h3 className="font-bold text-gray-900 mb-4 text-lg">Rincian Pembayaran</h3>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between gap-4">
                      <span className="text-gray-500 font-medium">Metode</span>
                      <span className="font-bold text-slate-800 uppercase text-right">{paymentMethod}</span>
                   </div>
                   {pendingOrder.voucherCode && (
                     <div className="flex justify-between gap-4 text-green-600">
                        <span className="font-medium">Potongan Voucher ({pendingOrder.voucherCode})</span>
                        <span className="font-bold text-right">-{formatPrice(pendingOrder.discountAmount || 0)}</span>
                     </div>
                   )}
                   <div className="flex justify-between gap-4 pt-2 border-t border-slate-100">
                      <span className="text-gray-500 font-medium my-auto">Total Tagihan</span>
                      <div className="text-right">
                        <span className="font-black text-xl text-primary">{formatPrice(pendingOrder.amount)}</span>
                      </div>
                   </div>
                </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-3 space-y-6">
               {/* Payment Instructions - Only for pending */}
               {status === 'pending' && (
                  <Card className="bg-white p-6 shadow-sm">
                    {/* Timer */}
                    <div className="p-4 bg-accent-orange-light border border-orange-200 rounded-lg mb-6">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-accent-orange-hover" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 mb-1">Selesaikan pembayaran dalam</p>
                          <p className="text-2xl font-bold text-accent-orange-hover">{formatTime(timeLeft)}</p>
                        </div>
                      </div>
                    </div>

                     {/* Payment Details */}
                     {pendingOrder.paymentUrl ? (
                       <div className="text-center space-y-4">
                           <div className="bg-primary-light rounded-lg p-6 border border-sky-100">
                             <h3 className="text-lg font-semibold text-sky-900 mb-2">Lanjut ke Pembayaran</h3>
                             <p className="text-sm text-primary-hover mb-6">
                               Klik tombol di bawah untuk menyelesaikan pembayaran melalui {pendingOrder.paymentMethod || 'E-Wallet/Link'}.
                             </p>
                             <Button 
                               size="lg"
                               className="w-full sm:w-auto bg-primary hover:bg-primary-hover min-w-[200px]"
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
                     ) : paymentMethod === 'MANUAL_JAGO' ? (
                        <div className="space-y-6">
                           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center justify-between mb-6">
                                 <h4 className="text-slate-900 font-bold flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" /> Informasi Rekening Tujuan
                                 </h4>
                                 <img src="/assets/bank-jago-new.png" alt="Bank Jago" className="h-6 opacity-80" />
                              </div>
                              
                              <div className="space-y-5">
                                 <div className="group relative">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                       Nomor Rekening Bank Jago
                                    </label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                                       <span className="font-mono text-2xl font-bold text-slate-800 tracking-wider">
                                          {vaNumber || '1010101020'}
                                       </span>
                                       <div className="ml-auto h-8 w-[1px] bg-slate-100" />
                                       <Button 
                                         variant="ghost" 
                                         size="sm"
                                         className="text-primary font-bold hover:bg-primary-light"
                                         onClick={() => copyToClipboard(vaNumber || '1010101020')}
                                       >
                                         <Copy className="h-4 w-4 mr-2" /> SALIN
                                       </Button>
                                    </div>
                                 </div>

                                 <div className="relative pt-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                       Jumlah yang Harus Ditransfer
                                    </label>
                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                                       <div className="flex items-baseline gap-1">
                                         <span className="text-slate-500 font-semibold text-lg">Rp</span>
                                         <span className="text-3xl font-black text-slate-900 tracking-tight">
                                            {Math.floor(pendingOrder.amount / 1000).toLocaleString('id-ID')}
                                            <span className="text-slate-900">.</span>
                                            <span className="text-primary underline decoration-primary/40 underline-offset-8">
                                              {(pendingOrder.amount % 1000).toString().padStart(3, '0')}
                                            </span>
                                         </span>
                                       </div>
                                       <Button 
                                         variant="ghost" 
                                         size="sm"
                                         className="text-primary font-bold hover:bg-primary-light"
                                         onClick={() => copyToClipboard(String(pendingOrder.amount))}
                                       >
                                         <Copy className="h-4 w-4 mr-2" /> SALIN
                                       </Button>
                                    </div>
                                    
                                    <div className="mt-4 flex items-start gap-3 bg-amber-50/80 border border-amber-200/50 p-4 rounded-xl">
                                      <div className="bg-amber-100 p-1.5 rounded-full">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                      </div>
                                      <p className="text-xs leading-relaxed text-amber-900 font-medium">
                                         <span className="font-bold underline">Wajib diperhatikan:</span> Pastikan nominal transfer **tepat hingga 3 digit terakhir** agar sistem kami dapat memverifikasi pembayaran Anda secara otomatis.
                                      </p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           
                           {pendingOrder.paymentInstructions && (
                              <div className="border-l-4 border-slate-200 pl-4 py-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Panduan Pembayaran</p>
                                 <p className="text-sm text-slate-600 leading-relaxed italic">
                                    "{pendingOrder.paymentInstructions}"
                                 </p>
                              </div>
                           )}
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
                          className="w-full bg-primary hover:bg-primary-hover"
                          disabled={isCheckingStatus}
                      >
                          {isCheckingStatus ? 'Memeriksa...' : 'Cek Status Pembayaran'}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                              variant="outline"
                              className="w-full border-gray-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          >
                              Batalkan Pesanan
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Batalkan Pesanan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin membatalkan pembayaran ini? Tiket Anda mungkin akan dilepas dan harus dipesan ulang jika pesanan dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Kembali</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={onCancel}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Ya, Batalkan
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
               )}

               {/* Order Items & Tickets */}
                <Card className="bg-white shadow-sm overflow-hidden border-0">
                  <div className="p-6 border-b bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      Detail Tiket
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {tickets.length > 0 ? (
                    <div className="space-y-6">
                      {tickets.map((ticket, idx) => {
                        const eventInfo = ticket.event || pendingOrder.items[0] || (pendingOrder as any).orderDetails?.items?.[0];
                        
                        // Map to Ticket interface expected by TicketCard
                        const domainTicket: DomainTicket = {
                          id: ticket.id?.toString() || idx.toString(),
                          eventId: eventInfo?.event_id?.toString() || '',
                          eventTitle: eventInfo?.eventTitle || eventInfo?.title || 'Unknown Event',
                          eventDate: eventInfo?.eventDate || eventInfo?.event_date || '',
                          eventTime: eventInfo?.eventTime || eventInfo?.event_time || '',
                          venue: eventInfo?.venue || eventInfo?.location || '',
                          city: eventInfo?.city || '',
                          ticketType: ticket.ticket_type?.name || 'Tiket',
                          quantity: 1,
                          price: ticket.ticket_type?.price || 0,
                          eventImage: eventInfo?.eventImage || eventInfo?.image || '',
                          orderDate: String(pendingOrder.createdAt || ''),
                          ticketCode: ticket.ticket_code,
                          eventStatus: status === 'pending' ? 'pending' : 'active'
                        };

                        return (
                          <TicketCard 
                            key={idx}
                            ticket={domainTicket}
                            formatPrice={formatPrice}
                            formatDate={formatDate}
                            isUpcoming={status === 'paid'}
                            onShowQR={() => setSelectedTicketForQR(domainTicket)}
                          />
                        );
                      })}
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
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal Portal */}
      {selectedTicketForQR && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedTicketForQR(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ticket Notches for Modal */}
            <div className="absolute top-1/2 -mt-4 -left-4 w-8 h-8 rounded-full bg-black/70" />
            <div className="absolute top-1/2 -mt-4 -right-4 w-8 h-8 rounded-full bg-black/70" />

            <div className="text-center">
              <div className="mb-4">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                  E-Ticket Resmi
                </Badge>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{selectedTicketForQR.eventTitle}</h3>
              <p className="text-xs text-slate-500 mb-6">{selectedTicketForQR.ticketType}</p>
              
              <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 flex items-center justify-center shadow-inner">
                <canvas ref={qrCanvasRef} className="max-w-full h-auto" />
              </div>
              
              <div className="space-y-1 mb-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Kode Tiket</p>
                <p className="text-xl font-mono font-black text-primary tracking-tighter">{selectedTicketForQR.ticketCode}</p>
              </div>
              
              <Button 
                onClick={() => setSelectedTicketForQR(null)}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-12 rounded-xl border-0 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}