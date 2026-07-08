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

type ForumHandler struct {
	db *pgxpool.Pool
}

type forumPostResponse struct {
	ID           string                 `json:"id"`
	AuthorID     string                 `json:"author_id,omitempty"`
	Author       string                 `json:"author,omitempty"`
	Title        string                 `json:"title"`
	Content      string                 `json:"content,omitempty"`
	CommentCount int                    `json:"comment_count"`
	CreatedAt    string                 `json:"created_at"`
	Comments     []forumCommentResponse `json:"comments,omitempty"`
}

type forumCommentResponse struct {
	ID        string `json:"id"`
	PostID    string `json:"post_id"`
	AuthorID  string `json:"author_id,omitempty"`
	Author    string `json:"author,omitempty"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

type forumPostRequest struct {
	Title   string `json:"title" binding:"required,min=2,max=160"`
	Content string `json:"content" binding:"required,min=2,max=3000"`
}

type forumCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=1000"`
}

func NewForumHandler(db *pgxpool.Pool) *ForumHandler {
	return &ForumHandler{db: db}
}

func (h *ForumHandler) ListPosts(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT p.id::text, COALESCE(p.author_id::text, ''), COALESCE(u.display_name, ''),
		       p.title, p.content, p.created_at::text,
		       COUNT(c.id)::int
		FROM forum_posts p
		LEFT JOIN users u ON u.id = p.author_id
		LEFT JOIN forum_comments c ON c.post_id = p.id AND c.status = 'published'
		WHERE p.status = 'published'
		GROUP BY p.id, u.display_name
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list forum posts"})
		return
	}
	defer rows.Close()

	posts := make([]forumPostResponse, 0)
	for rows.Next() {
		var item forumPostResponse
		if err := rows.Scan(&item.ID, &item.AuthorID, &item.Author, &item.Title, &item.Content, &item.CreatedAt, &item.CommentCount); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan forum post"})
			return
		}
		posts = append(posts, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list forum posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func (h *ForumHandler) Detail(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var post forumPostResponse
	err := h.db.QueryRow(ctx, `
		SELECT p.id::text, COALESCE(p.author_id::text, ''), COALESCE(u.display_name, ''),
		       p.title, p.content, p.created_at::text
		FROM forum_posts p
		LEFT JOIN users u ON u.id = p.author_id
		WHERE p.id = $1 AND p.status = 'published'
	`, c.Param("id")).Scan(&post.ID, &post.AuthorID, &post.Author, &post.Title, &post.Content, &post.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "forum post not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load forum post"})
		return
	}

	comments, err := h.loadComments(ctx, post.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load forum comments"})
		return
	}
	post.CommentCount = len(comments)
	post.Comments = comments

	c.JSON(http.StatusOK, gin.H{"post": post})
}

func (h *ForumHandler) CreatePost(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req forumPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req, ok := normalizeForumPostRequest(req)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and content are required"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var post forumPostResponse
	err := h.db.QueryRow(ctx, `
		INSERT INTO forum_posts (author_id, title, content, status)
		VALUES ($1, $2, $3, 'published')
		RETURNING id::text, COALESCE(author_id::text, ''), title, content, created_at::text
	`, c.GetString("user_id"), req.Title, req.Content).Scan(&post.ID, &post.AuthorID, &post.Title, &post.Content, &post.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create forum post"})
		return
	}
	if err := h.db.QueryRow(ctx, `SELECT COALESCE(display_name, '') FROM users WHERE id = $1`, c.GetString("user_id")).Scan(&post.Author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load author"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"post": post})
}

func (h *ForumHandler) ArchivePost(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var id string
	err := h.db.QueryRow(ctx, `
		UPDATE forum_posts
		SET status = 'archived', updated_at = now()
		WHERE id = $1 AND (author_id = $2 OR $3 = 'admin')
		RETURNING id::text
	`, c.Param("id"), c.GetString("user_id"), c.GetString("role")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "forum post not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "archive forum post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "status": "archived"})
}

func (h *ForumHandler) CreateComment(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req forumCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req, ok := normalizeForumCommentRequest(req)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var exists bool
	if err := h.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM forum_posts WHERE id = $1 AND status = 'published')`, c.Param("id")).Scan(&exists); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load forum post"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "forum post not found"})
		return
	}

	var item forumCommentResponse
	err := h.db.QueryRow(ctx, `
		INSERT INTO forum_comments (post_id, author_id, content, status)
		VALUES ($1, $2, $3, 'published')
		RETURNING id::text, post_id::text, COALESCE(author_id::text, ''), content, created_at::text
	`, c.Param("id"), c.GetString("user_id"), req.Content).Scan(&item.ID, &item.PostID, &item.AuthorID, &item.Content, &item.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create forum comment"})
		return
	}
	if err := h.db.QueryRow(ctx, `SELECT COALESCE(display_name, '') FROM users WHERE id = $1`, c.GetString("user_id")).Scan(&item.Author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load author"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"comment": item})
}

func (h *ForumHandler) ArchiveComment(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var id string
	err := h.db.QueryRow(ctx, `
		UPDATE forum_comments
		SET status = 'archived', updated_at = now()
		WHERE id = $1 AND (author_id = $2 OR $3 = 'admin')
		RETURNING id::text
	`, c.Param("id"), c.GetString("user_id"), c.GetString("role")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "forum comment not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "archive forum comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "status": "archived"})
}

func (h *ForumHandler) loadComments(ctx context.Context, postID string) ([]forumCommentResponse, error) {
	rows, err := h.db.Query(ctx, `
		SELECT c.id::text, c.post_id::text, COALESCE(c.author_id::text, ''),
		       COALESCE(u.display_name, ''), c.content, c.created_at::text
		FROM forum_comments c
		LEFT JOIN users u ON u.id = c.author_id
		WHERE c.post_id = $1 AND c.status = 'published'
		ORDER BY c.created_at ASC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]forumCommentResponse, 0)
	for rows.Next() {
		var item forumCommentResponse
		if err := rows.Scan(&item.ID, &item.PostID, &item.AuthorID, &item.Author, &item.Content, &item.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return comments, nil
}

func normalizeForumPostRequest(req forumPostRequest) (forumPostRequest, bool) {
	post := forumPostRequest{
		Title:   strings.TrimSpace(req.Title),
		Content: strings.TrimSpace(req.Content),
	}
	return post, post.Title != "" && post.Content != ""
}

func normalizeForumCommentRequest(req forumCommentRequest) (forumCommentRequest, bool) {
	comment := forumCommentRequest{Content: strings.TrimSpace(req.Content)}
	return comment, comment.Content != ""
}
