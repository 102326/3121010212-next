# 3121010212-next

Modernized rebuild of the original `3121010212` Java SSM graduation project.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-compatible components
- Backend: Go, Gin, pgx
- Database: PostgreSQL, golang-migrate SQL migrations
- Future AI: Go calling LLM APIs first, optional Python FastAPI service for RAG later

## Layout

```text
apps/web        Next.js app for public pages, account area, and admin
services/api    Go Gin API
database        PostgreSQL migrations, seeds, legacy MySQL reference
docs            Architecture and migration notes
legacy          Archived old Java SSM project
```

## Local Start

Existing local infrastructure is expected at:

```text
C:\Ubuntu\huanjing\componse\PostgreSQL
```

That Compose stack exposes PostgreSQL on `localhost:5432` with the default local credentials from its `.env`.

```powershell
cd D:\daima\3121010212-next
npm install
npm run dev:web

cd services\api
$env:HTTP_ADDR=":8080"
$env:DATABASE_URL="postgres://root:123456@localhost:5432/mental_health?sslmode=disable"
go run .\cmd\api
```

The API can start without `DATABASE_URL`, but `/healthz` will report `degraded`.
