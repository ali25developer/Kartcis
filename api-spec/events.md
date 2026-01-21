# Event APIs (Public)

Base URL: `/api/v1/events`

---

## Get All Events

**Endpoint:** `GET /events`

**Query Parameters:**
- `page` (int) - Default: 1
- `limit` (int) - Default: 12
- `category` (string) - Category slug
- `city` (string) - City name
- `province` (string) - Province name
- `search` (string) - Search by title, venue, description
- `featured` (boolean) - Filter featured events
- `status` (string) - published/completed/sold-out
- `sort` (string) - date_asc/date_desc/popular/newest
- `min_price` (float) - Minimum price
- `max_price` (float) - Maximum price
- `date_from` (date) - YYYY-MM-DD
- `date_to` (date) - YYYY-MM-DD

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
        "province": "DKI Jakarta",
        "organizer": "Jakarta Sports Association",
        "quota": 10000,
        "image": "https://storage.kartcis.id/events/jakarta-marathon.jpg",
        "is_featured": true,
        "view_count": 5432,
        "status": "published",
        "created_at": "2026-01-01T10:00:00Z",
        "category": {
          "id": 1,
          "name": "Marathon & Lari",
          "slug": "marathon-lari",
          "icon": "Footprints"
        },
        "ticket_types": [
          {
            "id": 1,
            "name": "Early Bird - Full Marathon",
            "price": 350000.00,
            "original_price": 500000.00,
            "available": 245,
            "quota": 500,
            "status": "available"
          },
          {
            "id": 2,
            "name": "Regular - Half Marathon",
            "price": 250000.00,
            "available": 890,
            "quota": 1000,
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

## Get Event Detail

**Endpoint:** `GET /events/{slug}`

**Path Parameters:**
- `slug` - Event slug

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Jakarta Marathon 2026",
    "slug": "jakarta-marathon-2026",
    "description": "Marathon internasional terbesar di Jakarta...",
    "detailed_description": "<p>Jakarta Marathon 2026 adalah event...</p>",
    "facilities": [
      "Medali finisher untuk semua kategori",
      "Sertifikat digital",
      "Running jersey official",
      "Goodie bag eksklusif",
      "Konsumsi & hydration station",
      "Medical support 24/7"
    ],
    "terms": [
      "Peserta harus berusia minimal 17 tahun",
      "Tiket tidak dapat dikembalikan",
      "Wajib membawa KTP saat registrasi ulang",
      "Wajib mengikuti protokol kesehatan"
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
    "address": "Jl. MH Thamrin, Jakarta Pusat",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "organizer": "Jakarta Sports Association",
    "quota": 10000,
    "image": "https://storage.kartcis.id/events/jakarta-marathon.jpg",
    "is_featured": true,
    "view_count": 5433,
    "status": "published",
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-21T14:30:00Z",
    "category": {
      "id": 1,
      "name": "Marathon & Lari",
      "slug": "marathon-lari",
      "description": "Event lari marathon, half marathon, fun run",
      "icon": "Footprints"
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
        "sale_start_date": "2026-01-01T00:00:00Z",
        "sale_end_date": "2026-02-01T23:59:59Z"
      },
      {
        "id": 2,
        "name": "Regular - Half Marathon",
        "description": "Tiket reguler",
        "price": 250000.00,
        "quota": 1000,
        "available": 890,
        "status": "available",
        "sale_start_date": "2026-01-01T00:00:00Z",
        "sale_end_date": "2026-03-14T23:59:59Z"
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

## Get Popular Events

**Endpoint:** `GET /events/popular`

**Query Parameters:**
- `limit` (int) - Default: 6

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
      "image": "https://storage.kartcis.id/events/jakarta-marathon.jpg",
      "is_featured": true,
      "view_count": 5432,
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

## Get Featured Events

**Endpoint:** `GET /events/featured`

**Query Parameters:**
- `limit` (int) - Default: 6

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
      "venue": "Bundaran HI - Monas",
      "city": "Jakarta",
      "image": "https://storage.kartcis.id/events/jakarta-marathon.jpg",
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

## Get Upcoming Events

**Endpoint:** `GET /events/upcoming`

**Query Parameters:**
- `limit` (int) - Default: 12

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Jakarta Marathon 2026",
      "slug": "jakarta-marathon-2026",
      "event_date": "2026-03-15",
      "venue": "Bundaran HI - Monas",
      "city": "Jakarta",
      "image": "https://storage.kartcis.id/events/jakarta-marathon.jpg",
      "min_price": 250000.00,
      "category": {
        "name": "Marathon & Lari",
        "slug": "marathon-lari"
      }
    }
  ]
}
```

---

## Get Cities with Events

**Endpoint:** `GET /cities`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "event_count": 45
    },
    {
      "city": "Bandung",
      "province": "Jawa Barat",
      "event_count": 23
    },
    {
      "city": "Surabaya",
      "province": "Jawa Timur",
      "event_count": 18
    }
  ]
}
```
