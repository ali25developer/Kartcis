package controllers

import (
	"net/http"
	"time"

	"kartcis-backend/config"
	"kartcis-backend/models"

	"github.com/gin-gonic/gin"
)

// AdminGetEvents retrieves events with admin-specific filters
func AdminGetEvents(c *gin.Context) {
	// Reusing logic similar to GetEvents but without "published" restriction
    var events []models.Event
    
    // Simple fetch all for admin for now
    config.DB.Preload("Category").Preload("TicketTypes").Order("created_at desc").Find(&events)
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": gin.H{
            "events": events,
        },
    })
}

func CreateEvent(c *gin.Context) {
    var input models.Event
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
        return
    }
    
    // Basic defaults
    if input.Slug == "" {
        input.Slug = input.Title // Simplified slug gen
    }
    input.CreatedAt = time.Now()
    
    if err := config.DB.Create(&input).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create event"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"success": true, "data": input})
}

func UpdateEvent(c *gin.Context) {
    id := c.Param("id")
    var event models.Event
    
    if err := config.DB.First(&event, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
        return
    }
    
    var input models.Event
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
        return
    }
    
    config.DB.Model(&event).Updates(input)
    
    c.JSON(http.StatusOK, gin.H{"success": true, "data": event})
}

func DeleteEvent(c *gin.Context) {
    id := c.Param("id")
    if err := config.DB.Delete(&models.Event{}, id).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"success": true, "message": "Event deleted"})
}
