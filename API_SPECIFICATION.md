# KARTCIS.ID - API Specification

## 📋 Overview

Base URL Production: `https://api.kartcis.id/api`  
Base URL Development: `http://localhost:3000/api`  
Version: `v1.0`  
Authentication: `JWT Bearer Token`

---

## 🗄️ Database Schema

### 1. Table: `users`

Menyimpan data user yang terdaftar.

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- Hashed (bcrypt), NULL jika OAuth login
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  avatar VARCHAR(500), -- Profile picture URL
  email_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "name": "Budi Santoso",
  "email": "budi@gmail.com",
  "password": "$2b$10$...", // bcrypt hash, NULL jika OAuth
  "phone": "08123456789",
  "role": "user",
  "avatar": "https://lh3.googleusercontent.com/a/...",
  "email_verified_at": "2026-01-15 10:30:00",
  "created_at": "2026-01-10 08:00:00",
  "updated_at": "2026-01-20 15:45:00"
}
```

---

### 2. Table: `social_accounts`

Menyimpan data OAuth/Social login (Google, Facebook, dll).

```sql
CREATE TABLE social_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'apple'
  provider_id VARCHAR(255) NOT NULL, -- Google User ID
  provider_token TEXT, -- Access token from provider
  provider_refresh_token TEXT, -- Refresh token
  provider_data JSON, -- Additional data from provider
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider (provider, provider_id),
  INDEX idx_user (user_id),
  INDEX idx_provider (provider, provider_id)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "user_id": 1,
  "provider": "google",
  "provider_id": "106123456789012345678",
  "provider_token": "ya29.a0AfH6SMBx...",
  "provider_refresh_token": "1//0gHZ9...",
  "provider_data": {
    "email": "budi@gmail.com",
    "name": "Budi Santoso",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "given_name": "Budi",
    "family_name": "Santoso",
    "locale": "id"
  },
  "created_at": "2026-01-10 08:00:00",
  "updated_at": "2026-01-20 15:45:00"
}
```

---

### 3. Table: `categories`

Kategori event (Marathon, Musik, Workshop, dll).

```sql
CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name (lucide-react)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_slug (slug)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "name": "Marathon & Lari",
  "slug": "marathon-lari",
  "description": "Event lari marathon, half marathon, fun run",
  "icon": "Footprints",
  "created_at": "2026-01-01 00:00:00",
  "updated_at": "2026-01-01 00:00:00"
}
```

**Default Categories:**
- Marathon & Lari (marathon-lari)
- Musik & Konser (musik-konser)
- Workshop & Seminar (workshop-seminar)
- Olahraga (olahraga)
- Kuliner (kuliner)
- Charity & Sosial (charity-sosial)

---

### 4. Table: `events`

Data event yang tersedia.

```sql
CREATE TABLE events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL, -- Short description
  detailed_description TEXT, -- Full HTML description
  facilities JSON, -- Array of strings: ["Medali finisher", "Sertifikat", ...]
  terms JSON, -- Array of strings: ["Peserta harus berusia 17+", ...]
  agenda JSON, -- Array of {time, activity}: [{"time":"06:00","activity":"Registration"}]
  organizer_info JSON, -- {name, description, phone, email, website, instagram}
  faqs JSON, -- Array of {question, answer}
  event_date DATE NOT NULL,
  event_time TIME,
  venue VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  quota INT NOT NULL DEFAULT 0,
  image VARCHAR(500), -- URL or path
  is_featured BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'published', 'completed', 'cancelled', 'sold-out') DEFAULT 'published',
  cancel_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_featured (is_featured),
  INDEX idx_event_date (event_date),
  INDEX idx_city (city)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "category_id": 1,
  "title": "Jakarta Marathon 2026",
  "slug": "jakarta-marathon-2026",
  "description": "Marathon internasional terbesar di Jakarta dengan rute scenic melewati landmark ikonik kota.",
  "detailed_description": "<p>Jakarta Marathon 2026 adalah event lari marathon...</p>",
  "facilities": [
    "Medali finisher untuk semua kategori",
    "Sertifikat digital",
    "Running jersey official",
    "Goodie bag eksklusif",
    "Konsumsi & hydration station",
    "Medical support 24/7"
  ],
  "terms": [
    "Peserta harus berusia minimal 17 tahun pada tanggal event",
    "Tiket yang sudah dibeli tidak dapat dikembalikan",
    "Wajib membawa KTP/identitas saat registrasi ulang",
    "Peserta wajib mengikuti protokol kesehatan"
  ],
  "agenda": [
    {"time": "04:00", "activity": "Registration & Race Pack Collection"},
    {"time": "05:30", "activity": "Opening Ceremony"},
    {"time": "06:00", "activity": "Race Start - Full Marathon (42K)"},
    {"time": "06:15", "activity": "Race Start - Half Marathon (21K)"},
    {"time": "06:30", "activity": "Race Start - 10K Fun Run"},
    {"time": "12:00", "activity": "Race Finish & Awarding"}
  ],
  "organizer_info": {
    "name": "Jakarta Sports Association",
    "description": "Penyelenggara event olahraga profesional sejak 2010",
    "phone": "021-12345678",
    "email": "info@jakartamarathon.com",
    "website": "https://jakartamarathon.com",
    "instagram": "@jakartamarathon"
  },
  "faqs": [
    {
      "question": "Kapan dan dimana pengambilan race pack?",
      "answer": "Race pack dapat diambil 2 hari sebelum event di Jakarta Convention Center, jam 10:00-20:00"
    },
    {
      "question": "Apakah bisa refund jika tidak bisa hadir?",
      "answer": "Tiket yang sudah dibeli tidak dapat di-refund, namun dapat dialihkan ke orang lain dengan konfirmasi ke panitia"
    }
  ],
  "event_date": "2026-03-15",
  "event_time": "06:00:00",
  "venue": "Bundaran HI - Monas",
  "city": "Jakarta",
  "organizer": "Jakarta Sports Association",
  "quota": 10000,
  "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg",
  "is_featured": true,
  "status": "published",
  "cancel_reason": null,
  "created_at": "2026-01-01 10:00:00",
  "updated_at": "2026-01-20 14:30:00"
}
```

---

### 5. Table: `ticket_types`

Jenis tiket untuk setiap event (Early Bird, Regular, VIP, dll).

```sql
CREATE TABLE ticket_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2), -- For showing discount
  quota INT NOT NULL,
  available INT NOT NULL, -- Remaining quota
  status ENUM('available', 'sold_out', 'unavailable') DEFAULT 'available',
  sale_start_date TIMESTAMP,
  sale_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_status (status)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "event_id": 1,
  "name": "Early Bird - Full Marathon",
  "description": "Harga spesial untuk pendaftar awal",
  "price": 350000.00,
  "original_price": 500000.00,
  "quota": 500,
  "available": 245,
  "status": "available",
  "sale_start_date": "2026-01-01 00:00:00",
  "sale_end_date": "2026-02-01 23:59:59",
  "created_at": "2026-01-01 10:00:00",
  "updated_at": "2026-01-21 08:15:00"
}
```

---

### 6. Table: `orders`

Pesanan tiket (baik login maupun guest).

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL, -- NULL jika guest checkout
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Format: ORD-{timestamp}-{random}
  
  -- Customer info (untuk guest atau backup)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'paid', 'cancelled', 'expired') DEFAULT 'pending',
  
  -- Payment info
  payment_method VARCHAR(50) NOT NULL, -- 'BCA Virtual Account', 'OVO', 'GoPay', etc
  payment_details JSON, -- {va_number, qr_code, instructions, etc}
  
  -- Timestamps
  expires_at TIMESTAMP NOT NULL, -- 24 jam dari created_at
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_customer_email (customer_email),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "user_id": 1,
  "order_number": "ORD-1737456789123-ABCD",
  "customer_name": "Budi Santoso",
  "customer_email": "budi@gmail.com",
  "customer_phone": "08123456789",
  "total_amount": 700000.00,
  "status": "paid",
  "payment_method": "BCA Virtual Account",
  "payment_details": {
    "bank": "BCA",
    "va_number": "1234567890123456",
    "account_name": "KARTCIS.ID",
    "instructions": [
      "Login ke BCA Mobile/KlikBCA",
      "Pilih menu Transfer",
      "Input nomor Virtual Account: 1234567890123456",
      "Masukkan nominal: Rp 700.000",
      "Konfirmasi pembayaran"
    ]
  },
  "expires_at": "2026-01-22 10:30:00",
  "paid_at": "2026-01-21 14:25:30",
  "created_at": "2026-01-21 10:30:00",
  "updated_at": "2026-01-21 14:25:30"
}
```

---

### 7. Table: `order_items`

Detail item pesanan (1 order bisa punya banyak items).

```sql
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL, -- Price saat checkout
  subtotal DECIMAL(12,2) NOT NULL, -- quantity * unit_price
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_event (event_id)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "order_id": 1,
  "event_id": 1,
  "ticket_type_id": 1,
  "quantity": 2,
  "unit_price": 350000.00,
  "subtotal": 700000.00,
  "created_at": "2026-01-21 10:30:00",
  "updated_at": "2026-01-21 10:30:00"
}
```

---

### 8. Table: `tickets`

Tiket individual yang digenerate dari order (1 order_item dengan qty=2 akan generate 2 tickets).

```sql
CREATE TABLE tickets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  
  ticket_code VARCHAR(50) UNIQUE NOT NULL, -- Format: TIX-{event_id}-{timestamp}-{random}
  qr_code TEXT, -- QR code data/URL
  
  -- Attendee info
  attendee_name VARCHAR(255) NOT NULL,
  attendee_email VARCHAR(255) NOT NULL,
  attendee_phone VARCHAR(20) NOT NULL,
  
  status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
  check_in_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_event (event_id),
  INDEX idx_ticket_code (ticket_code),
  INDEX idx_status (status),
  INDEX idx_attendee_email (attendee_email)
);
```

**Sample Data:**
```json
{
  "id": 1,
  "order_id": 1,
  "event_id": 1,
  "ticket_type_id": 1,
  "ticket_code": "TIX-1-1737456789-X7Y9",
  "qr_code": "https://api.kartcis.id/qr/TIX-1-1737456789-X7Y9",
  "attendee_name": "Budi Santoso",
  "attendee_email": "budi@gmail.com",
  "attendee_phone": "08123456789",
  "status": "active",
  "check_in_at": null,
  "created_at": "2026-01-21 14:25:30",
  "updated_at": "2026-01-21 14:25:30"
}
```

---

## 🔐 Authentication

### Register

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@gmail.com",
  "phone": "08123456789",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Validation Rules:**
- `name`: required, string, max 255
- `email`: required, email, unique
- `phone`: required, string, min 10, max 20
- `password`: required, string, min 6
- `password_confirmation`: required, same as password

**Response Success (201):**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@gmail.com",
      "phone": "08123456789",
      "role": "user",
      "created_at": "2026-01-21T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400 // seconds (24 hours)
  }
}
```

**Response Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email sudah terdaftar"],
    "password": ["Password minimal 6 karakter"]
  }
}
```

---

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "budi@gmail.com",
  "password": "password123",
  "remember_me": false
}
```

**Validation Rules:**
- `email`: required, email
- `password`: required, string
- `remember_me`: optional, boolean (default: false)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@gmail.com",
      "phone": "08123456789",
      "role": "user",
      "created_at": "2026-01-21T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400 // 24h if remember_me=true, 7200 (2h) if false
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

---

### Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@gmail.com",
    "phone": "08123456789",
    "role": "user",
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T10:30:00.000Z"
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

### 🔑 OAuth / Social Login (Google)

**KARTCIS.ID mendukung login dengan Google Account.**

Untuk dokumentasi lengkap OAuth/Social Login termasuk:
- Google OAuth redirect flow
- Google One Tap implementation
- Account linking & unlinking
- Set password for OAuth users
- Database schema untuk social_accounts
- Frontend implementation guide
- Security best practices

**Lihat file:** [`/API_OAUTH_GOOGLE.md`](./API_OAUTH_GOOGLE.md)

**Quick Summary Endpoints:**
- `GET /auth/google` - Redirect ke Google OAuth
- `GET /auth/google/callback` - Handle callback dari Google
- `POST /auth/google/one-tap` - Google One Tap signin
- `GET /auth/social` - Get connected social accounts
- `DELETE /auth/social/{provider}` - Unlink social account
- `POST /auth/set-password` - Set password untuk OAuth-only users

---

## 🎫 Events

### Get All Events

**Endpoint:** `GET /events`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 12
- `category` (optional): Category slug
- `city` (optional): City name
- `search` (optional): Search by title
- `featured` (optional): true/false
- `status` (optional): published/completed/cancelled/sold-out
- `sort` (optional): 'date_asc', 'date_desc', 'title_asc', 'title_desc', 'newest', 'oldest'

**Example Request:**
```
GET /events?page=1&limit=12&category=marathon-lari&city=Jakarta&search=marathon
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Jakarta Marathon 2026",
        "slug": "jakarta-marathon-2026",
        "description": "Marathon internasional terbesar di Jakarta...",
        "event_date": "2026-03-15",
        "event_time": "06:00:00",
        "venue": "Bundaran HI - Monas",
        "city": "Jakarta",
        "organizer": "Jakarta Sports Association",
        "quota": 10000,
        "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg",
        "is_featured": true,
        "status": "published",
        "created_at": "2026-01-01T10:00:00.000Z",
        "category": {
          "id": 1,
          "name": "Marathon & Lari",
          "slug": "marathon-lari"
        },
        "ticket_types": [
          {
            "id": 1,
            "name": "Early Bird - Full Marathon",
            "price": 350000.00,
            "original_price": 500000.00,
            "available": 245,
            "status": "available"
          },
          {
            "id": 2,
            "name": "Regular - Half Marathon",
            "price": 250000.00,
            "available": 890,
            "status": "available"
          }
        ],
        "min_price": 250000.00,
        "max_price": 500000.00
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 58,
      "per_page": 12,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### Get Event Detail

**Endpoint:** `GET /events/{slug}`

**Example Request:**
```
GET /events/jakarta-marathon-2026
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Jakarta Marathon 2026",
    "slug": "jakarta-marathon-2026",
    "description": "Marathon internasional terbesar di Jakarta...",
    "detailed_description": "<p>Jakarta Marathon 2026 adalah...</p>",
    "facilities": [
      "Medali finisher untuk semua kategori",
      "Sertifikat digital",
      "Running jersey official"
    ],
    "terms": [
      "Peserta harus berusia minimal 17 tahun",
      "Tiket tidak dapat dikembalikan"
    ],
    "agenda": [
      {"time": "04:00", "activity": "Registration"},
      {"time": "06:00", "activity": "Race Start"}
    ],
    "organizer_info": {
      "name": "Jakarta Sports Association",
      "description": "Penyelenggara event olahraga...",
      "phone": "021-12345678",
      "email": "info@jakartamarathon.com",
      "website": "https://jakartamarathon.com",
      "instagram": "@jakartamarathon"
    },
    "faqs": [
      {
        "question": "Kapan pengambilan race pack?",
        "answer": "2 hari sebelum event..."
      }
    ],
    "event_date": "2026-03-15",
    "event_time": "06:00:00",
    "venue": "Bundaran HI - Monas",
    "city": "Jakarta",
    "organizer": "Jakarta Sports Association",
    "quota": 10000,
    "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg",
    "is_featured": true,
    "status": "published",
    "created_at": "2026-01-01T10:00:00.000Z",
    "updated_at": "2026-01-20T14:30:00.000Z",
    "category": {
      "id": 1,
      "name": "Marathon & Lari",
      "slug": "marathon-lari",
      "description": "Event lari marathon, half marathon, fun run"
    },
    "ticket_types": [
      {
        "id": 1,
        "name": "Early Bird - Full Marathon",
        "description": "Harga spesial untuk pendaftar awal",
        "price": 350000.00,
        "original_price": 500000.00,
        "quota": 500,
        "available": 245,
        "status": "available",
        "sale_start_date": "2026-01-01T00:00:00.000Z",
        "sale_end_date": "2026-02-01T23:59:59.000Z"
      }
    ]
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Event tidak ditemukan"
}
```

---

### Get Featured Events

**Endpoint:** `GET /events/featured`

**Query Parameters:**
- `limit` (optional): Max items, default 6

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Jakarta Marathon 2026",
      "slug": "jakarta-marathon-2026",
      "description": "Marathon internasional...",
      "event_date": "2026-03-15",
      "event_time": "06:00:00",
      "venue": "Bundaran HI - Monas",
      "city": "Jakarta",
      "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg",
      "min_price": 250000.00,
      "category": {
        "id": 1,
        "name": "Marathon & Lari",
        "slug": "marathon-lari"
      }
    }
  ]
}
```

---

## 📂 Categories

### Get All Categories

**Endpoint:** `GET /categories`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Marathon & Lari",
      "slug": "marathon-lari",
      "description": "Event lari marathon, half marathon, fun run",
      "icon": "Footprints",
      "event_count": 23,
      "created_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Musik & Konser",
      "slug": "musik-konser",
      "description": "Konser musik, festival musik",
      "icon": "Music",
      "event_count": 15,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 🛒 Checkout & Orders

### Create Order (Checkout)

**Endpoint:** `POST /orders`

**Headers (Optional):**
```
Authorization: Bearer {token}  // Optional - untuk logged in user
```

**Request Body:**
```json
{
  "items": [
    {
      "event_id": 1,
      "ticket_type_id": 1,
      "quantity": 2
    },
    {
      "event_id": 2,
      "ticket_type_id": 3,
      "quantity": 1
    }
  ],
  "payment_method": "BCA Virtual Account",
  "customer_info": {
    "name": "Budi Santoso",
    "email": "budi@gmail.com",
    "phone": "08123456789"
  }
}
```

**Validation Rules:**
- `items`: required, array, min 1 item
- `items.*.event_id`: required, exists in events table
- `items.*.ticket_type_id`: required, exists in ticket_types table
- `items.*.quantity`: required, integer, min 1, max 10
- `payment_method`: required, string, in ['BCA Virtual Account', 'Mandiri Virtual Account', 'BNI Virtual Account', 'OVO', 'GoPay', 'ShopeePay', 'QRIS']
- `customer_info.name`: required, string, max 255
- `customer_info.email`: required, email
- `customer_info.phone`: required, string, min 10

**Business Logic:**
1. Validate ticket availability (check available >= quantity)
2. Calculate total amount
3. Reduce ticket_types.available by quantity
4. Create order record (status: pending)
5. Create order_items records
6. Generate payment details based on payment_method
7. Set expires_at = created_at + 24 hours
8. Return order with payment details

**Response Success (201):**
```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "data": {
    "id": 1,
    "order_number": "ORD-1737456789123-ABCD",
    "user_id": 1,
    "customer_name": "Budi Santoso",
    "customer_email": "budi@gmail.com",
    "customer_phone": "08123456789",
    "total_amount": 700000.00,
    "status": "pending",
    "payment_method": "BCA Virtual Account",
    "payment_details": {
      "bank": "BCA",
      "va_number": "1234567890123456",
      "account_name": "KARTCIS.ID",
      "amount": 700000.00,
      "instructions": [
        "Login ke BCA Mobile/KlikBCA",
        "Pilih menu Transfer",
        "Input nomor Virtual Account: 1234567890123456",
        "Masukkan nominal: Rp 700.000",
        "Konfirmasi pembayaran"
      ]
    },
    "expires_at": "2026-01-22T10:30:00.000Z",
    "created_at": "2026-01-21T10:30:00.000Z",
    "order_items": [
      {
        "id": 1,
        "event_id": 1,
        "ticket_type_id": 1,
        "quantity": 2,
        "unit_price": 350000.00,
        "subtotal": 700000.00,
        "event": {
          "id": 1,
          "title": "Jakarta Marathon 2026",
          "event_date": "2026-03-15",
          "venue": "Bundaran HI - Monas",
          "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg"
        },
        "ticket_type": {
          "id": 1,
          "name": "Early Bird - Full Marathon"
        }
      }
    ]
  }
}
```

**Response Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "items.0.quantity": ["Tiket tidak mencukupi. Tersedia: 1, diminta: 2"]
  }
}
```

---

### Get Order Detail

**Endpoint:** `GET /orders/{order_number}`

**Example Request:**
```
GET /orders/ORD-1737456789123-ABCD
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-1737456789123-ABCD",
    "user_id": 1,
    "customer_name": "Budi Santoso",
    "customer_email": "budi@gmail.com",
    "customer_phone": "08123456789",
    "total_amount": 700000.00,
    "status": "pending",
    "payment_method": "BCA Virtual Account",
    "payment_details": {
      "bank": "BCA",
      "va_number": "1234567890123456",
      "account_name": "KARTCIS.ID",
      "amount": 700000.00,
      "instructions": [...]
    },
    "expires_at": "2026-01-22T10:30:00.000Z",
    "paid_at": null,
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T10:30:00.000Z",
    "order_items": [
      {
        "id": 1,
        "event_id": 1,
        "ticket_type_id": 1,
        "quantity": 2,
        "unit_price": 350000.00,
        "subtotal": 700000.00,
        "event": {
          "id": 1,
          "title": "Jakarta Marathon 2026",
          "slug": "jakarta-marathon-2026",
          "event_date": "2026-03-15",
          "event_time": "06:00:00",
          "venue": "Bundaran HI - Monas",
          "city": "Jakarta",
          "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg"
        },
        "ticket_type": {
          "id": 1,
          "name": "Early Bird - Full Marathon"
        }
      }
    ]
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Order tidak ditemukan"
}
```

---

### Payment Callback (Webhook)

**Endpoint:** `POST /orders/payment-callback`

**Headers:**
```
X-Callback-Token: {secret_token}  // For security
```

**Request Body (dari payment gateway):**
```json
{
  "order_number": "ORD-1737456789123-ABCD",
  "transaction_id": "PAY-987654321",
  "status": "paid",
  "paid_at": "2026-01-21T14:25:30.000Z",
  "payment_method": "BCA Virtual Account",
  "amount": 700000.00
}
```

**Business Logic:**
1. Verify X-Callback-Token
2. Find order by order_number
3. Verify amount matches
4. Update order status to 'paid'
5. Set paid_at timestamp
6. Generate tickets (quantity from order_items)
7. Send email with tickets (PDF + QR code)
8. Return success response

**Response Success (200):**
```json
{
  "success": true,
  "message": "Payment confirmed"
}
```

---

### Simulate Payment (Development Only)

**Endpoint:** `POST /orders/{order_number}/simulate-payment`

**Note:** Endpoint ini hanya untuk development/testing. Di production akan menggunakan payment callback dari payment gateway.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Pembayaran berhasil disimulasikan",
  "data": {
    "order_number": "ORD-1737456789123-ABCD",
    "status": "paid",
    "paid_at": "2026-01-21T14:25:30.000Z",
    "tickets_generated": 2
  }
}
```

---

## 🎟️ Tickets

### Get My Tickets (Logged In User)

**Endpoint:** `GET /tickets/my-tickets`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): 'upcoming' or 'past'

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "upcoming": [
      {
        "id": 1,
        "ticket_code": "TIX-1-1737456789-X7Y9",
        "qr_code": "https://api.kartcis.id/qr/TIX-1-1737456789-X7Y9",
        "attendee_name": "Budi Santoso",
        "attendee_email": "budi@gmail.com",
        "attendee_phone": "08123456789",
        "status": "active",
        "check_in_at": null,
        "created_at": "2026-01-21T14:25:30.000Z",
        "event": {
          "id": 1,
          "title": "Jakarta Marathon 2026",
          "slug": "jakarta-marathon-2026",
          "event_date": "2026-03-15",
          "event_time": "06:00:00",
          "venue": "Bundaran HI - Monas",
          "city": "Jakarta",
          "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg"
        },
        "ticket_type": {
          "id": 1,
          "name": "Early Bird - Full Marathon",
          "price": 350000.00
        },
        "order": {
          "order_number": "ORD-1737456789123-ABCD",
          "total_amount": 700000.00
        }
      }
    ],
    "past": []
  }
}
```

---

### Get Ticket by Code (Guest Access)

**Endpoint:** `GET /tickets/{ticket_code}`

**Example Request:**
```
GET /tickets/TIX-1-1737456789-X7Y9
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_code": "TIX-1-1737456789-X7Y9",
    "qr_code": "https://api.kartcis.id/qr/TIX-1-1737456789-X7Y9",
    "attendee_name": "Budi Santoso",
    "attendee_email": "budi@gmail.com",
    "attendee_phone": "08123456789",
    "status": "active",
    "check_in_at": null,
    "created_at": "2026-01-21T14:25:30.000Z",
    "event": {
      "id": 1,
      "title": "Jakarta Marathon 2026",
      "event_date": "2026-03-15",
      "event_time": "06:00:00",
      "venue": "Bundaran HI - Monas",
      "city": "Jakarta",
      "image": "https://storage.kartcis.id/events/jakarta-marathon-2026.jpg"
    },
    "ticket_type": {
      "id": 1,
      "name": "Early Bird - Full Marathon"
    }
  }
}
```

---

### Download Ticket PDF

**Endpoint:** `GET /tickets/{ticket_code}/download`

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="ticket-TIX-1-1737456789-X7Y9.pdf"`

**PDF Content:**
- Event details
- Ticket type & attendee info
- QR code (large, scannable)
- Order number
- Terms & conditions

---

### Check-in Ticket (Scan QR)

**Endpoint:** `POST /tickets/check-in`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "ticket_code": "TIX-1-1737456789-X7Y9"
}
```

**Business Logic:**
1. Find ticket by code
2. Validate ticket status = 'active'
3. Validate event date (can't check-in before event date)
4. Update status to 'used'
5. Set check_in_at timestamp
6. Return ticket details

**Response Success (200):**
```json
{
  "success": true,
  "message": "Check-in berhasil",
  "data": {
    "ticket_code": "TIX-1-1737456789-X7Y9",
    "attendee_name": "Budi Santoso",
    "event_title": "Jakarta Marathon 2026",
    "ticket_type": "Early Bird - Full Marathon",
    "check_in_at": "2026-03-15T05:30:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Tiket sudah pernah digunakan",
  "data": {
    "check_in_at": "2026-03-15T05:30:00.000Z"
  }
}
```

---

## 👨‍💼 Admin APIs

**Note:** Semua endpoint admin memerlukan authentication dengan role = 'admin'

### Get All Transactions

**Endpoint:** `GET /admin/transactions`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10
- `status` (optional): 'all', 'pending', 'completed', 'expired', 'cancelled'
- `search` (optional): Search by order_number, customer_name, customer_email, event_title

**Example Request:**
```
GET /admin/transactions?page=1&limit=10&status=completed&search=budi
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "TRX-00001",
        "order_number": "ORD-1737456789123-ABCD",
        "customer_name": "Budi Santoso",
        "customer_email": "budi@gmail.com",
        "customer_phone": "08123456789",
        "event_title": "Jakarta Marathon 2026",
        "event_date": "2026-03-15",
        "ticket_type": "Early Bird - Full Marathon",
        "quantity": 2,
        "total_amount": 700000.00,
        "status": "completed",
        "payment_method": "BCA Virtual Account",
        "created_at": "2026-01-21T10:30:00.000Z",
        "expires_at": null,
        "paid_at": "2026-01-21T14:25:30.000Z"
      }
    ],
    "stats": {
      "total": 50,
      "completed": 35,
      "pending": 10,
      "expired": 3,
      "cancelled": 2,
      "total_revenue": 25000000.00
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### Get Transaction Detail

**Endpoint:** `GET /admin/transactions/{id}`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "TRX-00001",
    "order_number": "ORD-1737456789123-ABCD",
    "customer_name": "Budi Santoso",
    "customer_email": "budi@gmail.com",
    "customer_phone": "08123456789",
    "event_title": "Jakarta Marathon 2026",
    "event_date": "2026-03-15",
    "ticket_type": "Early Bird - Full Marathon",
    "quantity": 2,
    "total_amount": 700000.00,
    "status": "completed",
    "payment_method": "BCA Virtual Account",
    "payment_details": {
      "bank": "BCA",
      "va_number": "1234567890123456"
    },
    "created_at": "2026-01-21T10:30:00.000Z",
    "paid_at": "2026-01-21T14:25:30.000Z",
    "tickets": [
      {
        "ticket_code": "TIX-1-1737456789-X7Y9",
        "status": "active"
      },
      {
        "ticket_code": "TIX-1-1737456789-Z8W7",
        "status": "active"
      }
    ]
  }
}
```

---

### Resend Ticket Email

**Endpoint:** `POST /admin/transactions/{id}/resend-email`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Business Logic:**
1. Verify admin role
2. Find transaction/order
3. Verify status = 'completed'
4. Get all tickets for this order
5. Generate PDF for each ticket
6. Send email with attachments
7. Log resend activity

**Response Success (200):**
```json
{
  "success": true,
  "message": "Email tiket berhasil dikirim ulang ke budi@gmail.com"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Hanya transaksi completed yang bisa resend email"
}
```

---

### Get Stats

**Endpoint:** `GET /admin/stats`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "completed": 35,
    "pending": 10,
    "expired": 3,
    "cancelled": 2,
    "total_revenue": 25000000.00,
    "today_transactions": 5,
    "today_revenue": 1500000.00,
    "this_month_transactions": 50,
    "this_month_revenue": 25000000.00
  }
}
```

---

## 📧 Email Templates

### 1. Email: Order Created (Pending Payment)

**Subject:** Pesanan Tiket Anda - Menunggu Pembayaran #{order_number}

**Content:**
- Order summary
- Payment instructions
- Countdown timer (24 hours)
- Payment details (VA number, QR code, etc)
- Button: "Lihat Detail Pesanan"

---

### 2. Email: Payment Success

**Subject:** Pembayaran Berhasil - Tiket Event {event_title}

**Content:**
- Payment confirmation
- Order details
- Ticket attachments (PDF with QR code)
- Check-in instructions
- Event details & venue
- Contact info

**Attachments:**
- ticket-{ticket_code}.pdf (for each ticket)

---

### 3. Email: Payment Expired

**Subject:** Pesanan Dibatalkan - Waktu Pembayaran Habis #{order_number}

**Content:**
- Order expired notification
- Order summary
- Invitation to reorder
- Button: "Pesan Lagi"

---

### 4. Email: Resend Ticket

**Subject:** Tiket Event {event_title} - KARTCIS.ID

**Content:**
- Ticket resend message
- Event details
- Check-in instructions
- Contact support

**Attachments:**
- ticket-{ticket_code}.pdf (for each ticket)

---

## 🔒 Authorization & Middleware

### Middleware: Auth (JWT)

Verify JWT token from header `Authorization: Bearer {token}`

**If valid:**
- Attach user object to request
- Continue to next middleware/controller

**If invalid/expired:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Token invalid atau expired"
}
```

---

### Middleware: Admin

Verify user role = 'admin'

**If not admin:**
```json
{
  "success": false,
  "message": "Forbidden",
  "error": "Anda tidak memiliki akses ke resource ini"
}
```

---

## ⚠️ Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (optional)",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### HTTP Status Codes

- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `422` - Unprocessable Entity (Validation failed)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

---

## 🔄 Payment Gateway Integration

### Supported Payment Methods

1. **Virtual Account (VA)**
   - BCA Virtual Account
   - Mandiri Virtual Account
   - BNI Virtual Account
   - BRI Virtual Account

2. **E-Wallet**
   - OVO
   - GoPay
   - ShopeePay
   - DANA

3. **QRIS**
   - Universal QR Code

### Payment Flow

1. User checkout → Create order (status: pending)
2. Generate payment details via payment gateway API
3. Return payment details to user (VA number, QR code, etc)
4. User pays via their bank/e-wallet
5. Payment gateway sends callback to `/orders/payment-callback`
6. Backend verify payment → Update order status to 'paid'
7. Generate tickets → Send email
8. Done

### Payment Gateway Recommendations

- **Midtrans** (https://midtrans.com)
- **Xendit** (https://xendit.co)
- **Doku** (https://doku.com)

---

## 📊 Rate Limiting

- **Public endpoints:** 100 requests/minute per IP
- **Authenticated endpoints:** 1000 requests/minute per user
- **Admin endpoints:** 5000 requests/minute per admin

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1737456789
```

**Rate Limit Exceeded (429):**
```json
{
  "success": false,
  "message": "Too many requests",
  "retry_after": 60
}
```

---

## 🔍 Search & Filtering

### Event Search

Search dilakukan pada kolom:
- `title` (LIKE %query%)
- `description` (LIKE %query%)
- `venue` (LIKE %query%)
- `city` (LIKE %query%)
- `organizer` (LIKE %query%)

### Indexing Recommendations

Create indexes untuk performance:
```sql
CREATE INDEX idx_events_search ON events(title, city, status);
CREATE INDEX idx_orders_search ON orders(order_number, customer_email, status);
CREATE INDEX idx_tickets_search ON tickets(ticket_code, attendee_email, status);
```

---

## 📱 QR Code Generation

### QR Code Format

Encode ticket URL dalam QR code:
```
https://kartcis.id/verify/{ticket_code}
```

### QR Code Libraries

**Backend (Node.js):**
```bash
npm install qrcode
```

**Usage:**
```javascript
const QRCode = require('qrcode');

const qrCodeUrl = await QRCode.toDataURL(
  `https://kartcis.id/verify/${ticketCode}`,
  { width: 300, margin: 2 }
);
```

---

## 🌐 CORS Configuration

```javascript
// Allowed origins
const allowedOrigins = [
  'https://kartcis.id',
  'https://www.kartcis.id',
  'http://localhost:5173', // Development
];

// CORS headers
Access-Control-Allow-Origin: {origin}
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## 🔐 Security Best Practices

1. **Password Hashing:** bcrypt dengan salt rounds = 10
2. **JWT Secret:** Strong random string (min 32 characters)
3. **HTTPS Only:** Redirect HTTP to HTTPS
4. **Input Validation:** Validate & sanitize all inputs
5. **SQL Injection Prevention:** Use prepared statements
6. **XSS Prevention:** Escape HTML output
7. **CSRF Protection:** Use CSRF tokens for forms
8. **Rate Limiting:** Prevent brute force attacks
9. **API Keys:** Store in environment variables
10. **Logging:** Log all API requests & errors

---

## 📦 Environment Variables

```env
# Application
NODE_ENV=production
APP_URL=https://kartcis.id
API_URL=https://api.kartcis.id

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kartcis_db
DB_USER=kartcis_user
DB_PASSWORD=strong_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Payment Gateway (Example: Midtrans)
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_IS_PRODUCTION=true

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@kartcis.id
MAIL_PASSWORD=your-email-password
MAIL_FROM=KARTCIS.ID <noreply@kartcis.id>

# Storage (S3/Cloud)
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET=kartcis-storage
AWS_REGION=ap-southeast-1

# Redis (for caching & sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

---

## 🚀 Deployment Checklist

- [ ] Setup production database
- [ ] Configure environment variables
- [ ] Setup SSL/HTTPS certificate
- [ ] Configure CORS properly
- [ ] Setup rate limiting
- [ ] Configure email service (SMTP/SendGrid/SES)
- [ ] Setup payment gateway (Midtrans/Xendit)
- [ ] Configure file storage (S3/Cloud Storage)
- [ ] Setup Redis for caching
- [ ] Configure logging & monitoring (Sentry)
- [ ] Setup backup strategy
- [ ] Configure CDN for static assets
- [ ] Test all endpoints with Postman
- [ ] Load testing
- [ ] Security audit

---

## 📞 Support

**Developer Contact:**  
Email: dev@kartcis.id  
Documentation: https://docs.kartcis.id  
API Status: https://status.kartcis.id

---

**Version:** 1.0  
**Last Updated:** January 21, 2026  
**Maintained by:** KARTCIS.ID Development Team