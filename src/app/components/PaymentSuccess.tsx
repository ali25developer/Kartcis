import { CheckCircle, Download, Mail, Ticket, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { PendingOrder } from '../types/pendingOrder';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface PaymentSuccessProps {
  pendingOrder: PendingOrder;
}

export function PaymentSuccess({ pendingOrder }: PaymentSuccessProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (pendingOrder?.orderId) {
        QRCode.toDataURL(pendingOrder.orderId, { width: 200, margin: 1 }, (err, url) => {
            if (!err) {
                setQrCodeUrl(url);
            }
        });
    }
  }, [pendingOrder]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleDownloadTicket = () => {
    // Mock download - in production this would download actual PDF
    alert('Download e-ticket will be implemented with backend integration');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-green-600 to-green-700">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Pembayaran Berhasil!</h2>
                <p className="text-green-100 text-sm">Order ID: {pendingOrder.orderId}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Success Message */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {isAuthenticated 
                      ? 'Pembayaran Anda telah dikonfirmasi'
                      : 'E-ticket telah dikirim ke email Anda'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isAuthenticated
                      ? 'Tiket sudah tersimpan di menu "Tiket Saya". Anda juga akan menerima e-ticket via email.'
                      : `Kami telah mengirim e-ticket ke ${pendingOrder.customerInfo.email}. Periksa inbox atau folder spam.`}
                  </p>
                </div>
              </div>
            </Card>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center py-6 bg-white border-b border-gray-100">
               <div className="bg-white p-4 rounded-xl border-4 border-gray-100 shadow-sm relative">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt={`QR Code ${pendingOrder.orderId}`} className="w-[200px] h-[200px]" />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
               </div>
               <p className="mt-4 text-sm font-medium text-gray-500">Scan QR Code ini untuk Check-in</p>
               <p className="text-xs text-gray-400 font-mono mt-1">{pendingOrder.orderId}</p>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Detail Pesanan</h3>
              <Card className="divide-y">
                {pendingOrder.items.map((item, index) => (
                  <div key={index} className="p-4 flex gap-4">
                    <img
                      src={item.eventImage}
                      alt={item.eventTitle}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.eventTitle}</h4>
                      <p className="text-sm text-gray-600">{item.ticketType}</p>
                      <p className="text-sm text-gray-600">Jumlah: {item.quantity} tiket</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Pembayaran</span>
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(pendingOrder.totalAmount)}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informasi Pemesan</h3>
              <Card className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nama</span>
                  <span className="font-medium text-gray-900">{pendingOrder.customerInfo.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900">{pendingOrder.customerInfo.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">No. HP</span>
                  <span className="font-medium text-gray-900">{pendingOrder.customerInfo.phone}</span>
                </div>
              </Card>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {isAuthenticated && (
                <Button
                  onClick={() => navigate('/my-tickets')}
                  className="w-full bg-primary hover:bg-primary-hover"
                >
                  <Ticket className="h-5 w-5 mr-2" />
                  Lihat Tiket Saya
                </Button>
              )}
              
              <Button
                onClick={handleDownloadTicket}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Download E-Ticket (PDF)
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                Kembali ke Beranda
              </Button>

              {!isAuthenticated && (
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <div className="flex gap-2 items-start">
                    <Mail className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      Simpan email konfirmasi ini untuk akses tiket Anda. Untuk kemudahan di masa depan, 
                      pertimbangkan untuk membuat akun.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}