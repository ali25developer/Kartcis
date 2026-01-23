package routes

import (
	"kartcis-backend/controllers"
	"kartcis-backend/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

    // Middleware
    r.Use(middleware.CORSMiddleware())

	v1 := r.Group("/api/v1")
	{
		// Auth
		auth := v1.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
			auth.POST("/logout", middleware.AuthMiddleware(), controllers.Logout)
			auth.GET("/me", middleware.AuthMiddleware(), controllers.GetMe)
            
            // Google Auth
            auth.GET("/google", controllers.GoogleLogin)
            auth.GET("/google/callback", controllers.GoogleCallback)
		}

		// Public Events
		v1.GET("/events", controllers.GetEvents)
		v1.GET("/events/:id", controllers.GetEventDetail)
        
        // Orders (User)
        userOrders := v1.Group("/orders")
        userOrders.Use(middleware.AuthMiddleware())
        {
            userOrders.POST("/", controllers.CreateOrder)
            userOrders.GET("/", controllers.GetUserOrders)
            userOrders.GET("/:id", controllers.GetOrderDetail)
            userOrders.POST("/:id/pay", controllers.PayOrder)
        }
        
        // Admin
        admin := v1.Group("/admin")
        admin.Use(middleware.AuthMiddleware(), requireAdmin())
        {
            admin.GET("/events", controllers.AdminGetEvents)
            admin.POST("/events", controllers.CreateEvent)
            admin.PUT("/events/:id", controllers.UpdateEvent)
            admin.DELETE("/events/:id", controllers.DeleteEvent)
            
            admin.GET("/transactions", controllers.AdminGetTransactions)
            admin.GET("/transactions/:id", controllers.AdminGetTransactionDetail)
        }
	}

	return r
}

func requireAdmin() gin.HandlerFunc {
    return func(c *gin.Context) {
        role, exists := c.Get("userRole")
        if !exists || role != "admin" {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "Admin access required"})
            return
        }
        c.Next()
    }
}
