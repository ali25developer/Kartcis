# KARTCIS.ID - Google OAuth API for Golang Backend

## 📋 Overview

Complete Google OAuth 2.0 implementation untuk Golang backend.

**Backend:** Golang 1.21+  
**Framework:** Gin  
**OAuth Library:** `golang.org/x/oauth2`  
**Google Library:** `google.golang.org/api`

---

## 🗄️ Database Schema

### Table: `users`

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- NULL untuk OAuth-only users
  phone VARCHAR(20),
  role ENUM('user', 'admin', 'organizer') DEFAULT 'user',
  avatar VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: `social_accounts`

```sql
CREATE TABLE social_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  provider_token TEXT,
  provider_refresh_token TEXT,
  provider_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider (provider, provider_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔑 API Endpoints

### 1. Initiate Google OAuth

**Endpoint:** `GET /auth/google`

**Query Parameters:**
- `redirect_uri` (optional): Frontend redirect URL after success

**Golang Implementation:**

```go
package handlers

import (
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
    "net/http"
    "os"
    "time"
    
    "github.com/gin-gonic/gin"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

var googleOauthConfig = &oauth2.Config{
    ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
    ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
    RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URI"),
    Scopes: []string{
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    },
    Endpoint: google.Endpoint,
}

type OAuthState struct {
    RedirectURI string    `json:"redirect_uri"`
    Timestamp   int64     `json:"timestamp"`
    Nonce       string    `json:"nonce"`
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
    // Get redirect URI from query param
    redirectURI := c.DefaultQuery("redirect_uri", os.Getenv("FRONTEND_URL"))
    
    // Generate state
    state := OAuthState{
        RedirectURI: redirectURI,
        Timestamp:   time.Now().Unix(),
        Nonce:       generateRandomString(32),
    }
    
    // Encode state to base64
    stateJSON, _ := json.Marshal(state)
    stateBase64 := base64.URLEncoding.EncodeToString(stateJSON)
    
    // Generate OAuth URL
    url := googleOauthConfig.AuthCodeURL(stateBase64, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
    
    c.Redirect(http.StatusTemporaryRedirect, url)
}

func generateRandomString(n int) string {
    b := make([]byte, n)
    rand.Read(b)
    return base64.URLEncoding.EncodeToString(b)
}
```

---

### 2. Google OAuth Callback

**Endpoint:** `GET /auth/google/callback`

**Golang Implementation:**

```go
package handlers

import (
    "context"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
    
    "github.com/gin-gonic/gin"
    "golang.org/x/crypto/bcrypt"
)

type GoogleUserInfo struct {
    ID            string `json:"id"`
    Email         string `json:"email"`
    VerifiedEmail bool   `json:"verified_email"`
    Name          string `json:"name"`
    GivenName     string `json:"given_name"`
    FamilyName    string `json:"family_name"`
    Picture       string `json:"picture"`
    Locale        string `json:"locale"`
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
    // Get code and state from query
    code := c.Query("code")
    stateBase64 := c.Query("state")
    
    // Decode state
    stateJSON, err := base64.URLEncoding.DecodeString(stateBase64)
    if err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=invalid_state", os.Getenv("FRONTEND_URL")))
        return
    }
    
    var state OAuthState
    if err := json.Unmarshal(stateJSON, &state); err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=invalid_state", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Verify state timestamp (max 5 minutes)
    if time.Now().Unix()-state.Timestamp > 300 {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=state_expired", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Exchange code for token
    token, err := googleOauthConfig.Exchange(context.Background(), code)
    if err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=token_exchange_failed", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Get user info from Google
    googleUser, err := getGoogleUserInfo(token.AccessToken)
    if err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=failed_to_get_user_info", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Create or update user
    user, isNewUser, err := h.createOrUpdateUser(googleUser)
    if err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=user_creation_failed", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Create or update social account
    if err := h.createOrUpdateSocialAccount(user.ID, googleUser, token); err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=social_account_failed", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Generate JWT token
    jwtToken, err := generateJWT(user)
    if err != nil {
        c.Redirect(http.StatusTemporaryRedirect, 
            fmt.Sprintf("%s/login?error=jwt_generation_failed", os.Getenv("FRONTEND_URL")))
        return
    }
    
    // Redirect to frontend with token
    redirectURL := fmt.Sprintf("%s?token=%s&status=success&is_new_user=%t", 
        state.RedirectURI, jwtToken, isNewUser)
    c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func getGoogleUserInfo(accessToken string) (*GoogleUserInfo, error) {
    resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var userInfo GoogleUserInfo
    if err := json.Unmarshal(body, &userInfo); err != nil {
        return nil, err
    }
    
    return &userInfo, nil
}

func (h *AuthHandler) createOrUpdateUser(googleUser *GoogleUserInfo) (*models.User, bool, error) {
    var user models.User
    isNewUser := false
    
    // Check if user exists
    result := h.db.Where("email = ?", googleUser.Email).First(&user)
    
    if result.Error != nil {
        // User doesn't exist, create new
        now := time.Now()
        user = models.User{
            Name:            googleUser.Name,
            Email:           googleUser.Email,
            Password:        nil, // OAuth users don't have password
            Avatar:          googleUser.Picture,
            Role:            "user",
            IsActive:        true,
            EmailVerifiedAt: &now,
            LastLoginAt:     &now,
        }
        
        if err := h.db.Create(&user).Error; err != nil {
            return nil, false, err
        }
        
        isNewUser = true
    } else {
        // User exists, update avatar and last login
        now := time.Now()
        updates := map[string]interface{}{
            "avatar":        googleUser.Picture,
            "last_login_at": &now,
        }
        
        // Set email verified if not already
        if user.EmailVerifiedAt == nil {
            updates["email_verified_at"] = &now
        }
        
        h.db.Model(&user).Updates(updates)
    }
    
    return &user, isNewUser, nil
}

func (h *AuthHandler) createOrUpdateSocialAccount(userID uint, googleUser *GoogleUserInfo, token *oauth2.Token) error {
    // Create provider data JSON
    providerData := map[string]interface{}{
        "email":          googleUser.Email,
        "name":           googleUser.Name,
        "picture":        googleUser.Picture,
        "given_name":     googleUser.GivenName,
        "family_name":    googleUser.FamilyName,
        "locale":         googleUser.Locale,
        "verified_email": googleUser.VerifiedEmail,
    }
    providerDataJSON, _ := json.Marshal(providerData)
    
    var socialAccount models.SocialAccount
    result := h.db.Where("provider = ? AND provider_id = ?", "google", googleUser.ID).First(&socialAccount)
    
    if result.Error != nil {
        // Social account doesn't exist, create new
        socialAccount = models.SocialAccount{
            UserID:               userID,
            Provider:             "google",
            ProviderID:           googleUser.ID,
            ProviderToken:        token.AccessToken,
            ProviderRefreshToken: token.RefreshToken,
            ProviderData:         providerDataJSON,
        }
        
        return h.db.Create(&socialAccount).Error
    } else {
        // Update existing
        updates := map[string]interface{}{
            "provider_token":         token.AccessToken,
            "provider_refresh_token": token.RefreshToken,
            "provider_data":          providerDataJSON,
        }
        
        return h.db.Model(&socialAccount).Updates(updates).Error
    }
}
```

---

### 3. Google One Tap Login

**Endpoint:** `POST /auth/google/one-tap`

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Golang Implementation:**

```go
package handlers

import (
    "context"
    
    "github.com/gin-gonic/gin"
    "google.golang.org/api/idtoken"
)

type OneTapRequest struct {
    Credential string `json:"credential" binding:"required"`
}

func (h *AuthHandler) GoogleOneTap(c *gin.Context) {
    var req OneTapRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{
            "success": false,
            "message": "Validation failed",
            "errors":  err.Error(),
        })
        return
    }
    
    // Verify Google JWT token
    payload, err := idtoken.Validate(context.Background(), req.Credential, os.Getenv("GOOGLE_CLIENT_ID"))
    if err != nil {
        c.JSON(401, gin.H{
            "success": false,
            "message": "Google authentication failed",
            "error":   "Invalid credential or token expired",
        })
        return
    }
    
    // Extract user info from payload
    googleUser := &GoogleUserInfo{
        ID:            payload.Subject,
        Email:         payload.Claims["email"].(string),
        VerifiedEmail: payload.Claims["email_verified"].(bool),
        Name:          payload.Claims["name"].(string),
        Picture:       payload.Claims["picture"].(string),
    }
    
    if givenName, ok := payload.Claims["given_name"].(string); ok {
        googleUser.GivenName = givenName
    }
    if familyName, ok := payload.Claims["family_name"].(string); ok {
        googleUser.FamilyName = familyName
    }
    if locale, ok := payload.Claims["locale"].(string); ok {
        googleUser.Locale = locale
    }
    
    // Create or update user
    user, isNewUser, err := h.createOrUpdateUser(googleUser)
    if err != nil {
        c.JSON(422, gin.H{
            "success": false,
            "message": "Failed to create/update user",
            "error":   err.Error(),
        })
        return
    }
    
    // Create or update social account (with credential as token)
    fakeToken := &oauth2.Token{AccessToken: req.Credential}
    if err := h.createOrUpdateSocialAccount(user.ID, googleUser, fakeToken); err != nil {
        c.JSON(422, gin.H{
            "success": false,
            "message": "Failed to link social account",
            "error":   err.Error(),
        })
        return
    }
    
    // Generate JWT
    jwtToken, err := generateJWT(user)
    if err != nil {
        c.JSON(500, gin.H{
            "success": false,
            "message": "Failed to generate token",
            "error":   err.Error(),
        })
        return
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "message": "Login dengan Google berhasil",
        "data": gin.H{
            "user":        user,
            "token":       jwtToken,
            "expires_in":  86400,
            "is_new_user": isNewUser,
        },
    })
}
```

---

### 4. Get Connected Social Accounts

**Endpoint:** `GET /auth/social`

**Golang Implementation:**

```go
func (h *AuthHandler) GetSocialAccounts(c *gin.Context) {
    // Get user from JWT middleware
    user, exists := c.Get("user")
    if !exists {
        c.JSON(401, gin.H{"success": false, "message": "Unauthorized"})
        return
    }
    currentUser := user.(*models.User)
    
    // Get social accounts
    var socialAccounts []models.SocialAccount
    h.db.Where("user_id = ?", currentUser.ID).Find(&socialAccounts)
    
    // Format response
    connected := make([]map[string]interface{}, 0)
    for _, sa := range socialAccounts {
        var providerData map[string]interface{}
        json.Unmarshal(sa.ProviderData, &providerData)
        
        connected = append(connected, map[string]interface{}{
            "id":               sa.ID,
            "provider":         sa.Provider,
            "provider_email":   providerData["email"],
            "provider_name":    providerData["name"],
            "provider_picture": providerData["picture"],
            "connected_at":     sa.CreatedAt,
        })
    }
    
    // Available providers
    available := []string{}
    connectedProviders := make(map[string]bool)
    for _, sa := range socialAccounts {
        connectedProviders[sa.Provider] = true
    }
    
    allProviders := []string{"google", "facebook", "apple"}
    for _, provider := range allProviders {
        if !connectedProviders[provider] {
            available = append(available, provider)
        }
    }
    
    // Check if user has password
    hasPassword := currentUser.Password != ""
    
    c.JSON(200, gin.H{
        "success": true,
        "data": gin.H{
            "connected":    connected,
            "available":    available,
            "has_password": hasPassword,
        },
    })
}
```

---

### 5. Unlink Social Account

**Endpoint:** `DELETE /auth/social/{provider}`

**Golang Implementation:**

```go
func (h *AuthHandler) UnlinkSocialAccount(c *gin.Context) {
    provider := c.Param("provider")
    
    // Get user from JWT
    user, _ := c.Get("user")
    currentUser := user.(*models.User)
    
    // Check if user has password
    if currentUser.Password == "" {
        c.JSON(400, gin.H{
            "success": false,
            "message": "Tidak dapat melepas akun Google",
            "error":   "Anda harus mengatur password terlebih dahulu. Ini adalah satu-satunya metode login Anda.",
        })
        return
    }
    
    // Delete social account
    result := h.db.Where("user_id = ? AND provider = ?", currentUser.ID, provider).
        Delete(&models.SocialAccount{})
    
    if result.RowsAffected == 0 {
        c.JSON(404, gin.H{
            "success": false,
            "message": fmt.Sprintf("Akun %s tidak terhubung", provider),
        })
        return
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "message": fmt.Sprintf("Akun %s berhasil dilepaskan", provider),
    })
}
```

---

### 6. Set Password for OAuth Users

**Endpoint:** `POST /auth/set-password`

**Request Body:**
```json
{
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Golang Implementation:**

```go
type SetPasswordRequest struct {
    Password             string `json:"password" binding:"required,min=6"`
    PasswordConfirmation string `json:"password_confirmation" binding:"required,eqfield=Password"`
}

func (h *AuthHandler) SetPassword(c *gin.Context) {
    var req SetPasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{
            "success": false,
            "message": "Validation failed",
            "errors":  err.Error(),
        })
        return
    }
    
    // Get user from JWT
    user, _ := c.Get("user")
    currentUser := user.(*models.User)
    
    // Check if user already has password
    if currentUser.Password != "" {
        c.JSON(400, gin.H{
            "success": false,
            "message": "Password sudah diatur",
            "error":   "Gunakan endpoint /auth/change-password untuk mengubah password",
        })
        return
    }
    
    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
    if err != nil {
        c.JSON(500, gin.H{
            "success": false,
            "message": "Failed to hash password",
        })
        return
    }
    
    // Update user password
    if err := h.db.Model(&currentUser).Update("password", string(hashedPassword)).Error; err != nil {
        c.JSON(422, gin.H{
            "success": false,
            "message": "Failed to update password",
        })
        return
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "message": "Password berhasil diatur. Sekarang Anda bisa login dengan email & password.",
    })
}
```

---

## 🔐 JWT Helper Functions

```go
package utils

import (
    "os"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
    "your-project/models"
)

type Claims struct {
    UserID uint   `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

func GenerateJWT(user *models.User) (string, error) {
    expirationTime := time.Now().Add(24 * time.Hour)
    
    claims := &Claims{
        UserID: user.ID,
        Email:  user.Email,
        Role:   user.Role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "kartcis-api",
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
    
    return tokenString, err
}

func ValidateJWT(tokenString string) (*Claims, error) {
    claims := &Claims{}
    
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if !token.Valid {
        return nil, jwt.ErrSignatureInvalid
    }
    
    return claims, nil
}
```

---

## 🔧 Middleware - JWT Authentication

```go
package middlewares

import (
    "strings"
    
    "github.com/gin-gonic/gin"
    "your-project/models"
    "your-project/utils"
    "gorm.io/gorm"
)

func AuthMiddleware(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get token from header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{
                "success": false,
                "message": "Unauthorized",
                "error":   "No authorization header",
            })
            c.Abort()
            return
        }
        
        // Extract token
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{
                "success": false,
                "message": "Unauthorized",
                "error":   "Invalid authorization header format",
            })
            c.Abort()
            return
        }
        
        tokenString := parts[1]
        
        // Validate token
        claims, err := utils.ValidateJWT(tokenString)
        if err != nil {
            c.JSON(401, gin.H{
                "success": false,
                "message": "Unauthorized",
                "error":   "Invalid or expired token",
            })
            c.Abort()
            return
        }
        
        // Get user from database
        var user models.User
        if err := db.First(&user, claims.UserID).Error; err != nil {
            c.JSON(401, gin.H{
                "success": false,
                "message": "Unauthorized",
                "error":   "User not found",
            })
            c.Abort()
            return
        }
        
        // Check if user is active
        if !user.IsActive {
            c.JSON(403, gin.H{
                "success": false,
                "message": "Forbidden",
                "error":   "User account is deactivated",
            })
            c.Abort()
            return
        }
        
        // Set user in context
        c.Set("user", &user)
        c.Next()
    }
}
```

---

## 🔧 Middleware - Admin Only

```go
func AdminMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        user, exists := c.Get("user")
        if !exists {
            c.JSON(401, gin.H{
                "success": false,
                "message": "Unauthorized",
            })
            c.Abort()
            return
        }
        
        currentUser := user.(*models.User)
        if currentUser.Role != "admin" {
            c.JSON(403, gin.H{
                "success": false,
                "message": "Forbidden",
                "error":   "Admin access required",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

---

## 📦 Go Packages Required

```go
// go.mod
module kartcis-api

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
    golang.org/x/crypto v0.18.0
    golang.org/x/oauth2 v0.16.0
    google.golang.org/api v0.157.0
    gorm.io/gorm v1.25.5
    gorm.io/driver/mysql v1.5.2
    github.com/joho/godotenv v1.5.1
)
```

---

## 🚀 Main Application Setup

```go
package main

import (
    "log"
    "os"
    
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    
    "your-project/handlers"
    "your-project/middlewares"
    "your-project/models"
)

func main() {
    // Load .env
    godotenv.Load()
    
    // Connect to database
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_NAME"),
    )
    
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    
    // Auto migrate
    db.AutoMigrate(&models.User{}, &models.SocialAccount{})
    
    // Setup Gin
    r := gin.Default()
    
    // Handlers
    authHandler := handlers.NewAuthHandler(db)
    
    // Public routes
    auth := r.Group("/api/v1/auth")
    {
        auth.POST("/register", authHandler.Register)
        auth.POST("/login", authHandler.Login)
        auth.GET("/google", authHandler.GoogleLogin)
        auth.GET("/google/callback", authHandler.GoogleCallback)
        auth.POST("/google/one-tap", authHandler.GoogleOneTap)
    }
    
    // Protected routes
    protected := r.Group("/api/v1/auth")
    protected.Use(middlewares.AuthMiddleware(db))
    {
        protected.GET("/me", authHandler.GetCurrentUser)
        protected.POST("/logout", authHandler.Logout)
        protected.GET("/social", authHandler.GetSocialAccounts)
        protected.DELETE("/social/:provider", authHandler.UnlinkSocialAccount)
        protected.POST("/set-password", authHandler.SetPassword)
    }
    
    // Run server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    r.Run(":" + port)
}
```

---

## 🗂️ Models

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID              uint           `gorm:"primaryKey" json:"id"`
    Name            string         `gorm:"size:255;not null" json:"name"`
    Email           string         `gorm:"size:255;unique;not null" json:"email"`
    Password        string         `gorm:"size:255" json:"-"`
    Phone           string         `gorm:"size:20" json:"phone"`
    Role            string         `gorm:"size:20;default:user" json:"role"`
    Avatar          string         `gorm:"size:500" json:"avatar"`
    IsActive        bool           `gorm:"default:true" json:"is_active"`
    EmailVerifiedAt *time.Time     `json:"email_verified_at"`
    LastLoginAt     *time.Time     `json:"last_login_at"`
    CreatedAt       time.Time      `json:"created_at"`
    UpdatedAt       time.Time      `json:"updated_at"`
    DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type SocialAccount struct {
    ID                   uint      `gorm:"primaryKey" json:"id"`
    UserID               uint      `gorm:"not null" json:"user_id"`
    Provider             string    `gorm:"size:50;not null" json:"provider"`
    ProviderID           string    `gorm:"size:255;not null" json:"provider_id"`
    ProviderToken        string    `gorm:"type:text" json:"-"`
    ProviderRefreshToken string    `gorm:"type:text" json:"-"`
    ProviderData         []byte    `gorm:"type:json" json:"provider_data"`
    CreatedAt            time.Time `json:"created_at"`
    UpdatedAt            time.Time `json:"updated_at"`
    
    User User `gorm:"foreignKey:UserID" json:"-"`
}
```

---

## 🔧 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kartcis_db
DB_USER=root
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
PORT=8080
```

---

## 📋 Summary

### ✅ Implemented Features:

- **Google OAuth 2.0** (redirect flow)
- **Google One Tap** login
- **Auto user creation** from Google
- **Social account management**
- **Password setting** for OAuth users
- **JWT authentication**
- **Middleware** (auth & admin)
- **Complete Golang implementation**

### 📊 Database Tables:

- `users` (with OAuth support)
- `social_accounts`

### 🔑 API Endpoints:

1. `GET /auth/google`
2. `GET /auth/google/callback`
3. `POST /auth/google/one-tap`
4. `GET /auth/social`
5. `DELETE /auth/social/{provider}`
6. `POST /auth/set-password`

---

**Version:** 1.0  
**Backend:** Golang 1.21+  
**Framework:** Gin  
**ORM:** GORM
