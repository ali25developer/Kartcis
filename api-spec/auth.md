# Authentication APIs

Base URL: `/api/v1/auth`

---

## Register

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
      "avatar": null,
      "is_active": true,
      "email_verified_at": null,
      "created_at": "2026-01-21T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
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

## Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "budi@gmail.com",
  "password": "password123",
  "remember_me": false
}
```

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
      "avatar": null,
      "is_active": true,
      "email_verified_at": null,
      "last_login_at": "2026-01-21T10:30:00Z",
      "created_at": "2026-01-21T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
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

## Get Current User

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
    "avatar": null,
    "is_active": true,
    "email_verified_at": null,
    "last_login_at": "2026-01-21T10:30:00Z",
    "created_at": "2026-01-21T10:30:00Z",
    "updated_at": "2026-01-21T10:30:00Z"
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

## Logout

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

## Google OAuth - Initiate

**Endpoint:** `GET /auth/google`

**Query Parameters:**
- `redirect_uri` (optional) - Frontend URL untuk redirect setelah login

**Response:** HTTP 302 Redirect ke Google OAuth consent screen

---

## Google OAuth - Callback

**Endpoint:** `GET /auth/google/callback`

**Query Parameters (dari Google):**
- `code` - Authorization code
- `state` - State parameter

**Response:** HTTP 302 Redirect ke frontend
```
{frontend_url}?token={jwt_token}&status=success&is_new_user=false
```

**Error Redirect:**
```
{frontend_url}/login?error=google_auth_failed&message=Invalid+code
```

---

## Google One Tap Login

**Endpoint:** `POST /auth/google/one-tap`

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFjY..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login dengan Google berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@gmail.com",
      "phone": null,
      "role": "user",
      "avatar": "https://lh3.googleusercontent.com/a/...",
      "is_active": true,
      "email_verified_at": "2026-01-21T10:30:00Z",
      "created_at": "2026-01-21T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "is_new_user": false
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Google authentication failed",
  "error": "Invalid credential"
}
```

---

## Get Connected Social Accounts

**Endpoint:** `GET /auth/social`

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "connected": [
      {
        "id": 1,
        "provider": "google",
        "provider_email": "budi@gmail.com",
        "provider_name": "Budi Santoso",
        "provider_picture": "https://lh3.googleusercontent.com/a/...",
        "connected_at": "2026-01-21T10:30:00Z"
      }
    ],
    "available": ["facebook", "apple"],
    "has_password": false
  }
}
```

---

## Unlink Social Account

**Endpoint:** `DELETE /auth/social/{provider}`

**Path Parameters:**
- `provider` - google, facebook, apple

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Akun Google berhasil dilepaskan"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Tidak dapat melepas akun Google",
  "error": "Anda harus mengatur password terlebih dahulu"
}
```

---

## Set Password (OAuth Users)

**Endpoint:** `POST /auth/set-password`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password berhasil diatur"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Password sudah diatur",
  "error": "Gunakan endpoint /auth/change-password"
}
```
