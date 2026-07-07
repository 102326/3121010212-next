package http

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/local/3121010212-next/services/api/internal/auth"
	"github.com/local/3121010212-next/services/api/internal/config"
)

func TestNormalizeArticleCategoryNameTrimsWhitespace(t *testing.T) {
	name, ok := normalizeArticleCategoryName("  睡眠管理  ")

	if !ok {
		t.Fatal("expected category name to be valid")
	}
	if name != "睡眠管理" {
		t.Fatalf("expected trimmed name, got %q", name)
	}
}

func TestNormalizeArticleCategoryNameRejectsBlank(t *testing.T) {
	name, ok := normalizeArticleCategoryName("   ")

	if ok {
		t.Fatal("expected blank category name to be invalid")
	}
	if name != "" {
		t.Fatalf("expected empty name, got %q", name)
	}
}

func TestArticleCategoryCreateRequiresAuthentication(t *testing.T) {
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/article-categories", strings.NewReader(`{"name":"睡眠管理"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
}

func TestArticleCategoryCreateRejectsStudentRoleBeforeDatabase(t *testing.T) {
	token, err := auth.Sign("test-secret", "user-1", "student")
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/article-categories", strings.NewReader(`{"name":"睡眠管理"}`))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
}
