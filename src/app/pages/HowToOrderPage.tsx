import { ArrowLeft, ShoppingCart, CreditCard, Ticket, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function HowToOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 sm:p-12 text-white">
            <Link to="/" className="inline-flex items-center text-blue-100 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Ticket className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-blue-100 text-3xl sm:text-4xl font-bold">Cara Pesan Tiket</h1>
            </div>
            <p className="text-blue-100 max-w-2xl text-lg">
              Panduan langkah demi langkah memesan tiket pengalaman seru Anda di Kartcis.
            </p>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center md:items-end md:w-24">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">1</div>
                  <div className="hidden md:block w-0.5 h-full bg-blue-50 my-2 -mr-6"></div>
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Pilih Event Favoritmu</h3>
                  <p className="text-gray-600 mb-4">
                    Jelajahi berbagai event menarik di halaman utama. Gunakan fitur pencarian atau filter kategori untuk menemukan konser, workshop, atau festival yang kamu cari.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/">Jelajahi Event</Link>
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center md:items-end md:w-24">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">2</div>
                  <div className="hidden md:block w-0.5 h-full bg-blue-50 my-2 -mr-6"></div>
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    Pilih Tiket & Checkout
                  </h3>
                  <p className="text-gray-600">
                     Pilih kategori tiket yang diinginkan (Regular, VIP, dll) dan tentukan jumlahnya. Klik "Beli Tiket" untuk memasukkan ke keranjang, lalu lanjut ke halaman Checkout.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center md:items-end md:w-24">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">3</div>
                  <div className="hidden md:block w-0.5 h-full bg-blue-50 my-2 -mr-6"></div>
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Isi Data Diri</h3>
                  <p className="text-gray-600">
                    Lengkapi data pemesan dan data pengunjung. Pastikan alamat email dan nomor WhatsApp benar, karena E-Ticket akan dikirim ke sana.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center md:items-end md:w-24">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">4</div>
                  <div className="hidden md:block w-0.5 h-full bg-blue-50 my-2 -mr-6"></div>
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Lakukan Pembayaran
                  </h3>
                  <p className="text-gray-600">
                    Pilih metode pembayaran (Virtual Account, QRIS, E-Wallet). Selesaikan pembayaran sebelum batas waktu berakhir (biasanya 24 jam).
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center md:items-end md:w-24">
                  <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">5</div>
                </div>
                <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Tiket Terbit!
                  </h3>
                  <p className="text-green-800">
                    Setelah pembayaran terkonfirmasi, E-Ticket otomatis muncul di halaman "Tiket Saya". Tunjukkan QR Code tiket ini saat masuk ke venue acara.
                  </p>
                  <Button className="mt-4 bg-green-600 hover:bg-green-700" asChild>
                    <Link to="/my-tickets">Cek Tiket Saya</Link>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
