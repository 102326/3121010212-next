# Assessment Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scored mental health assessment questions, submissions, and frontend interaction.

**Architecture:** Add PostgreSQL tables for questions and submissions, a focused Go handler for assessment endpoints, and a compact React panel in the current single-page work surface.

**Tech Stack:** Go, Gin, pgx, PostgreSQL JSONB, Next.js, React, TypeScript, Tailwind CSS.

## Global Constraints

- Do not add new runtime dependencies.
- Public users can read questions.
- Only logged-in users can submit and view their own submissions.
- Scores are self-assessment hints, not medical diagnosis.
- Commit message must be Simplified Chinese.

---

### Task 1: Database Migration And Seeds

**Files:**
- Create: `database/migrations/000004_assessments.up.sql`
- Create: `database/migrations/000004_assessments.down.sql`
- Modify: `database/seeds/001_demo.sql`

**Steps:**
- [ ] Create question table.
- [ ] Create submission table.
- [ ] Seed five demo questions.

### Task 2: Backend Tests

**Files:**
- Create: `services/api/internal/http/assessments_test.go`

**Steps:**
- [ ] Test result interpretation.
- [ ] Test answer validation.
- [ ] Test submission requires auth.
- [ ] Run `go test ./internal/http` and confirm red before implementation.

### Task 3: Backend Handler And Routes

**Files:**
- Create: `services/api/internal/http/assessments.go`
- Modify: `services/api/internal/http/router.go`

**Steps:**
- [ ] Implement question list.
- [ ] Implement submission create.
- [ ] Implement current user's submission list.
- [ ] Register assessment routes.
- [ ] Run `go test ./...`.

### Task 4: Frontend Assessment UI

**Files:**
- Modify: `apps/web/app/page.tsx`

**Steps:**
- [ ] Add assessment types and state.
- [ ] Load questions on startup.
- [ ] Add score selectors and submit action.
- [ ] Show latest result.
- [ ] Run `npm run build:web`.

### Task 5: Documentation

**Files:**
- Modify: `docs/api.md`
- Modify: `docs/progress-and-plan.md`

**Steps:**
- [ ] Document assessment endpoints.
- [ ] Mark assessment module as completed.
