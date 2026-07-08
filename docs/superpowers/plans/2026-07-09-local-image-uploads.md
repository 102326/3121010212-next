# Local Image Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated image upload support for counselor avatars and article covers.

**Architecture:** Add a focused upload handler in the Go API, serve uploaded files with Gin static file serving, and wire frontend file inputs to the existing counselor/article URL fields.

**Tech Stack:** Go, Gin, multipart upload handling, Next.js, React, TypeScript, local filesystem storage.

## Global Constraints

- Do not add new runtime dependencies.
- Require authentication for upload.
- Accept only JPEG, PNG, WebP, and GIF files.
- Limit uploads to 5 MB.
- Store files under `uploads/` and do not commit uploaded files.

---

### Task 1: Backend Upload Tests

**Files:**
- Create: `services/api/internal/http/uploads_test.go`

**Steps:**
- [ ] Test supported image content type detection.
- [ ] Test non-image content rejection.
- [ ] Test upload endpoint requires auth.
- [ ] Run `go test ./internal/http` and confirm it fails before implementation.

### Task 2: Backend Upload Handler

**Files:**
- Create: `services/api/internal/http/uploads.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `.gitignore`
- Create: `uploads/.gitkeep`

**Steps:**
- [ ] Implement content-type validation.
- [ ] Implement safe generated filenames.
- [ ] Implement authenticated multipart upload.
- [ ] Serve `/uploads` as static files.
- [ ] Ignore uploaded payloads while keeping `uploads/.gitkeep`.
- [ ] Run `go test ./...`.

### Task 3: Frontend Upload Controls

**Files:**
- Modify: `apps/web/app/page.tsx`

**Steps:**
- [ ] Add `uploadImage` helper using multipart form data.
- [ ] Add avatar upload input to the counselor profile panel.
- [ ] Add article cover URL state and upload input to the article editor.
- [ ] Include `cover_url` in article create and update requests.
- [ ] Run `npm run build:web`.

### Task 4: Documentation

**Files:**
- Modify: `docs/api.md`
- Modify: `docs/progress-and-plan.md`

**Steps:**
- [ ] Document the upload endpoint.
- [ ] Mark local image upload support as completed.
