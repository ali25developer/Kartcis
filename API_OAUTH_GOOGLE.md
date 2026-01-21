# KARTCIS.ID - Google OAuth Login API Specification

## 📋 Overview

Dokumentasi API untuk implementasi Google OAuth 2.0 Login.

**Authentication Flow:** OAuth 2.0  
**Provider:** Google  
**Scopes:** `openid email profile`  
**Grant Type:** Authorization Code

---

## 🗄️ Database Schema

### Table: `social_accounts`

Menyimpan data OAuth/Social login connections.

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
    "picture": "https://lh3.googleusercontent.com/a/ACg8ocL...",
    "given_name": "Budi",
    "family_name": "Santoso",
    "locale": "id",
    "verified_email": true
  },
  "created_at": "2026-01-10 08:00:00",
  "updated_at": "2026-01-20 15:45:00"
}
```

---

### Table: `users` - Modified

Modifikasi table users untuk support OAuth login.

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- NULL untuk OAuth-only users
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  avatar VARCHAR(500), -- Profile picture URL dari Google
  email_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

**Sample OAuth User:**
```json
{
  "id": 1,
  "name": "Budi Santoso",
  "email": "budi@gmail.com",
  "password": null,
  "phone": null,
  "role": "user",
  "avatar": "https://lh3.googleusercontent.com/a/ACg8ocL...",
  "email_verified_at": "2026-01-21 10:30:00",
  "created_at": "2026-01-21 10:30:00",
  "updated_at": "2026-01-21 10:30:00"
}
```

---

## 🔑 API Endpoints

### 1. Initiate Google OAuth

**Endpoint:** `GET /auth/google`

**Description:** Redirect user ke Google OAuth consent screen.

**Query Parameters:**
- `redirect_uri` (optional): URL tujuan setelah login berhasil
  - Default: Frontend homepage
  - Example: `https://kartcis.id/dashboard`

**Request Example:**
```
GET /auth/google?redirect_uri=https://kartcis.id/dashboard
```

**Response:** HTTP 302 Redirect
```
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=123456789-abcdef.apps.googleusercontent.com
  &redirect_uri=https://api.kartcis.id/auth/google/callback
  &response_type=code
  &scope=openid%20email%20profile
  &access_type=offline
  &prompt=consent
  &state=eyJyZWRpcmVjdF91cmkiOiJodHRwczovL2thcnRjaXMuaWQvZGFzaGJvYXJkIiwidGltZXN0YW1wIjoxNzM3NDU2Nzg5LCJub25jZSI6ImFiYzEyMyJ9
```

**State Parameter (Base64 Encoded JSON):**
```json
{
  "redirect_uri": "https://kartcis.id/dashboard",
  "timestamp": 1737456789,
  "nonce": "random-csrf-token-abc123"
}
```

**Implementation Notes:**
- Encrypt atau sign state parameter untuk security
- State harus expire dalam 5 menit
- Include nonce untuk CSRF protection

---

### 2. Google OAuth Callback

**Endpoint:** `GET /auth/google/callback`

**Description:** Handle callback dari Google setelah user authorize.

**Query Parameters (dari Google):**
- `code` (string, required): Authorization code
- `state` (string, required): State parameter yang kita kirim sebelumnya
- `scope` (string): Granted scopes
- `authuser` (number): Google account index
- `prompt` (string): consent atau none

**Request Example:**
```
GET /auth/google/callback?
  code=4/0AfJohXk1234567890abcdefghijklmnop
  &scope=email%20profile%20openid%20https://www.googleapis.com/auth/userinfo.email
  &authuser=0
  &prompt=consent
  &state=eyJyZWRpcmVjdF91cmkiOiJodHRwczovL2thcnRjaXMuaWQvZGFzaGJvYXJkIiwidGltZXN0YW1wIjoxNzM3NDU2Nzg5LCJub25jZSI6ImFiYzEyMyJ9
```

**Business Logic:**

#### Step 1: Verify State Parameter
```javascript
// Decrypt/decode state
const state = decryptState(req.query.state);

// Verify timestamp (max 5 minutes)
if (Date.now() - state.timestamp > 300000) {
  return redirectToFrontend({
    error: 'state_expired',
    message: 'OAuth state expired'
  });
}

// Extract redirect_uri
const redirectUri = state.redirect_uri || process.env.FRONTEND_URL;
```

#### Step 2: Exchange Code for Tokens
```javascript
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

{
  "code": "4/0AfJohXk...",
  "client_id": process.env.GOOGLE_CLIENT_ID,
  "client_secret": process.env.GOOGLE_CLIENT_SECRET,
  "redirect_uri": "https://api.kartcis.id/auth/google/callback",
  "grant_type": "authorization_code"
}
```

**Google Token Response:**
```json
{
  "access_token": "ya29.a0AfH6SMBx1234567890abcdefghijklmnop",
  "expires_in": 3599,
  "refresh_token": "1//0gHZ9abcdefghijklmnop",
  "scope": "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFjY2FjNWI3..."
}
```

#### Step 3: Get User Info from Google
```javascript
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer ya29.a0AfH6SMBx...
```

**Google User Info Response:**
```json
{
  "id": "106123456789012345678",
  "email": "budi@gmail.com",
  "verified_email": true,
  "name": "Budi Santoso",
  "given_name": "Budi",
  "family_name": "Santoso",
  "picture": "https://lh3.googleusercontent.com/a/ACg8ocL...",
  "locale": "id"
}
```

#### Step 4: Create or Update User

**Query 1: Check if user exists**
```sql
SELECT * FROM users WHERE email = 'budi@gmail.com';
```

**If user NOT exists (new registration):**
```sql
INSERT INTO users (
  name, 
  email, 
  password, 
  avatar, 
  email_verified_at, 
  created_at, 
  updated_at
) VALUES (
  'Budi Santoso',
  'budi@gmail.com',
  NULL,
  'https://lh3.googleusercontent.com/a/ACg8ocL...',
  NOW(),
  NOW(),
  NOW()
);
```

**If user exists:**
```sql
UPDATE users 
SET 
  avatar = 'https://lh3.googleusercontent.com/a/ACg8ocL...',
  email_verified_at = COALESCE(email_verified_at, NOW()),
  updated_at = NOW()
WHERE email = 'budi@gmail.com';
```

#### Step 5: Create or Update Social Account

**Query: Check if social account exists**
```sql
SELECT * FROM social_accounts 
WHERE provider = 'google' 
  AND provider_id = '106123456789012345678';
```

**If NOT exists:**
```sql
INSERT INTO social_accounts (
  user_id,
  provider,
  provider_id,
  provider_token,
  provider_refresh_token,
  provider_data,
  created_at,
  updated_at
) VALUES (
  1,
  'google',
  '106123456789012345678',
  'ya29.a0AfH6SMBx...',
  '1//0gHZ9...',
  '{"email":"budi@gmail.com","name":"Budi Santoso",...}',
  NOW(),
  NOW()
);
```

**If exists:**
```sql
UPDATE social_accounts 
SET 
  provider_token = 'ya29.a0AfH6SMBx...',
  provider_refresh_token = '1//0gHZ9...',
  provider_data = '{"email":"budi@gmail.com",...}',
  updated_at = NOW()
WHERE provider = 'google' 
  AND provider_id = '106123456789012345678';
```

#### Step 6: Generate JWT Token

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    user_id: 1,
    email: 'budi@gmail.com',
    role: 'user'
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

#### Step 7: Redirect to Frontend

**Success Response:** HTTP 302 Redirect
```
Location: https://kartcis.id/dashboard?
  token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  &status=success
  &is_new_user=false
```

**Error Response:** HTTP 302 Redirect
```
Location: https://kartcis.id/login?
  error=google_auth_failed
  &message=Invalid+authorization+code
```

**Implementation Code (Node.js/Express):**
```javascript
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // 1. Verify state
    const stateData = verifyState(state);
    
    // 2. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // 3. Get user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    
    // 4. Create or update user
    const user = await createOrUpdateUser(googleUser);
    
    // 5. Create or update social account
    await createOrUpdateSocialAccount(user.id, googleUser, tokens);
    
    // 6. Generate JWT
    const jwtToken = generateJWT(user);
    
    // 7. Redirect to frontend
    const redirectUrl = `${stateData.redirect_uri}?token=${jwtToken}&status=success&is_new_user=${user.is_new}`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    const redirectUrl = `${process.env.FRONTEND_URL}/login?error=google_auth_failed&message=${error.message}`;
    res.redirect(redirectUrl);
  }
});
```

---

### 3. Google One Tap Login

**Endpoint:** `POST /auth/google/one-tap`

**Description:** Alternative login method using Google One Tap (tanpa redirect).

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFjY2FjNWI3ZTQw..."
}
```

**Validation Rules:**
- `credential`: required, string (JWT token dari Google One Tap)

**Business Logic:**

#### Step 1: Verify Google JWT Token

```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ticket = await client.verifyIdToken({
  idToken: req.body.credential,
  audience: process.env.GOOGLE_CLIENT_ID,
});

const payload = ticket.getPayload();
```

#### Step 2: Decoded JWT Payload

```json
{
  "iss": "https://accounts.google.com",
  "azp": "123456789-abcdef.apps.googleusercontent.com",
  "aud": "123456789-abcdef.apps.googleusercontent.com",
  "sub": "106123456789012345678",
  "email": "budi@gmail.com",
  "email_verified": true,
  "name": "Budi Santoso",
  "picture": "https://lh3.googleusercontent.com/a/...",
  "given_name": "Budi",
  "family_name": "Santoso",
  "locale": "id",
  "iat": 1737456789,
  "exp": 1737460389
}
```

#### Step 3: Create/Update User (Same as Callback)

Gunakan logic yang sama dengan callback handler untuk:
- Create or update user
- Create or update social_accounts
- Generate JWT token

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
      "email_verified_at": "2026-01-21T10:30:00.000Z",
      "created_at": "2026-01-21T10:30:00.000Z"
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
  "error": "Invalid credential or token expired"
}
```

**Implementation Code:**
```javascript
app.post('/auth/google/one-tap', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // 1. Verify Google JWT
    const ticket = await verifyGoogleToken(credential);
    const payload = ticket.getPayload();
    
    // 2. Create or update user
    const user = await createOrUpdateUser({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified_email: payload.email_verified
    });
    
    // 3. Create or update social account
    await createOrUpdateSocialAccount(user.id, payload, { access_token: credential });
    
    // 4. Generate JWT
    const jwtToken = generateJWT(user);
    
    // 5. Return response
    res.json({
      success: true,
      message: 'Login dengan Google berhasil',
      data: {
        user,
        token: jwtToken,
        expires_in: 86400,
        is_new_user: user.is_new
      }
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
});
```

---

### 4. Get Connected Social Accounts

**Endpoint:** `GET /auth/social`

**Description:** Get list social accounts yang terhubung dengan user.

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
        "connected_at": "2026-01-21T10:30:00.000Z"
      }
    ],
    "available": ["facebook", "apple"],
    "has_password": false
  }
}
```

**Query:**
```sql
SELECT 
  sa.id,
  sa.provider,
  sa.provider_data->>'$.email' as provider_email,
  sa.provider_data->>'$.name' as provider_name,
  sa.provider_data->>'$.picture' as provider_picture,
  sa.created_at as connected_at
FROM social_accounts sa
WHERE sa.user_id = ?;
```

**Notes:**
- `connected`: Array of connected social accounts
- `available`: Providers yang available tapi belum connected
- `has_password`: Boolean, penting untuk unlink validation

---

### 5. Unlink Social Account

**Endpoint:** `DELETE /auth/social/{provider}`

**Description:** Unlink/disconnect social account dari user.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `provider`: 'google', 'facebook', 'apple'

**Request Example:**
```
DELETE /auth/social/google
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Business Logic:**

#### Step 1: Get User & Verify Authentication
```javascript
const user = await getUserFromToken(req.headers.authorization);
```

#### Step 2: Check if User Has Password
```sql
SELECT password FROM users WHERE id = ?;
```

#### Step 3: Validation
```javascript
if (!user.password) {
  return res.status(400).json({
    success: false,
    message: 'Tidak dapat melepas akun Google',
    error: 'Anda harus mengatur password terlebih dahulu. Ini adalah satu-satunya metode login Anda.'
  });
}
```

#### Step 4: Delete Social Account
```sql
DELETE FROM social_accounts 
WHERE user_id = ? AND provider = 'google';
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
  "error": "Anda harus mengatur password terlebih dahulu. Ini adalah satu-satunya metode login Anda."
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Akun Google tidak terhubung"
}
```

---

### 6. Set Password (OAuth-Only Users)

**Endpoint:** `POST /auth/set-password`

**Description:** Set password untuk user yang hanya login via OAuth (password = null).

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

**Validation Rules:**
- `password`: required, string, min 6 characters
- `password_confirmation`: required, same as password

**Business Logic:**

#### Step 1: Get User
```javascript
const user = await getUserFromToken(req.headers.authorization);
```

#### Step 2: Check if User Already Has Password
```javascript
if (user.password) {
  return res.status(400).json({
    success: false,
    message: 'Password sudah diatur',
    error: 'Gunakan endpoint /auth/change-password untuk mengubah password'
  });
}
```

#### Step 3: Hash & Update Password
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(req.body.password, 10);
```

```sql
UPDATE users 
SET password = ?, updated_at = NOW()
WHERE id = ? AND password IS NULL;
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password berhasil diatur. Sekarang Anda bisa login dengan email & password."
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Password sudah diatur",
  "error": "Gunakan endpoint /auth/change-password untuk mengubah password"
}
```

---

## 🔧 Environment Variables

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://api.kartcis.id/auth/google/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=https://kartcis.id

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# State Encryption Key (for CSRF protection)
STATE_ENCRYPTION_KEY=another-secret-key-for-encrypting-state-parameter
```

---

## 📦 Required NPM Packages

```bash
# Core OAuth packages
npm install passport passport-google-oauth20

# For Google One Tap verification
npm install google-auth-library

# For JWT & password hashing
npm install jsonwebtoken bcrypt

# For state encryption
npm install crypto-js
```

**package.json:**
```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "google-auth-library": "^9.6.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "crypto-js": "^4.2.0",
    "express": "^4.18.2"
  }
}
```

---

## 🔐 Google Cloud Console Setup

### 1. Create Project

1. Go to https://console.cloud.google.com
2. Click **Select a project** → **New Project**
3. Project name: `KARTCIS`
4. Click **Create**

### 2. Enable APIs

1. Go to **APIs & Services** → **Library**
2. Search & Enable:
   - **Google+ API**
   - **People API** (optional, untuk additional user info)

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Configure consent screen (if first time):
   - User Type: **External**
   - App name: `KARTCIS`
   - User support email: `support@kartcis.id`
   - Developer contact: `dev@kartcis.id`
4. Application type: **Web application**
5. Name: `KARTCIS Production`

### 4. Configure Authorized URLs

**Authorized JavaScript origins:**
```
https://kartcis.id
https://www.kartcis.id
https://api.kartcis.id
http://localhost:5173
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://api.kartcis.id/auth/google/callback
http://localhost:3000/auth/google/callback
```

### 5. Get Credentials

- **Client ID**: Copy dan simpan ke `.env` sebagai `GOOGLE_CLIENT_ID`
- **Client Secret**: Copy dan simpan ke `.env` sebagai `GOOGLE_CLIENT_SECRET`

**Example:**
```
Client ID: 123456789-abc123def456ghi789jkl.apps.googleusercontent.com
Client Secret: GOCSPX-1234567890abcdefghijklmnop
```

---

## 🔒 Security Best Practices

### 1. State Parameter (CSRF Protection)

**Encrypt state parameter dengan:**
```javascript
const CryptoJS = require('crypto-js');

function encryptState(data) {
  const stateData = {
    redirect_uri: data.redirect_uri,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  return CryptoJS.AES.encrypt(
    JSON.stringify(stateData),
    process.env.STATE_ENCRYPTION_KEY
  ).toString();
}

function decryptState(encryptedState) {
  const bytes = CryptoJS.AES.decrypt(
    encryptedState,
    process.env.STATE_ENCRYPTION_KEY
  );
  
  const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  
  // Verify timestamp (max 5 minutes)
  if (Date.now() - decrypted.timestamp > 300000) {
    throw new Error('State expired');
  }
  
  return decrypted;
}
```

### 2. Token Verification (One Tap)

**Always verify Google JWT:**
```javascript
const { OAuth2Client } = require('google-auth-library');

async function verifyGoogleToken(token) {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  return ticket;
}
```

### 3. HTTPS Only in Production

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

### 4. Secure Token Storage

**Database:**
```javascript
// Encrypt tokens before storing
const encryptedToken = encrypt(accessToken, process.env.TOKEN_ENCRYPTION_KEY);

await db.query(
  'UPDATE social_accounts SET provider_token = ? WHERE id = ?',
  [encryptedToken, socialAccountId]
);
```

### 5. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 OAuth attempts
  message: 'Too many OAuth attempts, please try again later'
});

app.get('/auth/google', oauthLimiter, handleGoogleAuth);
app.post('/auth/google/one-tap', oauthLimiter, handleGoogleOneTap);
```

### 6. Email Verification

Google emails are pre-verified:
```javascript
// Automatically set email_verified_at for Google users
const user = await createUser({
  email: googleUser.email,
  email_verified_at: new Date(), // Auto-verified
  ...
});
```

---

## 🧪 Testing

### 1. Test OAuth Flow (Manual)

**Step-by-step:**
1. Open browser: `http://localhost:3000/auth/google`
2. Should redirect to Google consent screen
3. Login with Google account
4. Approve permissions
5. Should redirect to: `http://localhost:5173/dashboard?token=...&status=success`
6. Verify user created in database
7. Verify social_accounts record created

### 2. Test with Postman (One Tap)

**Note:** Untuk testing One Tap, buat mock endpoint development:

```javascript
// DEVELOPMENT ONLY - Mock endpoint
if (process.env.NODE_ENV === 'development') {
  app.post('/auth/google/mock', async (req, res) => {
    const mockGoogleUser = {
      sub: '999999999999999999999',
      email: 'test@gmail.com',
      name: 'Test User',
      picture: 'https://via.placeholder.com/150',
      email_verified: true
    };
    
    const user = await createOrUpdateUser(mockGoogleUser);
    const token = generateJWT(user);
    
    res.json({
      success: true,
      data: { user, token, is_new_user: true }
    });
  });
}
```

**Postman Request:**
```
POST http://localhost:3000/auth/google/mock
Content-Type: application/json

{}
```

### 3. Database Verification Queries

**Check if user created:**
```sql
SELECT * FROM users 
WHERE email = 'test@gmail.com';
```

**Check if social account linked:**
```sql
SELECT * FROM social_accounts 
WHERE user_id = 1 AND provider = 'google';
```

**Check OAuth-only users (no password):**
```sql
SELECT id, name, email, password, avatar 
FROM users 
WHERE password IS NULL;
```

---

## 📊 Helper Functions (Implementation Examples)

### Create or Update User

```javascript
async function createOrUpdateUser(googleUser) {
  const existingUser = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [googleUser.email]
  );
  
  if (existingUser.length > 0) {
    // Update existing user
    await db.query(
      `UPDATE users 
       SET avatar = ?, 
           email_verified_at = COALESCE(email_verified_at, NOW()),
           updated_at = NOW()
       WHERE email = ?`,
      [googleUser.picture, googleUser.email]
    );
    
    return { ...existingUser[0], is_new: false };
  } else {
    // Create new user
    const result = await db.query(
      `INSERT INTO users (name, email, password, avatar, email_verified_at, created_at, updated_at)
       VALUES (?, ?, NULL, ?, NOW(), NOW(), NOW())`,
      [googleUser.name, googleUser.email, googleUser.picture]
    );
    
    return {
      id: result.insertId,
      name: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      role: 'user',
      is_new: true
    };
  }
}
```

### Create or Update Social Account

```javascript
async function createOrUpdateSocialAccount(userId, googleUser, tokens) {
  const existing = await db.query(
    'SELECT * FROM social_accounts WHERE provider = ? AND provider_id = ?',
    ['google', googleUser.id || googleUser.sub]
  );
  
  const providerData = {
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    given_name: googleUser.given_name,
    family_name: googleUser.family_name,
    locale: googleUser.locale,
    verified_email: googleUser.verified_email || googleUser.email_verified
  };
  
  if (existing.length > 0) {
    // Update tokens
    await db.query(
      `UPDATE social_accounts 
       SET provider_token = ?, 
           provider_refresh_token = ?,
           provider_data = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        tokens.access_token,
        tokens.refresh_token,
        JSON.stringify(providerData),
        existing[0].id
      ]
    );
  } else {
    // Create new
    await db.query(
      `INSERT INTO social_accounts 
       (user_id, provider, provider_id, provider_token, provider_refresh_token, provider_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        'google',
        googleUser.id || googleUser.sub,
        tokens.access_token,
        tokens.refresh_token,
        JSON.stringify(providerData)
      ]
    );
  }
}
```

### Exchange Code for Tokens

```javascript
const axios = require('axios');

async function exchangeCodeForTokens(code) {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code'
  });
  
  return response.data;
}
```

### Get Google User Info

```javascript
async function getGoogleUserInfo(accessToken) {
  const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  return response.data;
}
```

---

## 🔄 User Flow Scenarios

### Scenario 1: New User (First Time Login)

1. User clicks Google login button
2. Frontend redirects to `/auth/google`
3. Backend redirects to Google OAuth consent
4. User approves permissions
5. Google redirects to `/auth/google/callback?code=...`
6. Backend exchanges code for tokens
7. Backend gets user info from Google
8. Backend checks: **User NOT exists** (by email)
9. Backend creates new user (password = NULL, avatar from Google)
10. Backend creates social_accounts record
11. Backend generates JWT token
12. Backend redirects to frontend with token
13. ✅ User logged in as new user

**Database Result:**
- 1 new record in `users` table
- 1 new record in `social_accounts` table

---

### Scenario 2: Existing User Login

1. User (already registered) clicks Google login
2. ... (same flow until step 8)
3. Backend checks: **User EXISTS** (by email)
4. Backend updates user avatar (if changed)
5. Backend updates social_accounts tokens
6. Backend generates JWT token
7. Backend redirects to frontend with token
8. ✅ User logged in

**Database Result:**
- User record updated (avatar, updated_at)
- social_accounts record updated (tokens, updated_at)

---

### Scenario 3: Email Conflict - Auto Link (Recommended)

**Situation:** User registered dengan email/password `budi@gmail.com`, lalu login dengan Google menggunakan email yang sama.

**Flow:**
1. User tries Google login
2. Backend detects email already exists in `users` table
3. Backend checks if social_accounts exists for this user + Google
4. **If NOT exists:** Auto-link Google account
5. Backend creates social_accounts record with existing user_id
6. ✅ User can now login via email/password OR Google

**Database Result:**
- User record stays the same (no duplicate)
- New social_accounts record created (linking Google to existing user)

---

### Scenario 4: Unlink Google Account

**Precondition:** User has password set

1. User goes to settings
2. User clicks "Unlink Google Account"
3. Frontend sends DELETE `/auth/social/google`
4. Backend checks: User has password? ✅
5. Backend deletes social_accounts record
6. ✅ Google account unlinked

**Precondition:** User has NO password (OAuth-only)

1. User tries to unlink Google
2. Backend checks: User has password? ❌
3. Backend returns error: "Set password first"
4. ❌ Cannot unlink (would lock user out)

---

## 📋 Summary

### ✅ Features Implemented:

- **Google OAuth 2.0 Login** (redirect flow)
- **Google One Tap** (alternative method)
- **Auto User Creation** on first login
- **Auto Account Linking** (email-based)
- **Avatar Sync** from Google profile
- **Email Auto-Verification** (Google pre-verified)
- **Social Account Management**
- **Unlink Account** (with password check)
- **Set Password** for OAuth-only users
- **CSRF Protection** via state parameter
- **Token Management** (access + refresh)

### 📊 Database Tables:

- `users` (modified: password nullable, avatar field)
- `social_accounts` (new: OAuth connections)

### 🔑 API Endpoints:

1. `GET /auth/google` - Initiate OAuth flow
2. `GET /auth/google/callback` - Handle OAuth callback
3. `POST /auth/google/one-tap` - Google One Tap login
4. `GET /auth/social` - Get connected accounts
5. `DELETE /auth/social/{provider}` - Unlink account
6. `POST /auth/set-password` - Set password for OAuth users

### 🔐 Security Features:

- State parameter encryption (CSRF)
- JWT token verification
- HTTPS enforcement
- Rate limiting
- Token encryption in database
- Email auto-verification

---

**Version:** 1.0  
**Last Updated:** January 21, 2026  
**Maintained by:** KARTCIS.ID Development Team
