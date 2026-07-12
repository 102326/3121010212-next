package http

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/local/3121010212-next/services/api/internal/config"
)

func TestInterpretAssessmentScore(t *testing.T) {
	cases := []struct {
		score int
		level string
	}{
		{score: 5, level: "low"},
		{score: 6, level: "medium"},
		{score: 12, level: "medium"},
		{score: 13, level: "high"},
	}

	for _, item := range cases {
		result := interpretAssessmentScore(item.score)
		if result.Level != item.level {
			t.Fatalf("score %d expected level %q, got %q", item.score, item.level, result.Level)
		}
		if result.Suggestion == "" {
			t.Fatalf("score %d expected suggestion", item.score)
		}
	}
}

func TestValidateAssessmentAnswersRejectsOutOfRangeScore(t *testing.T) {
	ok := validateAssessmentAnswers([]assessmentAnswerRequest{
		{QuestionID: "question-1", Score: 5},
	})

	if ok {
		t.Fatal("expected score outside 0-4 to be rejected")
	}
}

func TestAssessmentSubmitRequiresAuthentication(t *testing.T) {
	router := NewRouter(Dependencies{Config: config.Config{JWTSecret: "test-secret"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/assessment/submissions", strings.NewReader(`{"answers":[{"question_id":"question-1","score":2}]}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
}
