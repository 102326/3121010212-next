package http

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/local/3121010212-next/services/api/internal/auth"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db        *pgxpool.Pool
	jwtSecret string
}

type authRequest struct {
	Username    string `json:"username" binding:"required,min=3,max=64"`
	Password    string `json:"password" binding:"required,min=6,max=72"`
	DisplayName string `json:"display_name" binding:"omitempty,max=80"`
	Phone       string `json:"phone" binding:"omitempty,max=32"`
}

type userResponse struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	Role        string `json:"role"`
	DisplayName string `json:"display_name"`
	Phone       string `json:"phone,omitempty"`
	AvatarURL   string `json:"avatar_url,omitempty"`
}

type tokenResponse struct {
	Token string       `json:"token"`
	User  userResponse `json:"user"`
}

func NewAuthHandler(db *pgxpool.Pool, jwtSecret string) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret}
}

func (h *AuthHandler) Register(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash password"})
		return
	}

	displayName := strings.TrimSpace(req.DisplayName)
	if displayName == "" {
		displayName = strings.TrimSpace(req.Username)
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var user userResponse
	err = h.db.QueryRow(ctx, `
		INSERT INTO users (username, password_hash, role, display_name, phone)
		VALUES ($1, $2, 'student', $3, NULLIF($4, ''))
		RETURNING id::text, username, role::text, display_name, COALESCE(phone, ''), COALESCE(avatar_url, '')
	`, strings.TrimSpace(req.Username), string(hash), displayName, strings.TrimSpace(req.Phone)).
		Scan(&user.ID, &user.Username, &user.Role, &user.DisplayName, &user.Phone, &user.AvatarURL)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{"error": "username already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create user"})
		return
	}

	h.respondWithToken(c, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var user userResponse
	var passwordHash string
	err := h.db.QueryRow(ctx, `
		SELECT id::text, username, role::text, display_name, COALESCE(phone, ''), COALESCE(avatar_url, ''), password_hash
		FROM users
		WHERE username = $1 AND is_active = TRUE
	`, strings.TrimSpace(req.Username)).
		Scan(&user.ID, &user.Username, &user.Role, &user.DisplayName, &user.Phone, &user.AvatarURL, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load user"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	h.respondWithToken(c, user)
}

func (h *AuthHandler) Me(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	userID := c.GetString("user_id")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var user userResponse
	err := h.db.QueryRow(ctx, `
		SELECT id::text, username, role::text, display_name, COALESCE(phone, ''), COALESCE(avatar_url, '')
		FROM users
		WHERE id = $1 AND is_active = TRUE
	`, userID).Scan(&user.ID, &user.Username, &user.Role, &user.DisplayName, &user.Phone, &user.AvatarURL)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *AuthHandler) respondWithToken(c *gin.Context, user userResponse) {
	token, err := auth.Sign(h.jwtSecret, user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "sign token"})
		return
	}

	c.JSON(http.StatusOK, tokenResponse{Token: token, User: user})
}
