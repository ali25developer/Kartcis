package main

import (
	"fmt"
	"os"

	"kartcis-backend/config"
	"kartcis-backend/routes"
)

func main() {
	// Connect to Database
	config.ConnectDB()

	// Setup Router
	r := routes.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	fmt.Println("Server is running on port", port)
	r.Run(":" + port)
}
