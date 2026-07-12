# Progress and Next Plan

Date: 2026-07-13

## Current Goal

Rebuild the legacy `3121010212` Java SSM graduation project as a modern full-stack system:

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Go, Gin, pgx
- Database: PostgreSQL, with future pgvector support
- AI: later through Go API first, optional Python FastAPI service when RAG is needed

## Current Repository State

Project root:

```text
D:\daima\3121010212-next
```

Local services:

- Frontend: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:8080`
- PostgreSQL container: `pylab_pg`
- Database: `mental_health`

The old Java project and MySQL dump are kept locally as migration references, but they are intentionally ignored by Git because they contain legacy credentials, token dumps, generated frontend bundles, and large archival assets.

## Completed

### Project Skeleton

- Created the new `3121010212-next` workspace.
- Initialized a local Git repository.
- Added Next.js frontend under `apps/web`.
- Added Go Gin API under `services/api`.
- Added database migrations and seeds under `database`.
- Added architecture, API, local infrastructure, migration, and legacy-analysis docs.

### Database

- Created PostgreSQL database `mental_health`.
- Added initial schema:
  - `users`
  - `counselors`
  - `article_categories`
  - `articles`
  - `appointments`
  - `forum_posts`
  - `forum_comments`
  - `assessment_questions`
  - `assessment_submissions`
- Seeded demo users:
  - `admin / 123456`
  - `student-demo / 123456`
  - `counselor-demo / 123456`
- Seeded one demo counselor and one demo article.

### Backend API

Implemented:

- `GET /healthz`
- `GET /api/v1/meta`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `GET /api/v1/counselors`
- `PUT /api/v1/counselors/:id`
- `GET /api/v1/article-categories`
- `POST /api/v1/article-categories`
- `PUT /api/v1/article-categories/:id`
- `DELETE /api/v1/article-categories/:id`
- `POST /api/v1/uploads`
- `GET /api/v1/articles`
- `GET /api/v1/articles/:id`
- `POST /api/v1/articles`
- `PUT /api/v1/articles/:id`
- `DELETE /api/v1/articles/:id`
- `GET /api/v1/forum-posts`
- `GET /api/v1/forum-posts/:id`
- `POST /api/v1/forum-posts`
- `DELETE /api/v1/forum-posts/:id`
- `POST /api/v1/forum-posts/:id/comments`
- `DELETE /api/v1/forum-comments/:id`
- `GET /api/v1/assessment/questions`
- `POST /api/v1/assessment/submissions`
- `GET /api/v1/assessment/submissions`
- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `PATCH /api/v1/appointments/:id/status`

Implemented backend concerns:

- JWT signing and parsing
- bcrypt password hashing
- role-based checks for article editing and appointment handling
- counselor profile editing with admin/owner checks
- CORS for local frontend development
- soft archive for articles instead of physical delete
- managed article categories with soft disable
- authenticated local image uploads for avatars and article covers
- forum posts and comments with author/admin soft archive
- self-assessment questions, scoring, result interpretation, and submission history

### Frontend

The current first screen is a working product surface, not a landing page.

Implemented:

- login with demo accounts
- counselor list
- counselor profile edit panel for admin/counselor
- counselor avatar upload
- appointment creation
- appointment list
- appointment status operations for admin/counselor
- article list
- article detail
- article create/update/archive panel for admin/counselor
- article cover upload and display
- article category select and category management panel for admin/counselor
- forum post list, post detail, comment list, post creation, and comment creation
- self-assessment question list, score selection, submission, and latest result display
- route-level frontend entry pages for dashboard, counselors, articles, forum, and assessment
- live API integration against the Go service
- split shared frontend workspace basics into `components/platform/*`:
  - shared API base configuration
  - shared domain types and status labels
  - reusable app header
  - reusable dashboard summary cards

### Validation

Recent checks passed:

```powershell
go test ./...
npm run build:web
```

Latest validation on 2026-07-13 covered backend tests and frontend production build after frontend route entry pages were added.

Pending local environment action:

```powershell
# Apply when PostgreSQL is running.
psql "postgres://root:123456@localhost:5432/mental_health?sslmode=disable" -f database/migrations/000002_article_categories.up.sql
psql "postgres://root:123456@localhost:5432/mental_health?sslmode=disable" -f database/migrations/000003_forum.up.sql
psql "postgres://root:123456@localhost:5432/mental_health?sslmode=disable" -f database/migrations/000004_assessments.up.sql
```

Manual API validation completed:

- student login
- counselor login
- appointment create
- appointment approve
- appointment complete
- article create
- article update
- article archive
- public article list still excludes archived validation data

## Important Notes

### GitHub Publish Blocker

GitHub CLI is installed, but it is not authenticated yet:

```text
gh auth status
You are not logged into any GitHub hosts.
```

Run this before publishing from another machine or this machine:

```powershell
gh auth login
```

After login, the repo can be created and pushed with:

```powershell
cd D:\daima\3121010212-next
gh repo create 3121010212-next --private --source . --remote origin --push
```

Use `--public` instead of `--private` only if the project is meant to be public.

### What Is Intentionally Not Committed

Ignored from Git:

- `legacy/`
- `database/legacy-mysql/`
- `.cache/`
- `.env*`
- generated frontend/backend artifacts

Reason: old project files include plaintext DB credentials, token dumps, generated bundles, and large archival assets. Keep them local as migration references unless they are sanitized first.

## Recommended Next Steps

1. Apply pending database migrations on each development machine.
2. Create a clean `.env.local` on each development machine:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080/api/v1
```

3. Add backend run scripts for Windows development.
4. Add structured API packages or sqlc-generated query layer before the API grows much larger.
5. Continue splitting the shared workbench component into smaller feature components:
    - account and appointment sidebar panels
    - counselor and article management panels
    - forum and assessment main content panels
6. Add AI features later:
    - mental health Q&A
    - assessment interpretation
    - article summary
    - content moderation

## Tomorrow Startup Checklist

On the company computer:

1. Clone the GitHub repo.
2. Install Node and Go dependencies.
3. Start or connect PostgreSQL.
4. Apply migrations and seeds.
5. Start the API on `8080`.
6. Start the web app on `3000`.
7. Login with `student-demo`, `counselor-demo`, or `admin`.
