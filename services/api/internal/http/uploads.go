package http

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

const maxUploadSize = 5 << 20

type UploadHandler struct {
	dir string
}

func NewUploadHandler(dir string) *UploadHandler {
	return &UploadHandler{dir: dir}
}

func (h *UploadHandler) Create(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	probe := make([]byte, 512)
	n, err := file.Read(probe)
	if err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "read file"})
		return
	}
	contentType := http.DetectContentType(probe[:n])
	extension, ok := allowedUploadContentType(contentType)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported image type"})
		return
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "read file"})
		return
	}
	if err := os.MkdirAll(h.dir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "prepare upload directory"})
		return
	}

	filename := generatedUploadFilename(extension)
	targetPath := filepath.Join(h.dir, filename)
	target, err := os.OpenFile(targetPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create upload file"})
		return
	}
	defer target.Close()

	written, err := io.Copy(target, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save upload file"})
		return
	}
	if written > maxUploadSize || header.Size > maxUploadSize {
		_ = target.Close()
		_ = os.Remove(targetPath)
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"filename": filename,
		"url":      "/uploads/" + filename,
	})
}

func allowedUploadContentType(contentType string) (string, bool) {
	switch contentType {
	case "image/jpeg":
		return ".jpg", true
	case "image/png":
		return ".png", true
	case "image/webp":
		return ".webp", true
	case "image/gif":
		return ".gif", true
	default:
		return "", false
	}
}

func generatedUploadFilename(extension string) string {
	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		return time.Now().UTC().Format("20060102-150405.000000000") + extension
	}
	return time.Now().UTC().Format("20060102-150405") + "-" + hex.EncodeToString(randomBytes) + extension
}
