import { X } from 'lucide-react';
import { Button } from './ui/button';

interface HelpModalProps {
  isOpen?: boolean;
  onClose: () => void;
  type: 'cara-pesan' | 'syarat-ketentuan' | 'kebijakan-privasi';
}

export function HelpModal({ isOpen = true, onClose, type }: HelpModalProps) {
  if (!isOpen) return null;

  const getContent = () => {
    switch (type) {
      case 'cara-pesan':
        return {
          title: 'Cara Pesan Tiket',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">1. Pilih Event yang Anda Inginkan</h3>
                <p className="text-gray-600">
                  Browse event yang tersedia di halaman utama atau gunakan fitur pencarian untuk menemukan event spesifik. 
                  Anda juga bisa filter berdasarkan kategori seperti Olahraga, Musik, Workshop, dll.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">2. Lihat Detail Event</h3>
                <p className="text-gray-600">
                  Klik pada card event untuk melihat informasi lengkap seperti tanggal, lokasi, deskripsi, 
                  dan pilihan tipe tiket yang tersedia beserta harganya.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">3. Pilih Tipe Tiket dan Jumlah</h3>
                <p className="text-gray-600">
                  Pilih tipe tiket yang sesuai dengan kebutuhan Anda (Early Bird, Regular, VIP, dll). 
                  Tentukan jumlah tiket yang ingin dibeli, lalu klik tombol "Tambah ke Keranjang".
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">4. Review Keranjang Belanja</h3>
                <p className="text-gray-600">
                  Klik ikon keranjang di header untuk melihat semua tiket yang telah Anda pilih. 
                  Anda bisa mengubah jumlah tiket atau menghapus item dari keranjang.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">5. Pemesanan dan Pembayaran</h3>
                <p className="text-gray-600">
                  Klik "Lanjut ke Pembayaran" dan isi data diri Anda. Pilih metode pembayaran 
                  (Virtual Account BCA, Mandiri, BNI, BRI, atau Permata). Anda akan mendapatkan 
                  nomor Virtual Account dan instruksi pembayaran.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">6. Selesaikan Pembayaran</h3>
                <p className="text-gray-600">
                  Transfer sesuai nominal yang tertera ke nomor Virtual Account dalam waktu 24 jam. 
                  Setelah pembayaran dikonfirmasi, tiket Anda akan tersedia di menu "Tiket Saya".
                </p>
              </div>

              <div className="bg-primary-light border border-sky-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-sky-900 mb-2">💡 Tips:</h4>
                <ul className="text-sm text-sky-800 space-y-1 list-disc list-inside">
                  <li>Pesan tiket lebih awal untuk mendapatkan harga Early Bird</li>
                  <li>Simpan nomor Virtual Account dan lakukan pembayaran sebelum expired</li>
                  <li>Screenshot atau simpan QR code tiket Anda untuk check-in event</li>
                  <li>Tunjukkan QR code atau kode booking saat masuk venue</li>
                </ul>
              </div>
            </div>
          ),
        };

      case 'syarat-ketentuan':
        return {
          title: 'Syarat & Ketentuan',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">1. Ketentuan Umum</h3>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Pengguna wajib berusia minimal 17 tahun atau memiliki izin dari orang tua/wali</li>
                  <li>Informasi yang diberikan saat pendaftaran harus valid dan akurat</li>
                  <li>Satu akun hanya boleh digunakan oleh satu pengguna</li>
                  <li>Pengguna bertanggung jawab menjaga keamanan akun dan password</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">2. Pembelian Tiket</h3>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Harga tiket sudah termasuk biaya admin dan pajak (jika ada)</li>
                  <li>Pembayaran harus diselesaikan dalam waktu 24 jam setelah pemesanan</li>
                  <li>Pesanan yang tidak dibayar akan otomatis dibatalkan</li>
                  <li>Tiket yang sudah dibeli tidak dapat dikembalikan atau direfund kecuali event dibatalkan</li>
                  <li>Maksimal pembelian per transaksi sesuai kuota yang ditetapkan organizer</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">3. Penggunaan Tiket</h3>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Tiket bersifat personal dan tidak dapat dipindahtangankan tanpa izin organizer</li>
                  <li>Satu tiket hanya berlaku untuk satu orang masuk</li>
                  <li>Pembeli wajib membawa identitas diri saat masuk venue (KTP/SIM/Paspor)</li>
                  <li>QR code atau kode booking wajib ditunjukkan saat check-in</li>
                  <li>Tiket yang sudah di-scan tidak dapat digunakan kembali</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">4. Pembatalan Event</h3>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Jika event dibatalkan, pembeli akan menerima refund 100% dalam 7-14 hari kerja</li>
                  <li>Jika event ditunda, tiket tetap berlaku untuk tanggal pengganti</li>
                  <li>Pembeli yang tidak bisa hadir di tanggal pengganti dapat mengajukan refund</li>
                  <li>MASUP.ID tidak bertanggung jawab atas perubahan jadwal yang dilakukan organizer</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">5. Tanggung Jawab</h3>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>MASUP.ID hanya bertindak sebagai platform penjualan tiket</li>
                  <li>Penyelenggaraan event adalah tanggung jawab organizer</li>
                  <li>MASUP.ID tidak bertanggung jawab atas kualitas, keamanan, atau insiden di event</li>
                  <li>Pengguna bertanggung jawab atas perilaku mereka selama event berlangsung</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">6. Larangan</h3>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Dilarang menjual kembali tiket dengan harga lebih tinggi (calo/scalping)</li>
                  <li>Dilarang membuat duplikasi atau pemalsuan tiket</li>
                  <li>Dilarang menggunakan bot atau automated tools untuk pembelian massal</li>
                  <li>Dilarang memberikan informasi palsu atau menyesatkan</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-amber-900 mb-2">⚠️ Penting:</h4>
                <p className="text-sm text-amber-800">
                  Dengan melakukan pemesanan, Anda dianggap telah membaca, memahami, dan menyetujui 
                  seluruh syarat dan ketentuan yang berlaku. MASUP.ID berhak mengubah syarat dan ketentuan 
                  sewaktu-waktu tanpa pemberitahuan terlebih dahulu.
                </p>
              </div>
            </div>
          ),
        };

      case 'kebijakan-privasi':
        return {
          title: 'Kebijakan Privasi',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">1. Informasi yang Kami Kumpulkan</h3>
                <p className="text-gray-600 mb-2">Kami mengumpulkan informasi berikut dari pengguna:</p>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li><strong>Data Pribadi:</strong> Nama lengkap, email, nomor telepon, tanggal lahir</li>
                  <li><strong>Data Pembayaran:</strong> Informasi transaksi dan metode pembayaran</li>
                  <li><strong>Data Teknis:</strong> IP address, browser type, device information</li>
                  <li><strong>Data Penggunaan:</strong> Riwayat pencarian, event yang dilihat, pembelian</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">2. Penggunaan Informasi</h3>
                <p className="text-gray-600 mb-2">Informasi yang dikumpulkan digunakan untuk:</p>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Memproses pemesanan dan pembayaran tiket</li>
                  <li>Mengirimkan konfirmasi pemesanan dan tiket elektronik</li>
                  <li>Memberikan notifikasi terkait event dan transaksi</li>
                  <li>Meningkatkan pengalaman pengguna di platform</li>
                  <li>Melakukan analisis untuk pengembangan layanan</li>
                  <li>Mengirimkan promosi dan penawaran khusus (dengan persetujuan)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">3. Berbagi Informasi</h3>
                <p className="text-gray-600 mb-2">Kami dapat membagikan informasi Anda kepada:</p>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li><strong>Organizer Event:</strong> Untuk keperluan check-in dan komunikasi event</li>
                  <li><strong>Payment Gateway:</strong> Untuk memproses transaksi pembayaran</li>
                  <li><strong>Partner Teknologi:</strong> Untuk analitik dan infrastruktur platform</li>
                  <li><strong>Instansi Hukum:</strong> Jika diwajibkan oleh hukum atau proses hukum</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  Kami TIDAK akan menjual data pribadi Anda kepada pihak ketiga untuk tujuan marketing.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">4. Keamanan Data</h3>
                <p className="text-gray-600 mb-2">Kami menerapkan langkah-langkah keamanan:</p>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Enkripsi SSL/TLS untuk transmisi data sensitif</li>
                  <li>Penyimpanan password dengan hashing dan salting</li>
                  <li>Pembatasan akses ke data pribadi hanya untuk staf berwenang</li>
                  <li>Monitoring dan audit keamanan secara berkala</li>
                  <li>Backup data secara rutin untuk mencegah kehilangan data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">5. Cookies dan Teknologi Pelacakan</h3>
                <p className="text-gray-600 mb-2">
                  Kami menggunakan cookies untuk meningkatkan pengalaman pengguna:
                </p>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li><strong>Essential Cookies:</strong> Diperlukan untuk fungsi dasar website</li>
                  <li><strong>Analytics Cookies:</strong> Untuk memahami perilaku pengguna</li>
                  <li><strong>Marketing Cookies:</strong> Untuk menampilkan iklan yang relevan</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  Anda dapat mengatur preferensi cookies melalui browser Anda.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">6. Hak Pengguna</h3>
                <p className="text-gray-600 mb-2">Anda memiliki hak untuk:</p>
                <ul className="text-gray-600 space-y-2 list-disc list-inside">
                  <li>Mengakses dan mendapatkan salinan data pribadi Anda</li>
                  <li>Memperbarui atau mengoreksi data yang tidak akurat</li>
                  <li>Menghapus data pribadi Anda (dengan batasan tertentu)</li>
                  <li>Menolak atau membatasi pemrosesan data tertentu</li>
                  <li>Menarik persetujuan untuk komunikasi marketing</li>
                  <li>Mengajukan keluhan ke otoritas perlindungan data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">7. Penyimpanan Data</h3>
                <p className="text-gray-600">
                  Data pribadi Anda akan disimpan selama akun Anda aktif atau selama diperlukan untuk 
                  menyediakan layanan. Setelah itu, data akan dihapus atau dianonimkan, kecuali jika 
                  kami diwajibkan oleh hukum untuk menyimpannya lebih lama.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">8. Perubahan Kebijakan</h3>
                <p className="text-gray-600">
                  Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan signifikan 
                  akan diinformasikan melalui email atau notifikasi di platform. Tanggal revisi terakhir 
                  akan ditampilkan di bagian atas kebijakan.
                </p>
              </div>

              <div className="bg-primary-light border border-sky-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-sky-900 mb-2">📧 Hubungi Kami:</h4>
                <p className="text-sm text-sky-800">
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi atau ingin menggunakan 
                  hak Anda terkait data pribadi, silakan hubungi kami di:
                </p>
                <p className="text-sm text-sky-800 mt-2">
                  <strong>Email:</strong> privacy@masup.id<br />
                  <strong>Phone:</strong> 021-1234-5678
                </p>
              </div>

              <div className="text-xs text-gray-500 mt-6 pt-4 border-t">
                Terakhir diperbarui: 11 Januari 2026
              </div>
            </div>
          ),
        };

      default:
        return { title: '', content: null };
    }
  };

  const { title, content } = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 sticky bottom-0">
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-hover"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}