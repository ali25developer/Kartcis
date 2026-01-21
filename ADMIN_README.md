# Admin Dashboard - KARTCIS.ID

## 🎯 Fitur Admin Dashboard

Dashboard admin untuk mengelola transaksi pembelian tiket dengan fitur:
- ✅ Statistik transaksi (Total, Selesai, Pending, Revenue)
- ✅ Daftar transaksi lengkap dengan filter & search
- ✅ Resend tiket ke email customer
- ✅ Pagination untuk data besar
- ✅ Mock API yang siap production

## 🔐 Login Sebagai Admin

**Email:** `admin@kartcis.id`  
**Password:** `admin123`

Setelah login, klik menu **Admin** di header untuk masuk ke dashboard.

## 📊 Data Mock Transaksi

Data dummy transaksi sudah otomatis ter-generate dengan:
- **50 transaksi** dengan berbagai status
- Status: `completed`, `pending`, `expired`, `cancelled`
- Data disimpan di localStorage dengan key `admin_transactions`

## 🔄 Migration ke Production Backend

Semua mock API sudah siap production. Tinggal ganti URL:

### 1. Update Base URL

Edit file `/src/app/services/adminApi.ts`:

```typescript
// Ganti ini:
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

// Dengan production URL:
const API_BASE_URL = 'https://api.kartcis.id/api';
```

### 2. Backend Endpoints yang Dibutuhkan

```
GET  /api/admin/transactions
     - Query params: page, limit, status, search
     - Response: { success, data: { transactions, stats, pagination } }

GET  /api/admin/transactions/:id
     - Response: { success, data: transaction }

POST /api/admin/transactions/:id/resend-email
     - Response: { success, message }

GET  /api/admin/stats
     - Response: { success, data: stats }
```

### 3. Headers untuk Authentication

Tambahkan header Authorization di setiap request:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
}
```

## 🛠️ Development Guide

### Testing dengan Mock Data

Mock data sudah ter-generate otomatis saat pertama kali load. Untuk reset data:

```javascript
// Di browser console:
localStorage.removeItem('admin_transactions');
// Refresh page untuk generate ulang
```

### Menambah User Admin Baru

Edit file `/src/app/contexts/AuthContext.tsx`:

```typescript
const MOCK_USERS = [
  // ... existing users
  {
    id: 1000,
    email: 'admin2@kartcis.id',
    password: 'password123',
    name: 'Admin 2',
    phone: '08111222333',
    role: 'admin',
  },
];
```

## 📱 Fitur Dashboard

### 1. Stats Cards
- Total Transaksi
- Transaksi Selesai
- Transaksi Pending
- Total Revenue

### 2. Filter & Search
- Filter by status: All, Completed, Pending, Expired, Cancelled
- Search: Order number, nama, email, event title

### 3. Resend Email
- Hanya available untuk transaksi `completed`
- Klik button "Resend" di kolom aksi
- Confirmation dialog akan muncul

### 4. Pagination
- Default 10 items per page
- Navigate dengan button "Sebelumnya" / "Selanjutnya"

## 🔒 Security Notes

- Protected route: Hanya user dengan `role: 'admin'` yang bisa akses
- Auto redirect ke home jika non-admin coba akses `/admin`
- Token validation di setiap API call (production)

## 📧 Email Template

Saat resend email, backend harus mengirim tiket dengan format:
- Attachment: PDF tiket dengan QR code
- Subject: "Tiket Event [Event Name] - KARTCIS.ID"
- Body: Detail event, QR code, instruksi check-in

## 🎨 Customization

### Mengubah Items Per Page

Edit file `/src/app/pages/AdminDashboard.tsx`:

```typescript
const response = await adminApi.getTransactions({
  page: currentPage,
  limit: 20, // Ganti dari 10 ke 20
  // ...
});
```

### Menambah Kolom Baru

1. Update interface `Transaction` di `/src/app/services/adminApi.ts`
2. Update mock data generator di `/src/app/data/mockTransactions.ts`
3. Tambahkan kolom di table AdminDashboard

## 🚀 Production Checklist

- [ ] Update `API_BASE_URL` ke production URL
- [ ] Implement proper authentication dengan JWT
- [ ] Setup CORS di backend
- [ ] Implement rate limiting
- [ ] Add error logging (Sentry, etc)
- [ ] Setup SSL/HTTPS
- [ ] Configure environment variables
- [ ] Test all endpoints dengan Postman

---

**Developer:** KARTCIS.ID Team  
**Last Updated:** January 2026
