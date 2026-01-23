package controllers

import (
	"kartcis-backend/config"
	"kartcis-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminGetTransactions(c *gin.Context) {
    var orders []models.Order
    
    query := config.DB.Model(&models.Order{})
    
    // Search filter
    search := c.Query("search")
    if search != "" {
        query = query.Where("order_number ILIKE ? OR customer_email ILIKE ?", "%"+search+"%", "%"+search+"%")
    }
    
    query.Preload("Tickets").Order("created_at desc").Find(&orders)
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": gin.H{
            "transactions": orders,
            "stats": gin.H{
                 "total": len(orders),
                 "total_revenue": 0, // Calculate real sum in loop if needed
            },
        },
    })
}

func AdminGetTransactionDetail(c *gin.Context) {
     id := c.Param("id")
     var order models.Order
     
     if err := config.DB.First(&order, id).Error; err != nil {
         c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Order not found"})
         return
     }
     
     c.JSON(http.StatusOK, gin.H{"success": true, "data": order})
}
