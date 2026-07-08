# Counselor Profile Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add API and frontend controls for editing counselor profile details.

**Architecture:** Extend the existing `CounselorHandler` with an authenticated update endpoint. Keep the frontend in the current single-page work surface and reuse the selected counselor state.

**Tech Stack:** Go, Gin, pgx, PostgreSQL, Next.js, React, TypeScript, Tailwind CSS.

## Global Constraints

- Do not add new runtime dependencies.
- Do not add upload handling in this step.
- Admin can update any counselor; counselors can update only their own profile.
- Students cannot update counselor profiles.

---

### Task 1: Backend Tests

**Files:**
- Create: `services/api/internal/http/counselors_test.go`

**Steps:**
- [ ] Write a test that trims profile fields and keeps required values.
- [ ] Write a test that rejects blank required values.
- [ ] Write a route test proving unauthenticated update returns `401`.
- [ ] Write a route test proving a student token gets `403` before database access.
- [ ] Run `go test ./internal/http` and confirm the tests fail because the feature is missing.

### Task 2: Backend Handler

**Files:**
- Modify: `services/api/internal/http/counselors.go`
- Modify: `services/api/internal/http/router.go`

**Steps:**
- [ ] Add request parsing and normalization.
- [ ] Add `Update` handler with role ownership rules.
- [ ] Add `PUT /api/v1/counselors/:id`.
- [ ] Run `go test ./...`.

### Task 3: Frontend Editor

**Files:**
- Modify: `apps/web/app/page.tsx`

**Steps:**
- [ ] Add counselor profile form state.
- [ ] Fill the form when a counselor is selected.
- [ ] Save profile changes through `PUT /counselors/:id`.
- [ ] Refresh the counselor list after save.
- [ ] Run `npm run build:web`.

### Task 4: Documentation

**Files:**
- Modify: `docs/api.md`
- Modify: `docs/progress-and-plan.md`

**Steps:**
- [ ] Document the update endpoint.
- [ ] Mark counselor profile management as completed.
