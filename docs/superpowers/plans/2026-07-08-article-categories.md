# Article Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add managed article categories to the Go API and current Next.js work surface.

**Architecture:** Keep the existing direct `pgxpool` handler style. Add a focused `ArticleCategoryHandler`, route it beside article routes, and keep the frontend in the current single-page surface until route-group refactoring happens later.

**Tech Stack:** Go, Gin, pgx, PostgreSQL migrations, Next.js, React, TypeScript, Tailwind CSS.

## Global Constraints

- Do not add new runtime dependencies.
- Keep article requests backward-compatible with the current `category` string field.
- Disable categories with `is_active = false`; do not physically delete records.
- Admin and counselor can manage categories; public users can list enabled categories.

---

### Task 1: Database Migration

**Files:**
- Create: `database/migrations/000002_article_categories.up.sql`
- Create: `database/migrations/000002_article_categories.down.sql`

**Steps:**
- [ ] Add `is_active` and `updated_at` columns.
- [ ] Add an index for active category listing.
- [ ] Add a down migration that removes the index and columns.

### Task 2: Backend Tests

**Files:**
- Create: `services/api/internal/http/article_categories_test.go`

**Steps:**
- [ ] Write tests for category name normalization.
- [ ] Write route tests proving unauthenticated category creation returns `401`.
- [ ] Write route tests proving a student token gets `403` before database access.
- [ ] Run `go test ./internal/http` and confirm the tests fail because the feature is missing.

### Task 3: Backend Handler And Routes

**Files:**
- Create: `services/api/internal/http/article_categories.go`
- Modify: `services/api/internal/http/router.go`

**Steps:**
- [ ] Implement list, create, update, and soft-disable handlers.
- [ ] Add `GET /article-categories` and protected management routes.
- [ ] Run `go test ./...` and confirm all backend tests pass.

### Task 4: Frontend Category UI

**Files:**
- Modify: `apps/web/app/page.tsx`

**Steps:**
- [ ] Add category state and API calls.
- [ ] Load categories on startup.
- [ ] Replace article category free-text input with a select.
- [ ] Add add, rename, and disable controls for admin/counselor users.
- [ ] Run `npm run build:web`.

### Task 5: Documentation

**Files:**
- Modify: `docs/api.md`
- Modify: `docs/progress-and-plan.md`

**Steps:**
- [ ] Document category endpoints.
- [ ] Mark category management as completed and update next steps.
