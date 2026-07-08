package http

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CounselorHandler struct {
	db *pgxpool.Pool
}

type counselorResponse struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Gender        string `json:"gender,omitempty"`
	AvatarURL     string `json:"avatar_url,omitempty"`
	Specialty     string `json:"specialty"`
	AvailableTime string `json:"available_time,omitempty"`
	Phone         string `json:"phone,omitempty"`
	Bio           string `json:"bio,omitempty"`
	Rating        string `json:"rating"`
}

type counselorProfileRequest struct {
	Name          string `json:"name" binding:"required,max=80"`
	Gender        string `json:"gender" binding:"omitempty,max=20"`
	AvatarURL     string `json:"avatar_url" binding:"omitempty,max=500"`
	Specialty     string `json:"specialty" binding:"required,max=200"`
	AvailableTime string `json:"available_time" binding:"omitempty,max=200"`
	Phone         string `json:"phone" binding:"omitempty,max=30"`
	Bio           string `json:"bio" binding:"omitempty,max=1000"`
}

func NewCounselorHandler(db *pgxpool.Pool) *CounselorHandler {
	return &CounselorHandler{db: db}
}

func (h *CounselorHandler) List(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id::text, name, COALESCE(gender, ''), COALESCE(avatar_url, ''), specialty,
		       COALESCE(available_time, ''), COALESCE(phone, ''), COALESCE(bio, ''), rating::text
		FROM counselors
		WHERE status = 'published'
		ORDER BY rating DESC, created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list counselors"})
		return
	}
	defer rows.Close()

	counselors := make([]counselorResponse, 0)
	for rows.Next() {
		var item counselorResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.Gender, &item.AvatarURL, &item.Specialty, &item.AvailableTime, &item.Phone, &item.Bio, &item.Rating); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan counselor"})
			return
		}
		counselors = append(counselors, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list counselors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"counselors": counselors})
}

func (h *CounselorHandler) Update(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req counselorProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	profile, ok := normalizeCounselorProfile(req)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and specialty are required"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var item counselorResponse
	err := h.db.QueryRow(ctx, `
		UPDATE counselors
		SET name = $1,
		    gender = NULLIF($2, ''),
		    avatar_url = NULLIF($3, ''),
		    specialty = $4,
		    available_time = NULLIF($5, ''),
		    phone = NULLIF($6, ''),
		    bio = NULLIF($7, ''),
		    updated_at = now()
		WHERE id = $8 AND ($9 = 'admin' OR user_id = $10)
		RETURNING id::text, name, COALESCE(gender, ''), COALESCE(avatar_url, ''), specialty,
		          COALESCE(available_time, ''), COALESCE(phone, ''), COALESCE(bio, ''), rating::text
	`, profile.Name, profile.Gender, profile.AvatarURL, profile.Specialty, profile.AvailableTime, profile.Phone, profile.Bio, c.Param("id"), c.GetString("role"), c.GetString("user_id")).
		Scan(&item.ID, &item.Name, &item.Gender, &item.AvatarURL, &item.Specialty, &item.AvailableTime, &item.Phone, &item.Bio, &item.Rating)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "counselor not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update counselor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"counselor": item})
}

func normalizeCounselorProfile(req counselorProfileRequest) (counselorProfileRequest, bool) {
	profile := counselorProfileRequest{
		Name:          strings.TrimSpace(req.Name),
		Gender:        strings.TrimSpace(req.Gender),
		AvatarURL:     strings.TrimSpace(req.AvatarURL),
		Specialty:     strings.TrimSpace(req.Specialty),
		AvailableTime: strings.TrimSpace(req.AvailableTime),
		Phone:         strings.TrimSpace(req.Phone),
		Bio:           strings.TrimSpace(req.Bio),
	}
	return profile, profile.Name != "" && profile.Specialty != ""
}
