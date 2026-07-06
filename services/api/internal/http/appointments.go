package http

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AppointmentHandler struct {
	db *pgxpool.Pool
}

type createAppointmentRequest struct {
	CounselorID string `json:"counselor_id" binding:"required"`
	ScheduledAt string `json:"scheduled_at" binding:"required"`
	Content     string `json:"content" binding:"required,min=2,max=1000"`
}

type updateAppointmentStatusRequest struct {
	Status       string `json:"status" binding:"required"`
	CancelReason string `json:"cancel_reason"`
}

type appointmentResponse struct {
	ID            string `json:"id"`
	StudentID     string `json:"student_id"`
	StudentName   string `json:"student_name"`
	CounselorID   string `json:"counselor_id"`
	CounselorName string `json:"counselor_name"`
	ScheduledAt   string `json:"scheduled_at"`
	Content       string `json:"content"`
	Status        string `json:"status"`
	CancelReason  string `json:"cancel_reason,omitempty"`
	CreatedAt     string `json:"created_at"`
}

func NewAppointmentHandler(db *pgxpool.Pool) *AppointmentHandler {
	return &AppointmentHandler{db: db}
}

func (h *AppointmentHandler) Create(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req createAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "scheduled_at must be RFC3339"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var item appointmentResponse
	err = h.db.QueryRow(ctx, `
		INSERT INTO appointments (student_id, counselor_id, scheduled_at, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id::text, student_id::text, counselor_id::text, scheduled_at::text, content, status::text, COALESCE(cancel_reason, ''), created_at::text
	`, c.GetString("user_id"), req.CounselorID, scheduledAt, req.Content).
		Scan(&item.ID, &item.StudentID, &item.CounselorID, &item.ScheduledAt, &item.Content, &item.Status, &item.CancelReason, &item.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid counselor_id"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create appointment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"appointment": item})
}

func (h *AppointmentHandler) ListMine(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	role := c.GetString("role")
	userID := c.GetString("user_id")

	query := `
		SELECT a.id::text, a.student_id::text, su.display_name, a.counselor_id::text, co.name,
		       a.scheduled_at::text, a.content, a.status::text, COALESCE(a.cancel_reason, ''), a.created_at::text
		FROM appointments a
		JOIN users su ON su.id = a.student_id
		JOIN counselors co ON co.id = a.counselor_id
		WHERE a.student_id = $1
		ORDER BY a.scheduled_at DESC
	`
	args := []any{userID}
	if role == "counselor" {
		query = `
			SELECT a.id::text, a.student_id::text, su.display_name, a.counselor_id::text, co.name,
			       a.scheduled_at::text, a.content, a.status::text, COALESCE(a.cancel_reason, ''), a.created_at::text
			FROM appointments a
			JOIN users su ON su.id = a.student_id
			JOIN counselors co ON co.id = a.counselor_id
			WHERE co.user_id = $1
			ORDER BY a.scheduled_at DESC
		`
	}
	if role == "admin" {
		query = `
			SELECT a.id::text, a.student_id::text, su.display_name, a.counselor_id::text, co.name,
			       a.scheduled_at::text, a.content, a.status::text, COALESCE(a.cancel_reason, ''), a.created_at::text
			FROM appointments a
			JOIN users su ON su.id = a.student_id
			JOIN counselors co ON co.id = a.counselor_id
			ORDER BY a.scheduled_at DESC
		`
		args = nil
	}

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list appointments"})
		return
	}
	defer rows.Close()

	appointments := make([]appointmentResponse, 0)
	for rows.Next() {
		var item appointmentResponse
		if err := rows.Scan(&item.ID, &item.StudentID, &item.StudentName, &item.CounselorID, &item.CounselorName, &item.ScheduledAt, &item.Content, &item.Status, &item.CancelReason, &item.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan appointment"})
			return
		}
		appointments = append(appointments, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list appointments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"appointments": appointments})
}

func (h *AppointmentHandler) UpdateStatus(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	role := c.GetString("role")
	if role != "admin" && role != "counselor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin or counselor required"})
		return
	}

	var req updateAppointmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validAppointmentStatus(req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE appointments
		SET status = $1, cancel_reason = NULLIF($2, ''), updated_at = now()
		WHERE id = $3
		RETURNING id::text
	`
	args := []any{req.Status, req.CancelReason, c.Param("id")}
	if role == "counselor" {
		query = `
			UPDATE appointments a
			SET status = $1, cancel_reason = NULLIF($2, ''), updated_at = now()
			FROM counselors co
			WHERE a.id = $3 AND a.counselor_id = co.id AND co.user_id = $4
			RETURNING a.id::text
		`
		args = append(args, c.GetString("user_id"))
	}

	var id string
	if err := h.db.QueryRow(ctx, query, args...).Scan(&id); errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "appointment not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update appointment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "status": req.Status})
}

func validAppointmentStatus(status string) bool {
	switch status {
	case "pending", "approved", "cancelled", "completed":
		return true
	default:
		return false
	}
}
