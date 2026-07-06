package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/local/3121010212-next/services/api/internal/config"
	apihttp "github.com/local/3121010212-next/services/api/internal/http"
	"github.com/local/3121010212-next/services/api/internal/storage"
	"go.uber.org/zap"
)

func main() {
	cfg := config.Load()

	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("create logger: %v", err)
	}
	defer logger.Sync()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := storage.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Warn("database unavailable; starting API without db", zap.Error(err))
	}
	if db != nil {
		defer db.Close()
	}

	router := apihttp.NewRouter(apihttp.Dependencies{
		Config: cfg,
		DB:     db,
		Logger: logger,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	logger.Info("api listening", zap.String("addr", cfg.HTTPAddr))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("api stopped", zap.Error(err))
	}
}
