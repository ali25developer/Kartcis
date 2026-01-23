package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"kartcis-backend/config"
	"kartcis-backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOauthConfig *oauth2.Config

// Init in main or on first call if env vars loaded late
func getGoogleConfig() *oauth2.Config {
    if googleOauthConfig == nil {
        googleOauthConfig = &oauth2.Config{
            RedirectURL:  "http://localhost:8000/api/v1/auth/google/callback",
            ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
            ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
            Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
            Endpoint:     google.Endpoint,
        }
    }
    return googleOauthConfig
}

func GoogleLogin(c *gin.Context) {
    url := getGoogleConfig().AuthCodeURL("random-state")
    c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
    state := c.Query("state")
    if state != "random-state" {
        c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid state"})
        return
    }

    code := c.Query("code")
    token, err := getGoogleConfig().Exchange(context.Background(), code)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Code exchange failed"})
        return
    }

    // Get User Info
    resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to get user info"})
        return
    }
    defer resp.Body.Close()

    content, _ := io.ReadAll(resp.Body)
    
    var googleUser struct {
        ID            string `json:"id"`
        Email         string `json:"email"`
        VerifiedEmail bool   `json:"verified_email"`
        Name          string `json:"name"`
        Picture       string `json:"picture"`
    }
    
    if err := json.Unmarshal(content, &googleUser); err != nil {
         c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to parse user info"})
         return
    }

    // Find or Create User
    var user models.User
    tx := config.DB.Begin()

    if err := tx.Where("email = ?", googleUser.Email).First(&user).Error; err != nil {
        // Create new user
        now := time.Now()
        user = models.User{
            Name:            googleUser.Name,
            Email:           googleUser.Email,
            Role:            "user",
            Avatar:          googleUser.Picture,
            EmailVerifiedAt: &now,
        }
        if err := tx.Create(&user).Error; err != nil {
             tx.Rollback()
             c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create user"})
             return
        }
    } else {
        // Update avatar if needed
        tx.Model(&user).Updates(models.User{Avatar: googleUser.Picture})
    }
    
    // Upsert Social Account
    var socialAccount models.SocialAccount
    if err := tx.Where("provider = ? AND provider_id = ?", "google", googleUser.ID).First(&socialAccount).Error; err != nil {
        socialAccount = models.SocialAccount{
            UserID: user.ID,
            Provider: "google",
            ProviderID: googleUser.ID,
            ProviderToken: token.AccessToken,
        }
        tx.Create(&socialAccount)
    } else {
         tx.Model(&socialAccount).Update("provider_token", token.AccessToken)
    }
    
    tx.Commit()

    // Generate JWT
    jwtToken, _ := generateToken(user)

    // Redirect to frontend with token
    frontendURL := os.Getenv("FRONTEND_URL")
    if frontendURL == "" {
        frontendURL = "http://localhost:5173"
    } 
    
    c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/oauth/callback?token=%s", frontendURL, jwtToken))
}
