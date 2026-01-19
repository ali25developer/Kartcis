export interface Event {
  id: string;
  title: string;
  organizer: string;
  category: 'Olahraga' | 'Musik' | 'Workshop' | 'Seminar' | 'Kuliner' | 'Charity';
  date: string;
  time: string;
  venue: string;
  city: string;
  image: string;
  price: {
    min: number;
    max: number;
  };
  description: string;
  detailedDescription?: string; // Deskripsi lengkap multi-paragraph
  facilities?: string[]; // Fasilitas yang didapat
  terms?: string[]; // Syarat dan ketentuan
  agenda?: AgendaItem[]; // Rundown acara
  organizerInfo?: OrganizerInfo; // Info lengkap organizer
  faqs?: FAQ[]; // Frequently Asked Questions
  status?: 'active' | 'sold-out' | 'cancelled'; // Status event
  cancelReason?: string; // Alasan pembatalan (jika cancelled)
  isFeatured?: boolean;
  ticketTypes: TicketType[];
  quota: number;
  registrationForm?: RegistrationFormField[];
}

export interface AgendaItem {
  time: string;
  activity: string;
}

export interface OrganizerInfo {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Harga asli sebelum diskon
  available: number;
  total: number;
  description: string;
}

export interface RegistrationFormField {
  fieldId: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export const events: Event[] = [
  {
    id: '1',
    title: 'Jakarta Marathon 2026',
    organizer: 'Indonesia Runners',
    category: 'Olahraga',
    date: '2026-03-15',
    time: '05:00',
    venue: 'Monas',
    city: 'Jakarta',
    image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1080\" height=\"720\"%3E%3Crect width=\"1080\" height=\"720\" fill=\"%23e5e7eb\"/%3E%3C/svg%3E',
    price: { min: 120000, max: 500000 },
    description: 'Ikuti Jakarta Marathon 2026! Tersedia kategori 5K, 10K, Half Marathon, dan Full Marathon. Dapatkan jersey eksklusif dan medali finisher.',
    detailedDescription: 'Jakarta Marathon 2026 kembali hadir sebagai event lari terbesar di Indonesia! Tahun ini kami menghadirkan rute baru yang melewati landmark-landmark ikonik Jakarta seperti Bundaran HI, Monas, dan Kota Tua.\n\nEvent ini terbuka untuk semua level pelari, dari pemula hingga profesional. Dengan 4 kategori yang tersedia, Anda bisa memilih jarak yang sesuai dengan kemampuan: Fun Run 5K untuk pemula dan keluarga, 10K untuk yang ingin tantangan lebih, Half Marathon 21K untuk pelari berpengalaman, dan Full Marathon 42K untuk pelari serius.\n\nJakarta Marathon bukan hanya tentang berlari - ini adalah celebration of health, community, dan spirit Jakarta! Dengan lebih dari 5000 peserta yang diharapkan, event ini akan menjadi momen yang tak terlupakan.',
    facilities: [
      'Jersey eksklusif Jakarta Marathon 2026 (design limited edition)',
      'Medali finisher untuk semua kategori',
      'Race bib dengan timing chip',
      'Goodie bag berisi produk sponsor (kategori Half & Full Marathon)',
      'Hydration stations setiap 2.5 km',
      'Medical support dan ambulans standby',
      'Sertifikat digital finisher',
      'Gratis foto profesional di finish line',
      'Post-race snack dan minuman',
      'Akses ke post-race festival area'
    ],
    terms: [
      'Peserta minimal berusia 15 tahun untuk kategori 5K dan 10K, 17 tahun untuk Half Marathon, dan 18 tahun untuk Full Marathon',
      'Peserta wajib dalam kondisi sehat dan fit untuk mengikuti event',
      'Peserta wajib menandatangani waiver dan health declaration',
      'Jersey dan race pack akan dikirim H-7 sebelum event via JNE/J&T',
      'Bib number bersifat personal dan tidak dapat dipindahtangankan',
      'Start time berbeda untuk setiap kategori (akan diinformasikan lebih lanjut)',
      'Tiket yang sudah dibeli tidak dapat direfund atau ditukar',
      'Peserta wajib mematuhi peraturan lalu lintas dan instruksi panitia',
      'Panitia berhak mendiskualifikasi peserta yang melanggar aturan',
      'Peserta mengikuti lomba atas risiko sendiri'
    ],
    agenda: [
      { time: '04:00', activity: 'Pembukaan area start & check-in terakhir' },
      { time: '05:00', activity: 'Start Full Marathon 42K' },
      { time: '05:30', activity: 'Start Half Marathon 21K' },
      { time: '06:00', activity: 'Start Run 10K' },
      { time: '06:30', activity: 'Start Fun Run 5K' },
      { time: '07:00 - 12:00', activity: 'Peserta finish & pengambilan medali' },
      { time: '12:00', activity: 'Penutupan finish line & post-race festival' }
    ],
    organizerInfo: {
      name: 'Indonesia Runners',
      description: 'Indonesia Runners adalah komunitas lari terbesar di Indonesia dengan lebih dari 50,000 anggota aktif. Kami telah menyelenggarakan berbagai event lari berkualitas internasional sejak 2015.',
      phone: '021-5551234',
      email: 'info@indonesiarunners.com',
      website: 'www.indonesiarunners.com',
      instagram: '@indonesiarunners'
    },
    faqs: [
      {
        question: 'Bagaimana cara mengambil race pack?',
        answer: 'Race pack akan dikirimkan ke alamat yang Anda daftarkan H-7 sebelum event. Pastikan alamat yang didaftarkan benar dan lengkap.'
      },
      {
        question: 'Apakah ada cut-off time?',
        answer: 'Ya. Cut-off time: 5K (1 jam), 10K (2 jam), Half Marathon (3 jam), Full Marathon (6 jam). Peserta yang tidak finish sebelum cut-off tetap mendapat medali.'
      },
      {
        question: 'Apakah bisa refund jika berhalangan hadir?',
        answer: 'Mohon maaf, tiket yang sudah dibeli tidak dapat direfund. Namun bib number bisa dipindahkan ke orang lain dengan menghubungi panitia maksimal H-3 sebelum event.'
      },
      {
        question: 'Apakah tersedia parkir untuk peserta?',
        answer: 'Ya, tersedia area parkir di sekitar venue. Namun kami sangat menyarankan peserta menggunakan transportasi umum karena keterbatasan lahan parkir.'
      },
      {
        question: 'Apa yang harus dibawa saat event?',
        answer: 'Bawa bib number, KTP/identitas, dan botol minum pribadi. Tidak perlu membawa race pack, cukup pakai jersey dan bib yang sudah diterima.'
      }
    ],
    isFeatured: true,
    quota: 5000,
    registrationForm: [
      {
        fieldId: 'fullName',
        label: 'Nama Lengkap',
        type: 'text',
        required: true,
        placeholder: 'Masukkan nama lengkap sesuai KTP'
      },
      {
        fieldId: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'email@example.com'
      },
      {
        fieldId: 'phone',
        label: 'Nomor HP',
        type: 'phone',
        required: true,
        placeholder: '08xxxxxxxxxx'
      },
      {
        fieldId: 'shirtSize',
        label: 'Ukuran Jersey',
        type: 'select',
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
      },
      {
        fieldId: 'bloodType',
        label: 'Golongan Darah',
        type: 'select',
        required: true,
        options: ['A', 'B', 'AB', 'O']
      },
      {
        fieldId: 'emergencyContact',
        label: 'Kontak Darurat',
        type: 'phone',
        required: true,
        placeholder: 'Nomor HP yang bisa dihubungi'
      },
      {
        fieldId: 'address',
        label: 'Alamat Pengiriman Race Pack',
        type: 'textarea',
        required: true,
        placeholder: 'Alamat lengkap untuk pengiriman race pack'
      }
    ],
    ticketTypes: [
      {
        id: 't1-1',
        name: 'Fun Run 5K',
        price: 120000,
        originalPrice: 150000,
        available: 1200,
        total: 1500,
        description: 'Kategori 5 kilometer untuk semua usia'
      },
      {
        id: 't1-2',
        name: 'Run 10K',
        price: 200000,
        originalPrice: 250000,
        available: 800,
        total: 1000,
        description: 'Kategori 10 kilometer + jersey + medali'
      },
      {
        id: 't1-3',
        name: 'Half Marathon',
        price: 350000,
        available: 500,
        total: 1000,
        description: '21K + jersey + medali + goodie bag'
      },
      {
        id: 't1-4',
        name: 'Full Marathon',
        price: 500000,
        available: 300,
        total: 500,
        description: '42K + jersey premium + medali + goodie bag'
      }
    ]
  },
  {
    id: '2',
    title: 'Yoga & Mindfulness Workshop',
    organizer: 'Wellness Indonesia',
    category: 'Workshop',
    date: '2026-02-20',
    time: '09:00',
    venue: 'Botanical Garden',
    city: 'Bogor',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"%3E%3Crect width="1080" height="720" fill="%23e5e7eb"/%3E%3C/svg%3E',
    price: { min: 200000, max: 200000 },
    description: 'Workshop yoga dan mindfulness di tengah alam. Cocok untuk pemula maupun yang sudah berpengalaman. Termasuk makan siang sehat.',
    isFeatured: true,
    quota: 100,
    ticketTypes: [
      {
        id: 't2-1',
        name: 'Regular Ticket',
        price: 200000,
        available: 45,
        total: 100,
        description: 'Akses penuh workshop + makan siang + yoga mat'
      }
    ]
  },
  {
    id: '3',
    title: 'Digital Marketing Summit 2026',
    organizer: 'Tech Conference ID',
    category: 'Seminar',
    date: '2026-03-10',
    time: '08:00',
    venue: 'Jakarta Convention Center',
    city: 'Jakarta',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"%3E%3Crect width="1080" height="720" fill="%23e5e7eb"/%3E%3C/svg%3E',
    price: { min: 300000, max: 1500000 },
    description: 'Konferensi digital marketing terbesar di Indonesia. Pembicara dari Google, Meta, dan praktisi lokal terkemuka.',
    isFeatured: true,
    quota: 500,
    ticketTypes: [
      {
        id: 't3-1',
        name: 'Early Bird',
        price: 300000,
        available: 0,
        total: 100,
        description: 'Harga spesial early bird (SOLD OUT)'
      },
      {
        id: 't3-2',
        name: 'Regular',
        price: 500000,
        available: 250,
        total: 300,
        description: 'Tiket reguler + sertifikat + lunch'
      },
      {
        id: 't3-3',
        name: 'VIP',
        price: 1500000,
        available: 80,
        total: 100,
        description: 'VIP seat + networking dinner + exclusive workshop'
      }
    ]
  },
  {
    id: '4',
    title: 'Jazz in the Park',
    organizer: 'Jakarta Jazz Society',
    category: 'Musik',
    date: '2026-03-22',
    time: '17:00',
    venue: 'Taman Menteng',
    city: 'Jakarta',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"%3E%3Crect width="1080" height="720" fill="%23e5e7eb"/%3E%3C/svg%3E',
    price: { min: 100000, max: 300000 },
    description: 'Nikmati musik jazz di taman terbuka. Featuring musisi jazz Indonesia dan internasional.',
    isFeatured: true,
    quota: 1000,
    ticketTypes: [
      {
        id: 't4-1',
        name: 'Grass Area',
        price: 100000,
        available: 600,
        total: 700,
        description: 'Area rumput - bring your own mat'
      },
      {
        id: 't4-2',
        name: 'Seated',
        price: 200000,
        available: 250,
        total: 250,
        description: 'Kursi di area tengah'
      },
      {
        id: 't4-3',
        name: 'Premium',
        price: 300000,
        available: 45,
        total: 50,
        description: 'Premium seat + welcome drink'
      }
    ]
  },
  {
    id: '5',
    title: 'Jakarta Food Festival',
    organizer: 'Foodie Nation',
    category: 'Kuliner',
    date: '2026-04-05',
    time: '11:00',
    venue: 'PIK Avenue',
    city: 'Jakarta',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"%3E%3Crect width="1080" height="720" fill="%23e5e7eb"/%3E%3C/svg%3E',
    price: { min: 50000, max: 200000 },
    description: 'Festival kuliner dengan 100+ tenant makanan dan minuman dari seluruh Indonesia. Live music dan cooking demo.',
    isFeatured: true,
    quota: 2000,
    ticketTypes: [
      {
        id: 't5-1',
        name: 'Regular Entry',
        price: 50000,
        available: 1500,
        total: 1700,
        description: 'Tiket masuk festival'
      },
      {
        id: 't5-2',
        name: 'VIP Package',
        price: 200000,
        available: 250,
        total: 300,
        description: 'VIP lounge + voucher makanan 100K'
      }
    ]
  },
  {
    id: '6',
    title: 'Charity Fun Run for Kids',
    organizer: 'Yayasan Anak Indonesia',
    category: 'Charity',
    date: '2026-02-28',
    time: '06:00',
    venue: 'BSD Green Office Park',
    city: 'Tangerang',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"%3E%3Crect width="1080" height="720" fill="%23e5e7eb"/%3E%3C/svg%3E',
    price: { min: 100000, max: 250000 },
    description: 'Lari untuk anak Indonesia! 100% hasil donasi untuk pendidikan anak kurang mampu. Tersedia kategori 3K dan 5K.',
    isFeatured: true,
    quota: 800,
    ticketTypes: [
      {
        id: 't6-1',
        name: 'Kids 3K',
        price: 100000,
        available: 300,
        total: 400,
        description: 'Untuk usia 6-12 tahun + jersey + medali'
      },
      {
        id: 't6-2',
        name: 'Adult 5K',
        price: 150000,
        available: 350,
        total: 400,
        description: 'Untuk 13+ tahun + jersey + medali'
      },
      {
        id: 't6-3',
        name: 'Family Package (2 Adult + 2 Kids)',
        price: 250000,
        available: 0,
        total: 50,
        description: 'Paket keluarga hemat (SOLD OUT)'
      }
    ]
  },
  {
    id: '7',
    title: 'Bali Color Run 2026',
    organizer: 'Bali Events',
    category: 'Olahraga',
    date: '2026-04-20',
    time: '07:00',
    venue: 'Sanur Beach',
    city: 'Bali',
    image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1080\" height=\"720\"%3E%3Crect width=\"1080\" height=\"720\" fill=\"%23e5e7eb\"/%3E%3C/svg%3E',
    price: { min: 200000, max: 200000 },
    description: 'The most colorful run in Bali! 5K fun run dengan color powder di sepanjang rute. Cocok untuk keluarga.',
    isFeatured: true,
    quota: 1000,
    registrationForm: [
      {
        fieldId: 'fullName',
        label: 'Nama Lengkap',
        type: 'text',
        required: true,
        placeholder: 'Masukkan nama lengkap'
      },
      {
        fieldId: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'email@example.com'
      },
      {
        fieldId: 'phone',
        label: 'Nomor HP',
        type: 'phone',
        required: true,
        placeholder: '08xxxxxxxxxx'
      },
      {
        fieldId: 'shirtSize',
        label: 'Ukuran Jersey',
        type: 'select',
        required: true,
        options: ['S', 'M', 'L', 'XL', 'XXL']
      }
    ],
    ticketTypes: [
      {
        id: 't7-1',
        name: 'Color Run 5K',
        price: 200000,
        available: 650,
        total: 1000,
        description: 'Jersey + color powder + finisher medal + after party'
      }
    ]
  },
  {
    id: '8',
    title: 'Startup Founders Meetup',
    organizer: 'Startup Indonesia',
    category: 'Seminar',
    date: '2026-03-18',
    time: '14:00',
    venue: 'WeWork Plaza Indonesia',
    city: 'Jakarta',
    image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1080\" height=\"720\"%3E%3Crect width=\"1080\" height=\"720\" fill=\"%23e5e7eb\"/%3E%3C/svg%3E',
    price: { min: 150000, max: 150000 },
    description: 'Networking event untuk para founder dan entrepreneur. Sharing session dengan successful founders Indonesia.',
    isFeatured: true,
    quota: 100,
    ticketTypes: [
      {
        id: 't8-1',
        name: 'General Admission',
        price: 150000,
        available: 45,
        total: 100,
        description: 'Networking session + coffee break'
      }
    ]
  },
  {
    id: '9',
    title: 'Indonesia Indie Music Festival',
    organizer: 'Indie Music Community',
    category: 'Musik',
    date: '2026-04-15',
    time: '16:00',
    venue: 'Gelora Bung Karno',
    city: 'Jakarta',
    image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1080\" height=\"720\"%3E%3Crect width=\"1080\" height=\"720\" fill=\"%23e5e7eb\"/%3E%3C/svg%3E',
    price: { min: 250000, max: 500000 },
    description: 'Festival musik indie terbesar tahun ini! 20+ band indie ternama akan perform. SOLD OUT dalam 24 jam!',
    status: 'sold-out',
    isFeatured: false,
    quota: 3000,
    ticketTypes: [
      {
        id: 't9-1',
        name: 'General Admission',
        price: 250000,
        available: 0,
        total: 2500,
        description: 'Standing area - SOLD OUT'
      },
      {
        id: 't9-2',
        name: 'VIP',
        price: 500000,
        available: 0,
        total: 500,
        description: 'VIP area + meet & greet - SOLD OUT'
      }
    ]
  },
  {
    id: '10',
    title: 'Bandung Coffee & Music Fest',
    organizer: 'Bandung Creative Hub',
    category: 'Kuliner',
    date: '2026-02-25',
    time: '10:00',
    venue: 'Gedung Sate',
    city: 'Bandung',
    image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1080\" height=\"720\"%3E%3Crect width=\"1080\" height=\"720\" fill=\"%23e5e7eb\"/%3E%3C/svg%3E',
    price: { min: 75000, max: 150000 },
    description: 'Festival kopi dan musik akustik di Bandung. Featuring 30+ coffee roaster lokal dan live acoustic performance.',
    status: 'cancelled',
    cancelReason: 'Event dibatalkan karena renovasi venue yang tidak terduga. Semua pembelian tiket akan di-refund 100% dalam 7 hari kerja.',
    isFeatured: false,
    quota: 500,
    ticketTypes: [
      {
        id: 't10-1',
        name: 'Regular Entry',
        price: 75000,
        available: 0,
        total: 400,
        description: 'Akses festival + 1 free coffee sample'
      },
      {
        id: 't10-2',
        name: 'VIP Pass',
        price: 150000,
        available: 0,
        total: 100,
        description: 'VIP lounge + 5 coffee samples + tote bag'
      }
    ]
  }
];

export const categories = ['Semua', 'Olahraga', 'Musik', 'Workshop', 'Seminar', 'Kuliner', 'Charity'] as const;