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

type ArticleHandler struct {
	db *pgxpool.Pool
}

type articleResponse struct {
	ID          string `json:"id"`
	Category    string `json:"category,omitempty"`
	Author      string `json:"author,omitempty"`
	Title       string `json:"title"`
	Summary     string `json:"summary,omitempty"`
	Content     string `json:"content,omitempty"`
	CoverURL    string `json:"cover_url,omitempty"`
	ViewCount   int    `json:"view_count"`
	PublishedAt string `json:"published_at,omitempty"`
}

type articleRequest struct {
	Category string `json:"category" binding:"omitempty,max=80"`
	Title    string `json:"title" binding:"required,min=2,max=160"`
	Summary  string `json:"summary" binding:"omitempty,max=500"`
	Content  string `json:"content" binding:"required,min=2"`
	Status   string `json:"status" binding:"omitempty,oneof=draft published archived"`
}

func NewArticleHandler(db *pgxpool.Pool) *ArticleHandler {
	return &ArticleHandler{db: db}
}

func (h *ArticleHandler) List(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT a.id::text, COALESCE(ac.name, ''), COALESCE(u.display_name, ''),
		       a.title, COALESCE(a.summary, ''), COALESCE(a.cover_url, ''),
		       a.view_count, COALESCE(a.published_at::text, '')
		FROM articles a
		LEFT JOIN article_categories ac ON ac.id = a.category_id
		LEFT JOIN users u ON u.id = a.author_id
		WHERE a.status = 'published'
		ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list articles"})
		return
	}
	defer rows.Close()

	articles := make([]articleResponse, 0)
	for rows.Next() {
		var item articleResponse
		if err := rows.Scan(&item.ID, &item.Category, &item.Author, &item.Title, &item.Summary, &item.CoverURL, &item.ViewCount, &item.PublishedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan article"})
			return
		}
		articles = append(articles, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list articles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"articles": articles})
}

func (h *ArticleHandler) Detail(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tx, err := h.db.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "open transaction"})
		return
	}
	defer tx.Rollback(ctx)

	var item articleResponse
	err = tx.QueryRow(ctx, `
		UPDATE articles
		SET view_count = view_count + 1
		WHERE id = $1 AND status = 'published'
		RETURNING id::text, title, COALESCE(summary, ''), content, COALESCE(cover_url, ''),
		          view_count, COALESCE(published_at::text, '')
	`, c.Param("id")).Scan(&item.ID, &item.Title, &item.Summary, &item.Content, &item.CoverURL, &item.ViewCount, &item.PublishedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load article"})
		return
	}

	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(ac.name, ''), COALESCE(u.display_name, '')
		FROM articles a
		LEFT JOIN article_categories ac ON ac.id = a.category_id
		LEFT JOIN users u ON u.id = a.author_id
		WHERE a.id = $1
	`, item.ID).Scan(&item.Category, &item.Author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load article metadata"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit article view"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"article": item})
}

func (h *ArticleHandler) Create(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req articleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	status := req.Status
	if status == "" {
		status = "published"
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tx, err := h.db.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "open transaction"})
		return
	}
	defer tx.Rollback(ctx)

	categoryID, err := upsertArticleCategory(ctx, tx, req.Category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save category"})
		return
	}

	var item articleResponse
	err = tx.QueryRow(ctx, `
		INSERT INTO articles (category_id, author_id, title, summary, content, status, published_at)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6::publish_status, CASE WHEN $6 = 'published' THEN now() ELSE NULL END)
		RETURNING id::text, title, COALESCE(summary, ''), content, COALESCE(cover_url, ''),
		          view_count, COALESCE(published_at::text, '')
	`, categoryID, c.GetString("user_id"), strings.TrimSpace(req.Title), strings.TrimSpace(req.Summary), req.Content, status).
		Scan(&item.ID, &item.Title, &item.Summary, &item.Content, &item.CoverURL, &item.ViewCount, &item.PublishedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create article"})
		return
	}

	item.Category = strings.TrimSpace(req.Category)
	if err := tx.QueryRow(ctx, `SELECT display_name FROM users WHERE id = $1`, c.GetString("user_id")).Scan(&item.Author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load author"})
		return
	}
	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit article"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"article": item})
}

func (h *ArticleHandler) Update(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req articleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	status := req.Status
	if status == "" {
		status = "published"
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tx, err := h.db.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "open transaction"})
		return
	}
	defer tx.Rollback(ctx)

	categoryID, err := upsertArticleCategory(ctx, tx, req.Category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save category"})
		return
	}

	query := `
		UPDATE articles
		SET category_id = $1, title = $2, summary = NULLIF($3, ''), content = $4,
		    status = $5::publish_status,
		    published_at = CASE WHEN $5 = 'published' AND published_at IS NULL THEN now() ELSE published_at END,
		    updated_at = now()
		WHERE id = $6 AND (author_id = $7 OR $8 = 'admin')
		RETURNING id::text, title, COALESCE(summary, ''), content, COALESCE(cover_url, ''),
		          view_count, COALESCE(published_at::text, '')
	`

	var item articleResponse
	err = tx.QueryRow(ctx, query, categoryID, strings.TrimSpace(req.Title), strings.TrimSpace(req.Summary), req.Content, status, c.Param("id"), c.GetString("user_id"), c.GetString("role")).
		Scan(&item.ID, &item.Title, &item.Summary, &item.Content, &item.CoverURL, &item.ViewCount, &item.PublishedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update article"})
		return
	}

	item.Category = strings.TrimSpace(req.Category)
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(u.display_name, '')
		FROM articles a
		LEFT JOIN users u ON u.id = a.author_id
		WHERE a.id = $1
	`, item.ID).Scan(&item.Author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load author"})
		return
	}
	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit article"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"article": item})
}

func (h *ArticleHandler) Archive(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var id string
	err := h.db.QueryRow(ctx, `
		UPDATE articles
		SET status = 'archived', updated_at = now()
		WHERE id = $1 AND (author_id = $2 OR $3 = 'admin')
		RETURNING id::text
	`, c.Param("id"), c.GetString("user_id"), c.GetString("role")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "archive article"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "status": "archived"})
}

type articleTx interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func upsertArticleCategory(ctx context.Context, tx articleTx, name string) (any, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, nil
	}

	var id string
	err := tx.QueryRow(ctx, `
		INSERT INTO article_categories (name)
		VALUES ($1)
		ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
		RETURNING id::text
	`, name).Scan(&id)
	if err != nil {
		return nil, err
	}
	return id, nil
}
