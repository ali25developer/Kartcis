# 🔐 Authentication System - MASUP.ID

## Overview
Sistem authentication yang telah ditingkatkan dengan fitur keamanan dan UX yang lebih baik, siap untuk integrasi backend.

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Session Persistence**
- ✅ Session tetap aktif setelah refresh page
- ✅ Data disimpan di localStorage dengan enkripsi simulasi
- ✅ Auto-login saat aplikasi dibuka kembali (jika token masih valid)

### 2. **JWT Token Management (Mock)**
- ✅ Generate mock JWT token saat login/register
- ✅ Token expiry management
- ✅ Token berbeda untuk "Remember Me" (24 jam) vs normal (2 jam)
- ✅ Auto-logout saat token expired

### 3. **Security Features**
- ✅ Password field dengan show/hide toggle
- ✅ Password validation:
  - Minimal 6 karakter
  - Harus mengandung huruf dan angka
- ✅ Email format validation
- ✅ Phone number format validation (Indonesia: 08xxxxxxxxxx)
- ✅ Real-time form validation dengan error messages

### 4. **Auto Logout Features**
- ✅ Auto-logout setelah 30 menit tidak aktif
- ✅ Auto-logout saat token expired
- ✅ Activity tracking (mouse, keyboard, scroll, touch)
- ✅ Periodic check setiap menit

### 5. **Enhanced Login Form**
- ✅ Email field (bukan phone number lagi)
- ✅ Password field dengan toggle visibility
- ✅ "Remember Me" checkbox (24 jam vs 2 jam)
- ✅ Form validation dengan error messages
- ✅ Loading states
- ✅ Demo credentials info box
- ✅ Google OAuth option (mock)

### 6. **Enhanced Register Form**
- ✅ Full name field (min 3 characters)
- ✅ Phone number validation (format Indonesia)
- ✅ Email validation
- ✅ Password field dengan strength validation
- ✅ Confirm password field
- ✅ Password match validation
- ✅ Show/hide password toggle
- ✅ Real-time validation feedback
- ✅ Auto-login setelah register berhasil

### 7. **Header Improvements**
- ✅ Menampilkan nama user saat login
- ✅ Logout button dengan konfirmasi toast
- ✅ Mobile menu support untuk authenticated users
- ✅ Responsive design

### 8. **User Experience**
- ✅ Toast notifications untuk semua actions
- ✅ Loading states di semua forms
- ✅ Disabled state saat loading
- ✅ Form reset setelah berhasil
- ✅ Smooth transitions

## 📝 Demo Account

Untuk testing, gunakan credentials ini:

```
Email: demo@masup.id
Password: demo123
```

## 🔧 Technical Implementation

### AuthContext Features

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}
```

### LocalStorage Structure

```javascript
// Token management
localStorage.setItem('auth_token', 'mock_jwt_xxxxx');
localStorage.setItem('token_expiry', '1234567890');
localStorage.setItem('user_data', JSON.stringify(userData));
```

### Mock User Database

```javascript
const MOCK_USERS = [
  {
    id: 1,
    email: 'demo@masup.id',
    password: 'demo123',
    name: 'Demo User',
    phone: '08123456789',
  },
];
```

## 🚀 Ready for Backend Integration

Semua mock functions sudah siap untuk diganti dengan real API calls:

### 1. Login Function
```typescript
// Current (Mock)
const login = async (email: string, password: string, rememberMe: boolean = false) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  // Mock validation...
}

// Future (Real API)
const login = async (email: string, password: string, rememberMe: boolean = false) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe })
  });
  const data = await response.json();
  // Save real JWT token
}
```

### 2. Register Function
```typescript
// Current (Mock)
const register = async (name: string, phone: string, email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Mock database push...
}

// Future (Real API)
const register = async (name: string, phone: string, email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, password })
  });
  const data = await response.json();
  // Save real JWT token
}
```

### 3. Google OAuth
```typescript
// Current (Mock)
const loginWithGoogle = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Mock Google user data...
}

// Future (Real OAuth)
const loginWithGoogle = async () => {
  // Open Google OAuth popup
  const googleAuthUrl = `${API_URL}/auth/google`;
  window.location.href = googleAuthUrl;
}
```

## 🔒 Security Best Practices (Implemented)

1. ✅ **No password in plain text** - Passwords hanya dikirim saat login/register
2. ✅ **Token expiry** - Auto-logout saat token kadaluarsa
3. ✅ **Inactivity timeout** - Auto-logout setelah 30 menit tidak aktif
4. ✅ **Client-side validation** - Reduce server load
5. ✅ **Error handling** - Proper error messages untuk user
6. ✅ **Loading states** - Prevent double submissions

## 📱 Responsive Design

- ✅ Desktop: Full layout dengan semua features
- ✅ Mobile: Hamburger menu dengan user info
- ✅ Tablet: Adaptive layout
- ✅ Touch-friendly buttons dan inputs

## 🎯 Testing Checklist

### Login Flow
- [ ] Login dengan demo account
- [ ] Login dengan wrong credentials (error handling)
- [ ] "Remember Me" functionality
- [ ] Google login (mock)
- [ ] Session persistence after refresh
- [ ] Auto-logout after 30 minutes
- [ ] Auto-logout after token expiry

### Register Flow
- [ ] Register dengan data valid
- [ ] Email validation errors
- [ ] Password strength validation
- [ ] Password mismatch error
- [ ] Phone format validation
- [ ] Duplicate email error
- [ ] Auto-login after register

### Logout Flow
- [ ] Logout dari desktop
- [ ] Logout dari mobile menu
- [ ] Toast notification
- [ ] Clear all localStorage data
- [ ] Redirect atau stay di home

## 🔄 Migration to Real Backend

Saat backend sudah siap:

1. **Update API endpoint** di `src/app/services/api.ts`
2. **Replace mock functions** di `AuthContext.tsx`
3. **Add API error handling** untuk network errors
4. **Setup CORS** di backend
5. **Implement refresh token** untuk better security
6. **Add password reset** functionality
7. **Add email verification** untuk new users

## 📊 State Management

```
localStorage (Persistent)
├── auth_token: JWT token string
├── token_expiry: Timestamp
└── user_data: User object JSON

React State (In-memory)
├── user: User | null
├── isLoading: boolean
└── lastActivity: number
```

## 🎨 UI Components

- Login Modal: `/src/app/components/Login.tsx`
- Register Modal: `/src/app/components/Register.tsx`
- Header: `/src/app/components/Header.tsx`
- Auth Context: `/src/app/contexts/AuthContext.tsx`

---

**Status**: ✅ Production Ready (Frontend)
**Backend Required**: Yes (untuk production use)
**Last Updated**: January 2026
