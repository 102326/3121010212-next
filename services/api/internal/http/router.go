package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/local/3121010212-next/services/api/internal/config"
	"go.uber.org/zap"
)

type Dependencies struct {
	Config config.Config
	DB     *pgxpool.Pool
	Logger *zap.Logger
}

func NewRouter(deps Dependencies) http.Handler {
	router := gin.New()
	router.Use(gin.Recovery(), CORS())
	router.Static("/uploads", "uploads")

	router.GET("/healthz", func(c *gin.Context) {
		status := "ok"
		if deps.DB == nil {
			status = "degraded"
		}
		c.JSON(http.StatusOK, gin.H{"status": status})
	})

	v1 := router.Group("/api/v1")
	authHandler := NewAuthHandler(deps.DB, deps.Config.JWTSecret)
	counselorHandler := NewCounselorHandler(deps.DB)
	appointmentHandler := NewAppointmentHandler(deps.DB)
	articleHandler := NewArticleHandler(deps.DB)
	articleCategoryHandler := NewArticleCategoryHandler(deps.DB)
	uploadHandler := NewUploadHandler("uploads")
	forumHandler := NewForumHandler(deps.DB)
	assessmentHandler := NewAssessmentHandler(deps.DB)

	v1.GET("/meta", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"name":    "3121010212-next API",
			"version": "0.1.0",
			"modules": []string{
				"auth",
				"articles",
				"article-categories",
				"counselors",
				"appointments",
				"uploads",
				"forum",
				"assessment",
			},
		})
	})
	v1.POST("/auth/register", authHandler.Register)
	v1.POST("/auth/login", authHandler.Login)
	v1.GET("/me", RequireAuth(deps.Config.JWTSecret), authHandler.Me)
	v1.GET("/counselors", counselorHandler.List)
	v1.PUT("/counselors/:id", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), counselorHandler.Update)
	v1.GET("/article-categories", articleCategoryHandler.List)
	v1.POST("/article-categories", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), articleCategoryHandler.Create)
	v1.PUT("/article-categories/:id", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), articleCategoryHandler.Update)
	v1.DELETE("/article-categories/:id", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), articleCategoryHandler.Disable)
	v1.GET("/articles", articleHandler.List)
	v1.GET("/articles/:id", articleHandler.Detail)
	v1.POST("/articles", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), articleHandler.Create)
	v1.PUT("/articles/:id", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), articleHandler.Update)
	v1.DELETE("/articles/:id", RequireAuth(deps.Config.JWTSecret), RequireAnyRole("admin", "counselor"), articleHandler.Archive)
	v1.POST("/uploads", RequireAuth(deps.Config.JWTSecret), uploadHandler.Create)
	v1.GET("/forum-posts", forumHandler.ListPosts)
	v1.GET("/forum-posts/:id", forumHandler.Detail)
	v1.POST("/forum-posts", RequireAuth(deps.Config.JWTSecret), forumHandler.CreatePost)
	v1.DELETE("/forum-posts/:id", RequireAuth(deps.Config.JWTSecret), forumHandler.ArchivePost)
	v1.POST("/forum-posts/:id/comments", RequireAuth(deps.Config.JWTSecret), forumHandler.CreateComment)
	v1.DELETE("/forum-comments/:id", RequireAuth(deps.Config.JWTSecret), forumHandler.ArchiveComment)
	v1.GET("/assessment/questions", assessmentHandler.ListQuestions)
	v1.POST("/assessment/submissions", RequireAuth(deps.Config.JWTSecret), assessmentHandler.CreateSubmission)
	v1.GET("/assessment/submissions", RequireAuth(deps.Config.JWTSecret), assessmentHandler.ListSubmissions)
	v1.GET("/appointments", RequireAuth(deps.Config.JWTSecret), appointmentHandler.ListMine)
	v1.POST("/appointments", RequireAuth(deps.Config.JWTSecret), appointmentHandler.Create)
	v1.PATCH("/appointments/:id/status", RequireAuth(deps.Config.JWTSecret), appointmentHandler.UpdateStatus)

	return router
}
