package http

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AssessmentHandler struct {
	db *pgxpool.Pool
}

type assessmentQuestionResponse struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Dimension string `json:"dimension"`
	SortOrder int    `json:"sort_order"`
}

type assessmentAnswerRequest struct {
	QuestionID string `json:"question_id"`
	Score      int    `json:"score"`
}

type assessmentSubmitRequest struct {
	Answers []assessmentAnswerRequest `json:"answers" binding:"required,min=1"`
}

type assessmentResult struct {
	TotalScore int    `json:"total_score"`
	Level      string `json:"level"`
	Suggestion string `json:"suggestion"`
}

type assessmentSubmissionResponse struct {
	ID         string                    `json:"id"`
	Answers    []assessmentAnswerRequest `json:"answers"`
	TotalScore int                       `json:"total_score"`
	Level      string                    `json:"level"`
	Suggestion string                    `json:"suggestion"`
	CreatedAt  string                    `json:"created_at"`
}

func NewAssessmentHandler(db *pgxpool.Pool) *AssessmentHandler {
	return &AssessmentHandler{db: db}
}

func (h *AssessmentHandler) ListQuestions(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id::text, title, dimension, sort_order
		FROM assessment_questions
		WHERE is_active = true
		ORDER BY sort_order ASC, created_at ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list assessment questions"})
		return
	}
	defer rows.Close()

	questions := make([]assessmentQuestionResponse, 0)
	for rows.Next() {
		var item assessmentQuestionResponse
		if err := rows.Scan(&item.ID, &item.Title, &item.Dimension, &item.SortOrder); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan assessment question"})
			return
		}
		questions = append(questions, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list assessment questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"questions": questions})
}

func (h *AssessmentHandler) CreateSubmission(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	var req assessmentSubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validateAssessmentAnswers(req.Answers) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "answers must include question_id and score from 0 to 4"})
		return
	}

	totalScore := 0
	for _, answer := range req.Answers {
		totalScore += answer.Score
	}
	result := interpretAssessmentScore(totalScore)
	answersJSON, err := json.Marshal(req.Answers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode answers"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var item assessmentSubmissionResponse
	var rawAnswers []byte
	err = h.db.QueryRow(ctx, `
		INSERT INTO assessment_submissions (user_id, answers, total_score, result_level, suggestion)
		VALUES ($1, $2::jsonb, $3, $4, $5)
		RETURNING id::text, answers, total_score, result_level, suggestion, created_at::text
	`, c.GetString("user_id"), string(answersJSON), totalScore, result.Level, result.Suggestion).
		Scan(&item.ID, &rawAnswers, &item.TotalScore, &item.Level, &item.Suggestion, &item.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create assessment submission"})
		return
	}
	if err := json.Unmarshal(rawAnswers, &item.Answers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "decode answers"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"submission": item})
}

func (h *AssessmentHandler) ListSubmissions(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id::text, answers, total_score, result_level, suggestion, created_at::text
		FROM assessment_submissions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 10
	`, c.GetString("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list assessment submissions"})
		return
	}
	defer rows.Close()

	submissions := make([]assessmentSubmissionResponse, 0)
	for rows.Next() {
		var item assessmentSubmissionResponse
		var rawAnswers []byte
		if err := rows.Scan(&item.ID, &rawAnswers, &item.TotalScore, &item.Level, &item.Suggestion, &item.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan assessment submission"})
			return
		}
		if err := json.Unmarshal(rawAnswers, &item.Answers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "decode answers"})
			return
		}
		submissions = append(submissions, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list assessment submissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}

func validateAssessmentAnswers(answers []assessmentAnswerRequest) bool {
	if len(answers) == 0 {
		return false
	}
	for _, answer := range answers {
		if answer.QuestionID == "" || answer.Score < 0 || answer.Score > 4 {
			return false
		}
	}
	return true
}

func interpretAssessmentScore(score int) assessmentResult {
	switch {
	case score <= 5:
		return assessmentResult{
			TotalScore: score,
			Level:      "low",
			Suggestion: "当前压力水平相对较低，继续保持稳定作息和适度运动。",
		}
	case score <= 12:
		return assessmentResult{
			TotalScore: score,
			Level:      "medium",
			Suggestion: "近期需要关注睡眠、情绪和日常节奏，可以尝试记录压力来源并主动调整。",
		}
	default:
		return assessmentResult{
			TotalScore: score,
			Level:      "high",
			Suggestion: "近期压力水平较高，建议尽快预约咨询师，获得更具体的支持。",
		}
	}
}
