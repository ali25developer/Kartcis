package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"kartcis-backend/config"
	"kartcis-backend/models"
)

func GetEvents(c *gin.Context) {
	var events []models.Event
	var totalItems int64

	// Parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	search := c.Query("search")
	category := c.Query("category")
	featured := c.Query("featured")

	offset := (page - 1) * limit

	query := config.DB.Model(&models.Event{}).Preload("Category").Preload("TicketTypes")

	// Filters
	query = query.Where("status = ?", "published") // Public API only shows published

	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if category != "" {
		query = query.Joins("JOIN categories ON events.category_id = categories.id").
			Where("categories.slug = ?", category)
	}

	if featured == "true" {
		query = query.Where("is_featured = ?", true)
	}

	// Count Total
	query.Count(&totalItems)

	// Fetch Data
	query.Limit(limit).Offset(offset).Order("event_date ASC").Find(&events)

	// Pagination
	totalPages := int(totalItems) / limit
	if int(totalItems)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"events": events,
			"pagination": gin.H{
				"current_page": page,
				"total_pages":  totalPages,
				"total_items":  totalItems,
				"per_page":     limit,
			},
		},
	})
}

func GetEventDetail(c *gin.Context) {
	id := c.Param("id")
	var event models.Event

	if err := config.DB.Preload("Category").Preload("TicketTypes").First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    event,
	})
}
