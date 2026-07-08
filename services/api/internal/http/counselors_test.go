package http

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/local/3121010212-next/services/api/internal/auth"
	"github.com/local/3121010212-next/services/api/internal/config"
)

func TestNormalizeCounselorProfileTrimsRequiredFields(t *testing.T) {
	profile, ok := normalizeCounselorProfile(counselorProfileRequest{
		Name:          "  张老师  ",
		Specialty:     "  情绪管理  ",
		AvailableTime: "  周一 14:00-16:00  ",
	})

	if !ok {
		t.Fatal("expected profile to be valid")
	}
	if profile.Name != "张老师" {
		t.Fatalf("expected trimmed name, got %q", profile.Name)
	}
	if profile.Specialty != "情绪管理" {
		t.Fatalf("expected trimmed specialty, got %q", profile.Specialty)
	}
	if profile.AvailableTime != "周一 14:00-16:00" {
		t.Fatalf("expected trimmed available time, got %q", profile.AvailableTime)
	}
}

func TestNormalizeCounselorProfileRejectsBlankRequiredFields(t *testing.T) {
	_, ok := normalizeCounselorProfile(counselorProfileRequest{
		Name:      "   ",
		Specialty: "情绪管理",
	})

	if ok {
		t.Fatal("expected blank name to be invalid")
	}
}

func TestCounselorUpdateRequiresAuthentication(t *testing.T) {
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPut, "/api/v1/counselors/counselor-1", strings.NewReader(`{"name":"张老师","specialty":"情绪管理"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
}

func TestCounselorUpdateRejectsStudentRoleBeforeDatabase(t *testing.T) {
	token, err := auth.Sign("test-secret", "user-1", "student")
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPut, "/api/v1/counselors/counselor-1", strings.NewReader(`{"name":"张老师","specialty":"情绪管理"}`))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
}
