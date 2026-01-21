# KARTCIS.ID - Complete API Specification for Golang Backend

## 📋 Overview

Base URL Production: `https://api.kartcis.id/api/v1`  
Base URL Development: `http://localhost:8080/api/v1`  
Version: `v1.0`  
Authentication: `JWT Bearer Token`  
Backend: `Golang (Go 1.21+)`  
Database: `MySQL 8.0+`

---

## 🗄️ Complete Database Schema

### 1. Table: `users`

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
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Roles:**
- `user`: Regular user (beli tiket)
- `admin`: Full access (manage events, transactions, users)
- `organizer`: Create & manage own events only

---

### 2. Table: `social_accounts`

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
  INDEX idx_user (user_id),
  INDEX idx_provider (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. Table: `categories`

```sql
CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_slug (slug),
  INDEX idx_active (is_active),
  INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Default Categories:**
```sql
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Marathon & Lari', 'marathon-lari', 'Event lari marathon, half marathon, fun run', 'Footprints', 1),
('Musik & Konser', 'musik-konser', 'Konser musik, festival musik', 'Music', 2),
('Workshop & Seminar', 'workshop-seminar', 'Workshop, seminar, pelatihan', 'GraduationCap', 3),
('Olahraga', 'olahraga', 'Event olahraga umum', 'Dumbbell', 4),
('Kuliner', 'kuliner', 'Festival kuliner, food expo', 'UtensilsCrossed', 5),
('Charity & Sosial', 'charity-sosial', 'Event charity, sosial', 'Heart', 6);
```

---

### 4. Table: `events`

```sql
CREATE TABLE events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  organizer_id BIGINT, -- user_id dari organizer
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT,
  facilities JSON,
  terms JSON,
  agenda JSON,
  organizer_info JSON,
  faqs JSON,
  event_date DATE NOT NULL,
  event_time TIME,
  venue VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100),
  organizer VARCHAR(255) NOT NULL,
  quota INT NOT NULL DEFAULT 0,
  image VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  status ENUM('draft', 'published', 'completed', 'cancelled', 'sold-out') DEFAULT 'draft',
  cancel_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_featured (is_featured),
  INDEX idx_event_date (event_date),
  INDEX idx_city (city),
  INDEX idx_organizer (organizer_id),
  FULLTEXT idx_search (title, description, venue, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. Table: `ticket_types`

```sql
CREATE TABLE ticket_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  quota INT NOT NULL,
  available INT NOT NULL,
  status ENUM('available', 'sold_out', 'unavailable') DEFAULT 'available',
  sale_start_date TIMESTAMP,
  sale_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 6. Table: `orders`

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'paid', 'cancelled', 'expired') DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL,
  payment_details JSON,
  expires_at TIMESTAMP NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. Table: `order_items`

```sql
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 8. Table: `tickets`

```sql
CREATE TABLE tickets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  qr_code TEXT,
  attendee_name VARCHAR(255) NOT NULL,
  attendee_email VARCHAR(255) NOT NULL,
  attendee_phone VARCHAR(20) NOT NULL,
  status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
  check_in_at TIMESTAMP NULL,
  checked_in_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order (order_id),
  INDEX idx_event (event_id),
  INDEX idx_ticket_code (ticket_code),
  INDEX idx_status (status),
  INDEX idx_attendee_email (attendee_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 9. Table: `event_analytics` (NEW)

```sql
CREATE TABLE event_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id BIGINT NOT NULL,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  tickets_sold INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_date (event_id, date),
  INDEX idx_event (event_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10. Table: `activity_logs` (NEW)

```sql
CREATE TABLE activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔐 Authentication APIs

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

**Golang Implementation:**
```go
type RegisterRequest struct {
    Name                 string `json:"name" validate:"required,min=3,max=255"`
    Email                string `json:"email" validate:"required,email"`
    Phone                string `json:"phone" validate:"required,min=10,max=20"`
    Password             string `json:"password" validate:"required,min=6"`
    PasswordConfirmation string `json:"password_confirmation" validate:"required,eqfield=Password"`
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "message": "Validation failed", "errors": err.Error()})
        return
    }
    
    // Hash password
    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
    
    // Create user
    user := &models.User{
        Name:     req.Name,
        Email:    req.Email,
        Phone:    req.Phone,
        Password: string(hashedPassword),
        Role:     "user",
    }
    
    if err := h.db.Create(user).Error; err != nil {
        c.JSON(422, gin.H{"success": false, "message": "Email already registered"})
        return
    }
    
    // Generate JWT
    token := generateJWT(user)
    
    c.JSON(201, gin.H{
        "success": true,
        "message": "Registration successful",
        "data": gin.H{
            "user":       user,
            "token":      token,
            "expires_in": 86400,
        },
    })
}
```

**Response Success (201):** Same as before

---

### Login

**Endpoint:** `POST /auth/login`

**Golang Implementation:**
```go
type LoginRequest struct {
    Email      string `json:"email" validate:"required,email"`
    Password   string `json:"password" validate:"required"`
    RememberMe bool   `json:"remember_me"`
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "message": "Validation failed"})
        return
    }
    
    // Find user
    var user models.User
    if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
        c.JSON(401, gin.H{"success": false, "message": "Email or password incorrect"})
        return
    }
    
    // Verify password
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
        c.JSON(401, gin.H{"success": false, "message": "Email or password incorrect"})
        return
    }
    
    // Update last login
    h.db.Model(&user).Update("last_login_at", time.Now())
    
    // Generate JWT
    expiresIn := 7200 // 2 hours
    if req.RememberMe {
        expiresIn = 86400 // 24 hours
    }
    token := generateJWTWithExpiry(user, expiresIn)
    
    c.JSON(200, gin.H{
        "success": true,
        "message": "Login successful",
        "data": gin.H{
            "user":       user,
            "token":      token,
            "expires_in": expiresIn,
        },
    })
}
```

---

## 🎫 Event APIs (Public)

### Get All Events

**Endpoint:** `GET /events`

**Query Parameters:**
- `page`: int, default 1
- `limit`: int, default 12
- `category`: string (slug)
- `city`: string
- `province`: string
- `search`: string (fulltext search)
- `featured`: bool
- `status`: string (published/completed/sold-out)
- `sort`: string (date_asc/date_desc/popular/newest)
- `min_price`: float
- `max_price`: float
- `date_from`: date (YYYY-MM-DD)
- `date_to`: date (YYYY-MM-DD)

**Golang Implementation:**
```go
type EventListRequest struct {
    Page     int    `form:"page" binding:"omitempty,min=1"`
    Limit    int    `form:"limit" binding:"omitempty,min=1,max=100"`
    Category string `form:"category"`
    City     string `form:"city"`
    Search   string `form:"search"`
    Featured bool   `form:"featured"`
    Status   string `form:"status"`
    Sort     string `form:"sort"`
}

func (h *EventHandler) GetEvents(c *gin.Context) {
    var req EventListRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "message": "Invalid parameters"})
        return
    }
    
    // Set defaults
    if req.Page == 0 {
        req.Page = 1
    }
    if req.Limit == 0 {
        req.Limit = 12
    }
    
    // Build query
    query := h.db.Model(&models.Event{}).
        Preload("Category").
        Preload("TicketTypes", "status = ?", "available")
    
    // Filters
    if req.Category != "" {
        query = query.Joins("JOIN categories ON categories.id = events.category_id").
            Where("categories.slug = ?", req.Category)
    }
    
    if req.City != "" {
        query = query.Where("city = ?", req.City)
    }
    
    if req.Search != "" {
        query = query.Where("MATCH(title, description, venue, city) AGAINST(? IN NATURAL LANGUAGE MODE)", req.Search)
    }
    
    if req.Featured {
        query = query.Where("is_featured = ?", true)
    }
    
    if req.Status != "" {
        query = query.Where("status = ?", req.Status)
    } else {
        query = query.Where("status = ?", "published")
    }
    
    // Sorting
    switch req.Sort {
    case "date_asc":
        query = query.Order("event_date ASC")
    case "date_desc":
        query = query.Order("event_date DESC")
    case "popular":
        query = query.Order("view_count DESC")
    case "newest":
        query = query.Order("created_at DESC")
    default:
        query = query.Order("event_date ASC")
    }
    
    // Count total
    var total int64
    query.Count(&total)
    
    // Pagination
    offset := (req.Page - 1) * req.Limit
    var events []models.Event
    query.Offset(offset).Limit(req.Limit).Find(&events)
    
    // Calculate min/max prices
    for i := range events {
        events[i].CalculatePriceRange()
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "data": gin.H{
            "events": events,
            "pagination": gin.H{
                "current_page": req.Page,
                "total_pages":  int(math.Ceil(float64(total) / float64(req.Limit))),
                "total_items":  total,
                "per_page":     req.Limit,
                "has_next":     req.Page*req.Limit < int(total),
                "has_prev":     req.Page > 1,
            },
        },
    })
}
```

---

### Get Popular Events (NEW)

**Endpoint:** `GET /events/popular`

**Query Parameters:**
- `limit`: int, default 6

**Golang Implementation:**
```go
func (h *EventHandler) GetPopularEvents(c *gin.Context) {
    limit := 6
    if l, ok := c.GetQuery("limit"); ok {
        if parsed, err := strconv.Atoi(l); err == nil {
            limit = parsed
        }
    }
    
    var events []models.Event
    h.db.Model(&models.Event{}).
        Where("status = ?", "published").
        Where("event_date >= ?", time.Now()).
        Order("view_count DESC").
        Limit(limit).
        Preload("Category").
        Preload("TicketTypes").
        Find(&events)
    
    c.JSON(200, gin.H{
        "success": true,
        "data":    events,
    })
}
```

---

### Get Event Detail

**Endpoint:** `GET /events/{slug}`

**Golang Implementation:**
```go
func (h *EventHandler) GetEventDetail(c *gin.Context) {
    slug := c.Param("slug")
    
    var event models.Event
    if err := h.db.Where("slug = ?", slug).
        Preload("Category").
        Preload("TicketTypes").
        First(&event).Error; err != nil {
        c.JSON(404, gin.H{"success": false, "message": "Event not found"})
        return
    }
    
    // Increment view count (async)
    go func() {
        h.db.Model(&event).Update("view_count", gorm.Expr("view_count + ?", 1))
        
        // Update analytics
        today := time.Now().Format("2006-01-02")
        h.db.Exec(`
            INSERT INTO event_analytics (event_id, date, views, created_at, updated_at)
            VALUES (?, ?, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE views = views + 1, updated_at = NOW()
        `, event.ID, today)
    }()
    
    c.JSON(200, gin.H{
        "success": true,
        "data":    event,
    })
}
```

---

### Get Cities with Events (NEW)

**Endpoint:** `GET /cities`

**Response:**
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
    }
  ]
}
```

**Golang Implementation:**
```go
func (h *EventHandler) GetCities(c *gin.Context) {
    type CityResult struct {
        City       string `json:"city"`
        Province   string `json:"province"`
        EventCount int    `json:"event_count"`
    }
    
    var cities []CityResult
    h.db.Model(&models.Event{}).
        Select("city, province, COUNT(*) as event_count").
        Where("status = ?", "published").
        Where("event_date >= ?", time.Now()).
        Group("city, province").
        Order("event_count DESC").
        Find(&cities)
    
    c.JSON(200, gin.H{
        "success": true,
        "data":    cities,
    })
}
```

---

## 📂 Category APIs

### Get All Categories

**Endpoint:** `GET /categories`

**Golang Implementation:**
```go
func (h *CategoryHandler) GetCategories(c *gin.Context) {
    var categories []models.Category
    h.db.Where("is_active = ?", true).
        Order("display_order ASC").
        Find(&categories)
    
    // Count events per category
    for i := range categories {
        var count int64
        h.db.Model(&models.Event{}).
            Where("category_id = ?", categories[i].ID).
            Where("status = ?", "published").
            Count(&count)
        categories[i].EventCount = int(count)
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "data":    categories,
    })
}
```

---

## 👨‍💼 Admin APIs - Event Management

### Create Event

**Endpoint:** `POST /admin/events`

**Headers:** `Authorization: Bearer {admin_token}`

**Request Body:**
```json
{
  "category_id": 1,
  "title": "Jakarta Marathon 2026",
  "description": "Marathon internasional...",
  "detailed_description": "<p>Full HTML description</p>",
  "facilities": ["Medali finisher", "Sertifikat digital"],
  "terms": ["Peserta min 17 tahun", "Tiket tidak dapat dikembalikan"],
  "agenda": [
    {"time": "04:00", "activity": "Registration"},
    {"time": "06:00", "activity": "Race Start"}
  ],
  "organizer_info": {
    "name": "Jakarta Sports Association",
    "phone": "021-12345678",
    "email": "info@example.com"
  },
  "faqs": [
    {"question": "Kapan pengambilan race pack?", "answer": "2 hari sebelum event"}
  ],
  "event_date": "2026-03-15",
  "event_time": "06:00",
  "venue": "Bundaran HI - Monas",
  "address": "Jl. MH Thamrin, Jakarta Pusat",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "organizer": "Jakarta Sports Association",
  "quota": 10000,
  "image": "https://storage.kartcis.id/events/jakarta-marathon.jpg",
  "is_featured": true,
  "status": "draft"
}
```

**Golang Implementation:**
```go
type CreateEventRequest struct {
    CategoryID           int64               `json:"category_id" validate:"required"`
    Title                string              `json:"title" validate:"required,min=10,max=255"`
    Description          string              `json:"description" validate:"required"`
    DetailedDescription  string              `json:"detailed_description"`
    Facilities           []string            `json:"facilities"`
    Terms                []string            `json:"terms"`
    Agenda               []map[string]string `json:"agenda"`
    OrganizerInfo        map[string]string   `json:"organizer_info"`
    FAQs                 []map[string]string `json:"faqs"`
    EventDate            string              `json:"event_date" validate:"required"`
    EventTime            string              `json:"event_time"`
    Venue                string              `json:"venue" validate:"required"`
    Address              string              `json:"address"`
    City                 string              `json:"city" validate:"required"`
    Province             string              `json:"province"`
    Organizer            string              `json:"organizer" validate:"required"`
    Quota                int                 `json:"quota" validate:"required,min=1"`
    Image                string              `json:"image"`
    IsFeatured           bool                `json:"is_featured"`
    Status               string              `json:"status" validate:"oneof=draft published"`
}

func (h *AdminEventHandler) CreateEvent(c *gin.Context) {
    // Get admin user from context
    user, _ := c.Get("user")
    adminUser := user.(*models.User)
    
    var req CreateEventRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "message": "Validation failed", "errors": err.Error()})
        return
    }
    
    // Generate slug
    slug := utils.Slugify(req.Title)
    
    // Convert JSON fields
    facilitiesJSON, _ := json.Marshal(req.Facilities)
    termsJSON, _ := json.Marshal(req.Terms)
    agendaJSON, _ := json.Marshal(req.Agenda)
    organizerInfoJSON, _ := json.Marshal(req.OrganizerInfo)
    faqsJSON, _ := json.Marshal(req.FAQs)
    
    // Create event
    event := &models.Event{
        CategoryID:          req.CategoryID,
        OrganizerID:         &adminUser.ID,
        Title:               req.Title,
        Slug:                slug,
        Description:         req.Description,
        DetailedDescription: req.DetailedDescription,
        Facilities:          facilitiesJSON,
        Terms:               termsJSON,
        Agenda:              agendaJSON,
        OrganizerInfo:       organizerInfoJSON,
        FAQs:                faqsJSON,
        EventDate:           req.EventDate,
        EventTime:           req.EventTime,
        Venue:               req.Venue,
        Address:             req.Address,
        City:                req.City,
        Province:            req.Province,
        Organizer:           req.Organizer,
        Quota:               req.Quota,
        Image:               req.Image,
        IsFeatured:          req.IsFeatured,
        Status:              req.Status,
    }
    
    if err := h.db.Create(event).Error; err != nil {
        c.JSON(422, gin.H{"success": false, "message": "Failed to create event", "error": err.Error()})
        return
    }
    
    // Log activity
    h.LogActivity(adminUser.ID, "create_event", "event", event.ID, fmt.Sprintf("Created event: %s", event.Title))
    
    c.JSON(201, gin.H{
        "success": true,
        "message": "Event created successfully",
        "data":    event,
    })
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 1,
    "title": "Jakarta Marathon 2026",
    "slug": "jakarta-marathon-2026",
    ...
  }
}
```

---

### Update Event

**Endpoint:** `PUT /admin/events/{id}`

**Headers:** `Authorization: Bearer {admin_token}`

**Request Body:** Same as Create Event

**Golang Implementation:**
```go
func (h *AdminEventHandler) UpdateEvent(c *gin.Context) {
    eventID := c.Param("id")
    
    var event models.Event
    if err := h.db.First(&event, eventID).Error; err != nil {
        c.JSON(404, gin.H{"success": false, "message": "Event not found"})
        return
    }
    
    var req CreateEventRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "message": "Validation failed"})
        return
    }
    
    // Update fields...
    event.Title = req.Title
    event.Description = req.Description
    // ... other fields
    
    if err := h.db.Save(&event).Error; err != nil {
        c.JSON(422, gin.H{"success": false, "message": "Failed to update event"})
        return
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "message": "Event updated successfully",
        "data":    event,
    })
}
```

---

### Delete Event

**Endpoint:** `DELETE /admin/events/{id}`

**Headers:** `Authorization: Bearer {admin_token}`

**Golang Implementation:**
```go
func (h *AdminEventHandler) DeleteEvent(c *gin.Context) {
    eventID := c.Param("id")
    
    // Check if event has orders
    var orderCount int64
    h.db.Model(&models.OrderItem{}).Where("event_id = ?", eventID).Count(&orderCount)
    
    if orderCount > 0 {
        c.JSON(400, gin.H{
            "success": false,
            "message": "Cannot delete event with existing orders. Cancel the event instead.",
        })
        return
    }
    
    if err := h.db.Delete(&models.Event{}, eventID).Error; err != nil {
        c.JSON(422, gin.H{"success": false, "message": "Failed to delete event"})
        return
    }
    
    c.JSON(200, gin.H{
        "success": true,
        "message": "Event deleted successfully",
    })
}
```

---

### Change Event Status

**Endpoint:** `PATCH /admin/events/{id}/status`

**Request Body:**
```json
{
  "status": "published",
  "cancel_reason": null
}
```

**Statuses:** `draft`, `published`, `completed`, `cancelled`, `sold-out`

---

### Get Admin Event List

**Endpoint:** `GET /admin/events`

**Query Parameters:**
- `page`, `limit`, `search`, `status`, `category`, `sort`

**Golang Implementation:**
```go
func (h *AdminEventHandler) GetAdminEvents(c *gin.Context) {
    // Similar to public GetEvents but includes ALL statuses
    // ... implementation
}
```

---

## 🎟️ Admin APIs - Ticket Type Management

### Create Ticket Type

**Endpoint:** `POST /admin/events/{event_id}/ticket-types`

**Request Body:**
```json
{
  "name": "Early Bird - Full Marathon",
  "description": "Harga spesial untuk pendaftar awal",
  "price": 350000.00,
  "original_price": 500000.00,
  "quota": 500,
  "sale_start_date": "2026-01-01T00:00:00Z",
  "sale_end_date": "2026-02-01T23:59:59Z"
}
```

**Golang Implementation:**
```go
func (h *AdminTicketHandler) CreateTicketType(c *gin.Context) {
    eventID := c.Param("event_id")
    
    type CreateTicketTypeRequest struct {
        Name          string  `json:"name" validate:"required"`
        Description   string  `json:"description"`
        Price         float64 `json:"price" validate:"required,min=0"`
        OriginalPrice float64 `json:"original_price"`
        Quota         int     `json:"quota" validate:"required,min=1"`
        SaleStartDate string  `json:"sale_start_date"`
        SaleEndDate   string  `json:"sale_end_date"`
    }
    
    var req CreateTicketTypeRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "message": "Validation failed"})
        return
    }
    
    ticketType := &models.TicketType{
        EventID:       eventID,
        Name:          req.Name,
        Description:   req.Description,
        Price:         req.Price,
        OriginalPrice: req.OriginalPrice,
        Quota:         req.Quota,
        Available:     req.Quota,
        Status:        "available",
        SaleStartDate: req.SaleStartDate,
        SaleEndDate:   req.SaleEndDate,
    }
    
    if err := h.db.Create(ticketType).Error; err != nil {
        c.JSON(422, gin.H{"success": false, "message": "Failed to create ticket type"})
        return
    }
    
    c.JSON(201, gin.H{
        "success": true,
        "message": "Ticket type created successfully",
        "data":    ticketType,
    })
}
```

---

### Update Ticket Type

**Endpoint:** `PUT /admin/ticket-types/{id}`

---

### Delete Ticket Type

**Endpoint:** `DELETE /admin/ticket-types/{id}`

---

## 📊 Admin APIs - Analytics & Reports

### Get Event Analytics

**Endpoint:** `GET /admin/events/{id}/analytics`

**Query Parameters:**
- `date_from`: YYYY-MM-DD
- `date_to`: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "total_views": 5432,
    "total_tickets_sold": 245,
    "total_revenue": 85750000.00,
    "daily_stats": [
      {
        "date": "2026-01-21",
        "views": 234,
        "tickets_sold": 12,
        "revenue": 4200000.00
      }
    ],
    "ticket_type_breakdown": [
      {
        "name": "Early Bird",
        "sold": 150,
        "revenue": 52500000.00
      }
    ]
  }
}
```

---

### Get Dashboard Stats

**Endpoint:** `GET /admin/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_events": 45,
    "published_events": 32,
    "draft_events": 8,
    "completed_events": 5,
    "total_transactions": 234,
    "pending_transactions": 12,
    "completed_transactions": 210,
    "total_revenue": 125000000.00,
    "today_revenue": 5000000.00,
    "total_users": 1234,
    "new_users_this_month": 56,
    "total_tickets_sold": 890
  }
}
```

---

## 👥 Admin APIs - User Management

### Get All Users

**Endpoint:** `GET /admin/users`

**Query Parameters:**
- `page`, `limit`, `search`, `role`, `is_active`

**Golang Implementation:**
```go
func (h *AdminUserHandler) GetUsers(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    search := c.Query("search")
    role := c.Query("role")
    
    query := h.db.Model(&models.User{})
    
    if search != "" {
        query = query.Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
    }
    
    if role != "" {
        query = query.Where("role = ?", role)
    }
    
    var total int64
    query.Count(&total)
    
    offset := (page - 1) * limit
    var users []models.User
    query.Offset(offset).Limit(limit).Find(&users)
    
    c.JSON(200, gin.H{
        "success": true,
        "data": gin.H{
            "users": users,
            "pagination": gin.H{
                "current_page": page,
                "total_pages":  int(math.Ceil(float64(total) / float64(limit))),
                "total_items":  total,
                "per_page":     limit,
            },
        },
    })
}
```

---

### Update User Role

**Endpoint:** `PATCH /admin/users/{id}/role`

**Request Body:**
```json
{
  "role": "admin"
}
```

**Roles:** `user`, `admin`, `organizer`

---

### Ban/Deactivate User

**Endpoint:** `PATCH /admin/users/{id}/deactivate`

**Request Body:**
```json
{
  "reason": "Spam or fraud activity"
}
```

---

## 📈 Admin APIs - Category Management

### Create Category

**Endpoint:** `POST /admin/categories`

**Request Body:**
```json
{
  "name": "Workshop & Seminar",
  "slug": "workshop-seminar",
  "description": "Event workshop dan seminar",
  "icon": "GraduationCap",
  "image": "https://storage.kartcis.id/categories/workshop.jpg",
  "display_order": 3
}
```

---

### Update Category

**Endpoint:** `PUT /admin/categories/{id}`

---

### Delete Category

**Endpoint:** `DELETE /admin/categories/{id}`

---

## 🛠️ Golang Packages Required

```go
// go.mod
module kartcis-api

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
    golang.org/x/crypto v0.18.0
    gorm.io/gorm v1.25.5
    gorm.io/driver/mysql v1.5.2
    github.com/go-playground/validator/v10 v10.16.0
    github.com/joho/godotenv v1.5.1
    github.com/google/uuid v1.5.0
    github.com/skip2/go-qrcode v0.0.0-20200617195104-da1b6568686e
    golang.org/x/oauth2 v0.16.0
    google.golang.org/api v0.157.0
)
```

---

## 🔧 Environment Variables

```env
# Application
APP_ENV=production
APP_URL=https://kartcis.id
API_URL=https://api.kartcis.id
PORT=8080

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kartcis_db
DB_USER=kartcis_user
DB_PASSWORD=strong_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRY=24h

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
GOOGLE_REDIRECT_URI=https://api.kartcis.id/api/v1/auth/google/callback

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=SB-Mid-server-abc123
MIDTRANS_CLIENT_KEY=SB-Mid-client-abc123
MIDTRANS_IS_PRODUCTION=false

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@kartcis.id
SMTP_PASSWORD=smtp-password
MAIL_FROM=KARTCIS.ID <noreply@kartcis.id>

# Cloud Storage (S3/GCS)
STORAGE_PROVIDER=gcs
GCS_BUCKET=kartcis-storage
GCS_PROJECT_ID=kartcis-prod
GCS_CREDENTIALS_FILE=/path/to/credentials.json

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Frontend URL
FRONTEND_URL=https://kartcis.id
```

---

## 📋 Complete API Endpoints Summary

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/google/one-tap`
- `GET /auth/social`
- `DELETE /auth/social/{provider}`
- `POST /auth/set-password`

### Public - Events
- `GET /events`
- `GET /events/popular`
- `GET /events/upcoming`
- `GET /events/featured`
- `GET /events/{slug}`

### Public - Categories
- `GET /categories`

### Public - Utilities
- `GET /cities`

### Orders & Checkout
- `POST /orders`
- `GET /orders/{order_number}`
- `POST /orders/payment-callback`
- `POST /orders/{order_number}/simulate-payment`

### Tickets
- `GET /tickets/my-tickets`
- `GET /tickets/{ticket_code}`
- `GET /tickets/{ticket_code}/download`
- `POST /tickets/check-in`

### Admin - Dashboard
- `GET /admin/stats`
- `GET /admin/dashboard/revenue`
- `GET /admin/dashboard/overview`

### Admin - Events
- `GET /admin/events`
- `POST /admin/events`
- `GET /admin/events/{id}`
- `PUT /admin/events/{id}`
- `DELETE /admin/events/{id}`
- `PATCH /admin/events/{id}/status`
- `GET /admin/events/{id}/analytics`

### Admin - Ticket Types
- `POST /admin/events/{event_id}/ticket-types`
- `GET /admin/ticket-types/{id}`
- `PUT /admin/ticket-types/{id}`
- `DELETE /admin/ticket-types/{id}`

### Admin - Categories
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`

### Admin - Users
- `GET /admin/users`
- `GET /admin/users/{id}`
- `PUT /admin/users/{id}`
- `PATCH /admin/users/{id}/role`
- `PATCH /admin/users/{id}/deactivate`
- `DELETE /admin/users/{id}`

### Admin - Transactions
- `GET /admin/transactions`
- `GET /admin/transactions/{id}`
- `POST /admin/transactions/{id}/resend-email`
- `GET /admin/transactions/export`

### Admin - Reports
- `GET /admin/reports/revenue`
- `GET /admin/reports/sales`
- `GET /admin/reports/users`

---

**Version:** 1.0  
**Last Updated:** January 21, 2026  
**Backend:** Golang 1.21+  
**Framework:** Gin  
**ORM:** GORM  
**Database:** MySQL 8.0+
