import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-8 sm:p-12 text-white">
            <Link to="/" className="inline-flex items-center text-orange-100 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <RefreshCw className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-orange-100 ext-3xl sm:text-4xl font-bold">Kebijakan Pengembalian Dana (Refund)</h1>
            </div>
            <p className="text-orange-100 max-w-2xl text-lg">
              Kami memahami bahwa rencana bisa berubah. Berikut adalah panduan lengkap mengenai proses refund tiket di Kartcis.
            </p>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-12">
            
            {/* Kebijakan Dasar */}
            <section className="bg-orange-50 rounded-xl p-6 border border-orange-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Prinsip Dasar
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Secara umum, tiket yang sudah dibeli <span className="font-bold">TIDAK DAPAT DIKEMBALIKAN (Non-Refundable)</span> kecuali 
                event tersebut DIBATALKAN oleh penyelenggara atau mengalami perubahan jadwal yang signifikan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Kondisi yang Memenuhi Syarat Refund</h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                   <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                   <div>
                     <h3 className="font-semibold text-gray-900">Event Dibatalkan</h3>
                     <p className="text-sm text-gray-600 mt-1">
                       Jika event dibatalkan sepenuhnya oleh penyelenggara, Anda berhak mendapatkan pengembalian dana penuh (100%) dari harga tiket.
                     </p>
                   </div>
                </div>
                <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                   <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                   <div>
                     <h3 className="font-semibold text-gray-900">Perubahan Jadwal (Reschedule)</h3>
                     <p className="text-sm text-gray-600 mt-1">
                       Jika tanggal event diubah dan Anda tidak dapat hadir pada tanggal baru, Anda dapat mengajukan refund dalam batas waktu yang ditentukan.
                     </p>
                   </div>
                </div>
                <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                   <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                   <div>
                     <h3 className="font-semibold text-gray-900">Alasan Pribadi</h3>
                     <p className="text-sm text-gray-600 mt-1">
                       Refund TIDAK berlaku untuk alasan pribadi seperti sakit, bentrok jadwal, macet, atau kesalahan pembelian oleh user.
                     </p>
                   </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Proses Pengajuan Refund</h2>
              <div className="relative border-l-2 border-gray-200 pl-8 space-y-10">
                <div className="relative">
                  <div className="absolute -left-[41px] top-0 bg-white border-2 border-orange-500 text-orange-600 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <h3 className="font-semibold text-gray-900 text-lg">Konfirmasi Pembatalan</h3>
                  <p className="text-gray-600 mt-2">
                    Tunggu pengumuman resmi pembatalan event dari kami via email/WhatsApp. Kami akan mengirimkan link formulir refund.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[41px] top-0 bg-white border-2 border-orange-500 text-orange-600 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <h3 className="font-semibold text-gray-900 text-lg">Pengisian Data</h3>
                  <p className="text-gray-600 mt-2">
                    Isi formulir refund dengan data pemesan yang sesuai ID pembelian. Pastikan nomor rekening tujuan benar.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[41px] top-0 bg-white border-2 border-orange-500 text-orange-600 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <h3 className="font-semibold text-gray-900 text-lg">Verifikasi & Pencairan</h3>
                  <p className="text-gray-600 mt-2">
                    Pencairan dana memakan waktu 14-30 hari kerja setelah periode pengajuan ditutup. Dana akan dikirim ke rekening pemesan awal.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t pt-8 mt-12 bg-gray-50 -mx-8 -mb-8 sm:-mx-12 sm:-mb-12 p-8 sm:p-12">
               <p className="text-gray-500 text-sm italic">
                 *Biaya admin dan biaya layanan bank mungkin tidak dapat dikembalikan tergantung kebijakan payment gateway.
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
