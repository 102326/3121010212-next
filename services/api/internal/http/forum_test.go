package http

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/local/3121010212-next/services/api/internal/config"
)

func TestNormalizeForumPostRequestTrimsFields(t *testing.T) {
	post, ok := normalizeForumPostRequest(forumPostRequest{
		Title:   "  如何缓解压力  ",
		Content: "  最近压力有点大，想听听建议。  ",
	})

	if !ok {
		t.Fatal("expected forum post to be valid")
	}
	if post.Title != "如何缓解压力" {
		t.Fatalf("expected trimmed title, got %q", post.Title)
	}
	if post.Content != "最近压力有点大，想听听建议。" {
		t.Fatalf("expected trimmed content, got %q", post.Content)
	}
}

func TestNormalizeForumPostRequestRejectsBlankTitle(t *testing.T) {
	_, ok := normalizeForumPostRequest(forumPostRequest{
		Title:   "   ",
		Content: "内容",
	})

	if ok {
		t.Fatal("expected blank title to be invalid")
	}
}

func TestForumPostCreateRequiresAuthentication(t *testing.T) {
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/forum-posts", strings.NewReader(`{"title":"压力讨论","content":"大家怎么放松？"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
}

func TestForumCommentCreateRequiresAuthentication(t *testing.T) {
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/forum-posts/post-1/comments", strings.NewReader(`{"content":"我会先去散步。"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
}
