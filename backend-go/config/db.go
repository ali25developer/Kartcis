package config

import (
	"fmt"
	"log"
	"os"

	"kartcis-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	godotenv.Load()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=kartcis port=5432 sslmode=disable"
		fmt.Println("Warning: DATABASE_URL not found, using default:", dsn)
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("Failed to connect to database:", err)
		log.Println("CRITICAL: Running without Database connection!")
		return
	}

	fmt.Println("Connected to Database!")

	// Sync Models with DB
	err = DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Event{},
		&models.TicketType{},
		&models.Order{},
		&models.Ticket{},
        &models.SocialAccount{}, // Added
	)
	if err != nil {
		log.Println("Migration failed:", err)
	}
}
