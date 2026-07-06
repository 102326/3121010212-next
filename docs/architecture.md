# Architecture

The rebuild keeps the old project as a business reference and starts a new implementation.

## Runtime

```text
Next.js app -> Go Gin API -> PostgreSQL
                         -> LLM API later
```

The first milestone should stay small: auth, article/knowledge CRUD, counselor listing, and appointment booking.

## Backend Boundaries

- `cmd/api`: process entrypoint
- `internal/config`: environment loading
- `internal/http`: Gin router, middleware, handlers
- `internal/storage`: PostgreSQL connection
- `internal/db`: future sqlc generated code

## Frontend Boundaries

Use one Next.js app at first. Keep public pages, account pages, admin pages, and auth pages in route groups once implemented.

```text
app/(public)
app/(account)
app/(admin)
app/(auth)
```
