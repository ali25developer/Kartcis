package models

import (
	"time"
)

type User struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `json:"name"`
	Email           string    `gorm:"uniqueIndex" json:"email"`
	Password        string    `json:"-"` // Can be empty for OAuth users
	Phone           string    `json:"phone"`
	Role            string    `json:"role" gorm:"default:user"`
	Avatar          string    `json:"avatar"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	SocialAccounts  []SocialAccount `json:"social_accounts" gorm:"foreignKey:UserID"`
}

type SocialAccount struct {
    ID                 uint      `gorm:"primaryKey" json:"id"`
    UserID             uint      `json:"user_id"`
    Provider           string    `json:"provider"`
    ProviderID         string    `json:"provider_id"`
    ProviderToken      string    `json:"-"`
    ProviderRefreshToken string  `json:"-"`
    // ProviderData    postgres.Jsonb `json:"provider_data" gorm:"type:jsonb"` // Complex in Gorm without proper strict, skipping struct binding for simplified demo or using string
    CreatedAt          time.Time `json:"created_at"`
    UpdatedAt          time.Time `json:"updated_at"`
}

type Category struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Slug        string    `gorm:"uniqueIndex" json:"slug"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Event struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	Title               string    `json:"title"`
	Slug                string    `gorm:"uniqueIndex" json:"slug"`
	Description         string    `json:"description"`
	DetailedDescription string    `json:"detailed_description"`
	EventDate           time.Time `json:"event_date" gorm:"type:date"`
	EventTime           string    `json:"event_time" gorm:"type:time"`
	Venue               string    `json:"venue"`
	City                string    `json:"city"`
	Organizer           string    `json:"organizer"`
	Image               string    `json:"image"`
	Quota               int       `json:"quota"`
	IsFeatured          bool      `json:"is_featured"`
	Status              string    `json:"status"`
	CategoryID          uint      `json:"category_id"`
	Category            Category  `json:"category" gorm:"foreignKey:CategoryID"`
	MinPrice            float64   `json:"min_price"`
	MaxPrice            float64   `json:"max_price"`
	TicketTypes         []TicketType `json:"ticket_types" gorm:"foreignKey:EventID"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type TicketType struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	EventID       uint      `json:"event_id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	Price         float64   `json:"price"`
	OriginalPrice float64   `json:"originalPrice"`
	Quota         int       `json:"quota"`
	Available     int       `json:"available"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Order struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        *uint     `json:"user_id"`
	OrderNumber   string    `json:"order_number"`
	CustomerName  string    `json:"customer_name"`
	CustomerEmail string    `json:"customer_email"`
	CustomerPhone string    `json:"customer_phone"`
	TotalAmount   float64   `json:"total_amount"`
	Status        string    `json:"status"`
	PaymentMethod string    `json:"payment_method"`
	PaidAt        *time.Time `json:"paid_at"`
	ExpiresAt     *time.Time `json:"expires_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Tickets       []Ticket  `json:"tickets" gorm:"foreignKey:OrderID"`
}

type Ticket struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	OrderID      *uint     `json:"order_id"`
	EventID      uint      `json:"event_id"`
	TicketTypeID uint      `json:"ticket_type_id"`
	TicketCode   string    `json:"ticket_code"`
	AttendeeName string    `json:"attendee_name"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
