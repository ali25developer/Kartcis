import { X, Copy, CheckCircle2, Clock, AlertCircle, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useState, useEffect } from 'react';
import { toast } from '@/app/utils/toast';

interface VirtualAccountDetailProps {
  isOpen: boolean;
  onClose: () => void;
  bank: string;
  amount: number;
  orderId: string;
  onComplete: () => void;
  onChangePaymentMethod?: () => void;
  onPaymentSuccess: () => void;
}

export function VirtualAccountDetail({ 
  isOpen, 
  onClose, 
  bank, 
  amount,
  orderId,
  onComplete,
  onChangePaymentMethod,
  onPaymentSuccess
}: VirtualAccountDetailProps) {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [vaNumber] = useState(() => {
    // Generate VA number based on bank
    const bankCodes: Record<string, string> = {
      'BCA': '70012',
      'Mandiri': '88008',
      'BNI': '8808',
      'BRI': '26215',
      'Permata': '8528'
    };
    const code = bankCodes[bank] || '70012';
    const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return `${code}${random}`;
  });

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

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
    toast.success('Nomor VA disalin ke clipboard', {
      action: {
        label: 'Tutup',
        onClick: () => {},
      },
    });
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const checkPaymentStatus = async () => {
    setIsCheckingStatus(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mock payment status check - 70% chance of success for demo
      const isPaid = Math.random() > 0.3;
      
      if (isPaid) {
        toast.success('Pembayaran berhasil dikonfirmasi!', {
          action: {
            label: 'Tutup',
            onClick: () => {},
          },
        });
        onPaymentSuccess();
        onClose();
      } else {
        toast.error('Pembayaran belum diterima', {
          description: 'Silakan coba lagi dalam beberapa menit atau hubungi customer service.',
          action: {
            label: 'Tutup',
            onClick: () => {},
          },
        });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memeriksa status pembayaran.', {
        action: {
          label: 'Tutup',
          onClick: () => {},
        },
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as Element).className.includes('min-h-screen')) {
          onClose();
        }
      }}
    >
      <div className="min-h-screen py-8 px-4">
        <div
          className="max-w-2xl mx-auto bg-white rounded-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Menunggu Pembayaran</h2>
                <p className="text-blue-100 text-sm">Transfer Bank {bank}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Timer */}
            <Card className="p-4 bg-accent-orange-light border-orange-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent-orange-hover" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">Selesaikan pembayaran dalam</p>
                  <p className="text-2xl font-bold text-accent-orange-hover">{formatTime(timeLeft)}</p>
                </div>
              </div>
            </Card>

            {/* VA Number */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nomor Virtual Account {bank}
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
                    {formatPrice(amount)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(amount.toString())}
                  className="h-auto px-4"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Transfer sesuai jumlah di atas agar pembayaran dapat diproses otomatis
              </p>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cara Pembayaran</h3>
              <Card className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Buka aplikasi mobile banking atau internet banking {bank} Anda
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Pilih menu Transfer ke Virtual Account atau Rekening Lain
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Masukkan nomor Virtual Account: <span className="font-mono font-semibold">{vaNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Masukkan jumlah transfer: <span className="font-semibold">{formatPrice(amount)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
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
            <Card className="p-4 bg-primary-light border-sky-200">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
                onClick={handleComplete}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Saya Sudah Transfer
              </Button>
              
              {onChangePaymentMethod && (
                <Button
                  onClick={onChangePaymentMethod}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  Ganti Metode Pembayaran
                </Button>
              )}
              
              <Button
                onClick={checkPaymentStatus}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? 'Memeriksa...' : 'Periksa Status Pembayaran'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}