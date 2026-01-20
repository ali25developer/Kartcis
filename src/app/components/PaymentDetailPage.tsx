import { Copy, CheckCircle2, Clock, Building2, Wallet, QrCode, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PendingOrder } from '@/app/types/pendingOrder';

interface PaymentDetailPageProps {
  pendingOrder: PendingOrder;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export function PaymentDetailPage({ 
  pendingOrder,
  onPaymentSuccess,
  onCancel
}: PaymentDetailPageProps) {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const remaining = pendingOrder.expiryTime - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = pendingOrder.expiryTime - Date.now();
      const seconds = Math.max(0, Math.floor(remaining / 1000));
      setTimeLeft(seconds);
      
      if (seconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingOrder.expiryTime]);

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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mock payment status check - 70% chance of success for demo
      const isPaid = Math.random() > 0.3;
      
      if (isPaid) {
        toast.success('Pembayaran berhasil dikonfirmasi!');
        onPaymentSuccess();
      } else {
        toast.error('Pembayaran belum diterima', {
          description: 'Silakan coba lagi dalam beberapa menit atau hubungi customer service.',
        });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memeriksa status pembayaran.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Backward compatibility for old data structure
  const paymentType = pendingOrder.paymentType || 'va';
  const paymentMethod = pendingOrder.paymentMethod || (pendingOrder as any).bank || 'BCA';
  const vaNumber = pendingOrder.vaNumber || (pendingOrder as any).vaNumber;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b bg-gradient-to-r from-sky-600 to-sky-700">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {paymentType === 'va' && <Building2 className="h-6 w-6 text-white" />}
                {paymentType === 'ewallet' && <Wallet className="h-6 w-6 text-white" />}
                {paymentType === 'qris' && <QrCode className="h-6 w-6 text-white" />}
                {paymentType === 'credit_card' && <CreditCard className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Menunggu Pembayaran</h1>
                <p className="text-sky-100 text-sm">{paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Timer */}
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">Selesaikan pembayaran dalam</p>
                  <p className="text-2xl font-bold text-orange-600">{formatTime(timeLeft)}</p>
                </div>
              </div>
            </Card>

            {/* VA Number */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nomor Virtual Account {paymentMethod}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                    {vaNumber}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(vaNumber)}
                  className="h-auto px-4"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Total Pembayaran
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(pendingOrder.amount)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(pendingOrder.amount.toString())}
                  className="h-auto px-4"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Transfer sesuai jumlah di atas agar pembayaran dapat diproses otomatis
              </p>
            </div>

            {/* Order Details */}
            {pendingOrder.orderDetails?.items && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Detail Pesanan</h3>
                <Card className="p-4 space-y-3">
                  {pendingOrder.orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.eventTitle}</p>
                        <p className="text-sm text-gray-600">{item.ticketType} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cara Pembayaran</h3>
              <Card className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Buka aplikasi mobile banking atau internet banking {paymentMethod} Anda
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Pilih menu Transfer ke Virtual Account atau Rekening Lain
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Masukkan nomor Virtual Account: <span className="font-mono font-semibold">{vaNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Masukkan jumlah transfer: <span className="font-semibold">{formatPrice(pendingOrder.amount)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-semibold">
                    5
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Periksa detail transaksi dan konfirmasi pembayaran
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Info */}
            <Card className="p-4 bg-sky-50 border-sky-200">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Selesaikan pembayaran sebelum batas waktu
                  </p>
                  <p className="text-sm text-gray-600">
                    Transaksi akan dibatalkan otomatis jika pembayaran tidak diterima.
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={checkPaymentStatus}
                className="w-full bg-sky-600 hover:bg-sky-700"
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? 'Memeriksa...' : 'Periksa Status Pembayaran'}
              </Button>
              
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                Batalkan Pembayaran
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}