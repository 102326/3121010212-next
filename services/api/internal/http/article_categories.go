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

type ArticleCategoryHandler struct {
	db *pgxpool.Pool
}

type articleCategoryResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at,omitempty"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type articleCategoryRequest struct {
	Name string `json:"name" binding:"required,max=80"`
}

func NewArticleCategoryHandler(db *pgxpool.Pool) *ArticleCategoryHandler {
	return &ArticleCategoryHandler{db: db}
}

func (h *ArticleCategoryHandler) List(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id::text, name, is_active, created_at::text, updated_at::text
		FROM article_categories
		WHERE is_active = true
		ORDER BY name ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list article categories"})
		return
	}
	defer rows.Close()

	categories := make([]articleCategoryResponse, 0)
	for rows.Next() {
		var item articleCategoryResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.IsActive, &item.CreatedAt, &item.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan article category"})
			return
		}
		categories = append(categories, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list article categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

func (h *ArticleCategoryHandler) Create(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	name, ok := bindArticleCategoryName(c)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var item articleCategoryResponse
	err := h.db.QueryRow(ctx, `
		INSERT INTO article_categories (name, is_active)
		VALUES ($1, true)
		ON CONFLICT (name) DO UPDATE SET is_active = true, updated_at = now()
		RETURNING id::text, name, is_active, created_at::text, updated_at::text
	`, name).Scan(&item.ID, &item.Name, &item.IsActive, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create article category"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"category": item})
}

func (h *ArticleCategoryHandler) Update(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	name, ok := bindArticleCategoryName(c)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var item articleCategoryResponse
	err := h.db.QueryRow(ctx, `
		UPDATE article_categories
		SET name = $1, is_active = true, updated_at = now()
		WHERE id = $2
		RETURNING id::text, name, is_active, created_at::text, updated_at::text
	`, name, c.Param("id")).Scan(&item.ID, &item.Name, &item.IsActive, &item.CreatedAt, &item.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "article category not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update article category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"category": item})
}

func (h *ArticleCategoryHandler) Disable(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var id string
	err := h.db.QueryRow(ctx, `
		UPDATE article_categories
		SET is_active = false, updated_at = now()
		WHERE id = $1
		RETURNING id::text
	`, c.Param("id")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "article category not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "disable article category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "is_active": false})
}

func bindArticleCategoryName(c *gin.Context) (string, bool) {
	var req articleCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return "", false
	}

	name, ok := normalizeArticleCategoryName(req.Name)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category name is required"})
		return "", false
	}
	return name, true
}

func normalizeArticleCategoryName(name string) (string, bool) {
	name = strings.TrimSpace(name)
	return name, name != ""
}
