# Article Categories Design

## Goal

Add first-class article category management so health articles use managed categories instead of free-text category input.

## Scope

- Public users can list enabled article categories.
- Admin and counselor users can create, rename, and disable categories.
- Articles continue to store a `category_id`.
- Article create and update requests accept a category name for compatibility, but the frontend should choose from managed categories.

## API

- `GET /api/v1/article-categories`
  - Returns enabled categories ordered by name.
- `POST /api/v1/article-categories`
  - Requires `admin` or `counselor`.
  - Body: `{ "name": "心理科普" }`.
  - Creates or re-enables a category with the trimmed name.
- `PUT /api/v1/article-categories/:id`
  - Requires `admin` or `counselor`.
  - Body: `{ "name": "睡眠管理" }`.
  - Renames the category.
- `DELETE /api/v1/article-categories/:id`
  - Requires `admin` or `counselor`.
  - Soft-disables the category with `is_active = false`.

## Data Model

Add to `article_categories`:

- `is_active BOOLEAN NOT NULL DEFAULT TRUE`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Existing categories stay active after migration.

## Frontend

The article editor should load categories on startup and after category changes. The category field becomes a select. A compact category management area lets admin and counselor users add, rename, and disable categories without leaving the current work surface.

## Testing

Backend route tests should cover unauthenticated and student users being rejected before database access. Pure helper tests should cover category name trimming and validation. Full database behavior is verified by `go test ./...` plus local API checks after the migration is applied.
