package controllers

import (
	"fmt"
	"net/http"
	"time"

	"kartcis-backend/config"
	"kartcis-backend/models"

	"github.com/gin-gonic/gin"
)

type CheckoutRequest struct {
	Items []struct {
		TicketTypeID uint `json:"ticket_type_id"`
		Quantity     int  `json:"quantity"`
	} `json:"items"`
	PaymentMethod string `json:"payment_method"`
}

func CreateOrder(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	tx := config.DB.Begin()

	var totalAmount float64
	var orderItems []models.Ticket

	// Use user data for customer info
	var user models.User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "User not found"})
		return
	}

	for _, item := range req.Items {
		var ticketType models.TicketType
		if err := tx.First(&ticketType, item.TicketTypeID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ticket type"})
			return
		}

		if ticketType.Available < item.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": fmt.Sprintf("Not enough quota for %s", ticketType.Name)})
			return
		}

		// Deduct quota
		ticketType.Available -= item.Quantity
		if err := tx.Save(&ticketType).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update quota"})
			return
		}

		totalAmount += ticketType.Price * float64(item.Quantity)

		// Create tickets
		for i := 0; i < item.Quantity; i++ {
			orderItems = append(orderItems, models.Ticket{
				EventID:      ticketType.EventID,
				TicketTypeID: ticketType.ID,
				TicketCode:   fmt.Sprintf("T-%d-%d-%d", time.Now().UnixNano(), ticketType.ID, i), // Simple unique code
				AttendeeName: user.Name, // Default to buyer name
				Status:       "active",
			})
		}
	}

	// Create Order
	order := models.Order{
		UserID:        &user.ID,
		OrderNumber:   fmt.Sprintf("ORD-%d", time.Now().Unix()),
		CustomerName:  user.Name,
		CustomerEmail: user.Email,
		CustomerPhone: user.Phone,
		TotalAmount:   totalAmount,
		Status:        "pending",
		PaymentMethod: req.PaymentMethod,
		CreatedAt:     time.Now(),
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create order"})
		return
	}

	// Save tickets linked to order
	for i := range orderItems {
		orderItems[i].OrderID = &order.ID
		if err := tx.Create(&orderItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate tickets"})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    order,
	})
}

func GetUserOrders(c *gin.Context) {
	userID, _ := c.Get("userID")
	var orders []models.Order
	
	config.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
	})
}

func GetOrderDetail(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	var order models.Order
	// Ensure user owns the order
	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
	})
}

func PayOrder(c *gin.Context) {
    // Defines a mock payment endpoint
    id := c.Param("id")
    userID, _ := c.Get("userID")

    var order models.Order
    if err := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&order).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Order not found"})
        return
    }
    
    // Simulate Success
    now := time.Now()
    config.DB.Model(&order).Updates(models.Order{
        Status: "paid",
        PaidAt: &now,
    })
    
    c.JSON(http.StatusOK, gin.H{"success": true, "data": order})
}
