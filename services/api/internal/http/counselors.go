package http

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
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
