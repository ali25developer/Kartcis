import { ArrowLeft, Book, AlertCircle, HelpCircle, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 sm:p-12 text-white">
            <Link to="/" className="inline-flex items-center text-emerald-100 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Book className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-emerald-100 text-3xl sm:text-4xl font-bold">Syarat & Ketentuan</h1>
            </div>
            <p className="text-emerald-100 max-w-2xl text-lg">
              Harap baca syarat dan ketentuan ini dengan saksama sebelum menggunakan layanan Kartcis.
            </p>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-12">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-emerald-600 text-xl">01.</span> Ketentuan Umum
              </h2>
              <div className="prose prose-gray max-w-none text-gray-600">
                <p>
                  Dengan mengakses dan menggunakan platform Kartcis, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. 
                  Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan layanan kami.
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li>Pengguna wajib berusia minimal 17 tahun atau memiliki izin wali.</li>
                  <li>Informasi akun harus akurat dan terkini.</li>
                  <li>Anda bertanggung jawab menjaga kerahasiaan akun Anda.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-emerald-600 text-xl">02.</span> Pembelian & Pembayaran
              </h2>
              <div className="prose prose-gray max-w-none text-gray-600">
                <p>
                  Kartcis bertindak sebagai agen penjualan tiket atas nama Penyelenggara Event.
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li>Semua harga tiket sudah termasuk pajak yang berlaku, kecuali dinyatakan lain.</li>
                  <li>Pesanan Anda baru dikonfirmasi setelah pembayaran lunas diterima.</li>
                  <li>Batas waktu pembayaran untuk Virtual Account adalah 24 jam.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-emerald-600 text-xl">03.</span> Penggunaan Tiket
              </h2>
              <div className="text-gray-600 space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex gap-3">
                  <FileCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    E-Ticket yang valid akan dikirimkan ke email Anda dan tersedia di halaman "Tiket Saya". 
                    Wajib menunjukkan E-Ticket ini saat masuk venue.
                  </p>
                </div>
                <p>
                  Penyelenggara berhak menolak masuk jika tiket terbukti palsu atau sudah digunakan sebelumnya.
                  Satu tiket hanya berlaku untuk satu orang, kecuali dinyatakan lain pada jenis tiket.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-emerald-600 text-xl">04.</span> Pembatalan & Larangan
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Kami memiliki kebijakan ketat terhadap praktik percaloan dan penipuan:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" /> Scalping
                    </h4>
                    <p className="text-sm">Menjual kembali tiket dengan harga di atas harga resmi dilarang keras.</p>
                  </div>
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" /> Botting
                    </h4>
                    <p className="text-sm">Penggunaan software otomatis untuk memborong tiket akan mengakibatkan banned permanen.</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="border-t pt-8 mt-12 bg-gray-50 -mx-8 -mb-8 sm:-mx-12 sm:-mb-12 p-8 sm:p-12">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-gray-400" /> Pertanyaan?
              </h3>
              <p className="text-gray-600 mb-4">
                Tim support kami siap membantu Anda memahami ketentuan ini.
              </p>
              <div className="flex gap-4">
                <Link to="/contact" className="text-emerald-600 font-medium hover:underline">Hubungi Kami</Link>
                <Link to="/faq" className="text-emerald-600 font-medium hover:underline">Lihat FAQ</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
