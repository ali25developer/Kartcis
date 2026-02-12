import { ArrowLeft, Shield, Lock, Eye, FileText, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 p-8 sm:p-12 text-white">
            <Link to="/" className="inline-flex items-center text-sky-100 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-sky-100 text-3xl sm:text-4xl font-bold">Kebijakan Privasi</h1>
            </div>
            <p className="text-sky-100 max-w-2xl text-lg">
              Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. 
              Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda.
            </p>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-12">
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-light rounded-lg text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Informasi yang Kami Kumpulkan</h2>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Kami mengumpulkan berbagai jenis informasi untuk memberikan dan meningkatkan layanan kami kepada Anda:
              </p>
              <ul className="space-y-3 text-gray-600 pl-4 border-l-2 border-sky-100">
                <li className="flex gap-3">
                  <span className="font-semibold min-w-32">Data Pribadi:</span>
                  <span>Nama lengkap, alamat email, nomor telepon, dan tanggal lahir saat Anda mendaftar atau melakukan pembelian.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold min-w-32">Data Transaksi:</span>
                  <span>Detail pesanan, jumlah pembayaran, dan metode pembayaran yang digunakan.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold min-w-32">Data Teknis:</span>
                  <span>Alamat IP, jenis browser, versi perangkat, dan sistem operasi yang Anda gunakan untuk mengakses platform kami.</span>
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-light rounded-lg text-primary">
                  <Eye className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Layanan Utama</h3>
                  <p className="text-gray-600 text-sm">
                    Memproses tiket, mengirim konfirmasi pesanan, dan memfasilitasi check-in event.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Komunikasi</h3>
                  <p className="text-gray-600 text-sm">
                    Mengirim notifikasi penting tentang event, perubahan jadwal, atau pembatalan.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Keamanan</h3>
                  <p className="text-gray-600 text-sm">
                    Mendeteksi dan mencegah penipuan, penyalahgunaan, atau aktivitas ilegal lainnya.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Pengembangan</h3>
                  <p className="text-gray-600 text-sm">
                    Menganalisis penggunaan untuk meningkatkan fitur dan pengalaman pengguna.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-light rounded-lg text-primary">
                  <Globe className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Berbagi Data dengan Pihak Ketiga</h2>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Kami tidak menjual data pribadi Anda. Namun, kami membagikan data kepada pihak-pihak tepercaya berikut untuk operasional layanan:
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border rounded-lg hover:border-sky-200 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Organizer Event</h4>
                    <p className="text-sm text-gray-500">Untuk keperluan validasi tiket dan komunikasi terkait spesifik event.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 border rounded-lg hover:border-sky-200 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Payment Gateway (Flip/Midtrans)</h4>
                    <p className="text-sm text-gray-500">Untuk memproses pembayaran secara aman dan terenkripsi.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-light rounded-lg text-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">4. Keamanan Data</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kami menerapkan standar keamanan industri tertinggi untuk melindungi data Anda, termasuk enkripsi SSL/TLS untuk semua transmisi data 
                dan penyimpanan data yang aman. Namun, perlu diingat bahwa tidak ada metode transmisi internet yang 100% aman.
              </p>
            </section>

            <div className="border-t pt-8 mt-12">
              <h3 className="font-semibold text-gray-900 mb-2">Hubungi Petugas Privasi Kami</h3>
              <p className="text-gray-600 mb-4">
                Jika Anda memiliki pertanyaan tentang kebijakan ini, silakan hubungi:
              </p>
              <div className="bg-primary-light inline-block px-4 py-2 rounded-lg text-primary-hover font-medium">
                privacy@masup.id
              </div>
              <p className="text-gray-400 text-sm mt-6">
                Terakhir diperbarui: 25 Januari 2026
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
