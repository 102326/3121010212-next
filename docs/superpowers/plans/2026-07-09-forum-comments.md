# Forum Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add forum posts and comments to the existing mental health service platform.

**Architecture:** Add PostgreSQL tables with soft archive status, a focused Go `ForumHandler`, and a compact React section in the current single-page surface.

**Tech Stack:** Go, Gin, pgx, PostgreSQL migrations, Next.js, React, TypeScript, Tailwind CSS.

## Global Constraints

- Do not add new runtime dependencies.
- Public users can read published posts and comments.
- Logged-in users can create posts and comments.
- Only content authors and admin users can archive their own posts/comments.
- Use soft archive; do not physically delete posts or comments.
- Commit message for this step must be Simplified Chinese.

---

### Task 1: Database Migration

**Files:**
- Create: `database/migrations/000003_forum.up.sql`
- Create: `database/migrations/000003_forum.down.sql`

**Steps:**
- [ ] Create `forum_posts`.
- [ ] Create `forum_comments`.
- [ ] Add indexes for published listing and comment loading.

### Task 2: Backend Tests

**Files:**
- Create: `services/api/internal/http/forum_test.go`

**Steps:**
- [ ] Test post request trimming.
- [ ] Test blank required values rejected.
- [ ] Test post creation requires auth.
- [ ] Test comment creation requires auth.
- [ ] Run `go test ./internal/http` and confirm red.

### Task 3: Backend Handler And Routes

**Files:**
- Create: `services/api/internal/http/forum.go`
- Modify: `services/api/internal/http/router.go`

**Steps:**
- [ ] Implement list, detail, create, archive post.
- [ ] Implement create and archive comment.
- [ ] Register forum routes.
- [ ] Run `go test ./...`.

### Task 4: Frontend Community UI

**Files:**
- Modify: `apps/web/app/page.tsx`

**Steps:**
- [ ] Add forum types and state.
- [ ] Load post list and selected post detail.
- [ ] Add post and comment forms.
- [ ] Add archive actions for eligible users.
- [ ] Run `npm run build:web`.

### Task 5: Documentation

**Files:**
- Modify: `docs/api.md`
- Modify: `docs/progress-and-plan.md`

**Steps:**
- [ ] Document forum endpoints.
- [ ] Mark forum/comment module as completed.
