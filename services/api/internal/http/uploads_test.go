package http

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/local/3121010212-next/services/api/internal/config"
)

func TestAllowedUploadContentTypeAcceptsSupportedImages(t *testing.T) {
	for _, contentType := range []string{"image/jpeg", "image/png", "image/webp", "image/gif"} {
		extension, ok := allowedUploadContentType(contentType)
		if !ok {
			t.Fatalf("expected %s to be allowed", contentType)
		}
		if extension == "" {
			t.Fatalf("expected extension for %s", contentType)
		}
	}
}

func TestAllowedUploadContentTypeRejectsNonImages(t *testing.T) {
	if extension, ok := allowedUploadContentType("text/plain"); ok || extension != "" {
		t.Fatalf("expected text/plain to be rejected, got extension=%q allowed=%v", extension, ok)
	}
}

func TestUploadRequiresAuthentication(t *testing.T) {
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
}
