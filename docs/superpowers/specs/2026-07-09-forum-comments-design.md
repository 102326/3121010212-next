# Forum Comments Design

## Goal

Add a simple community discussion module with posts and comments.

## Scope

- Public users can list and read published posts and comments.
- Logged-in users can create posts and comments.
- Post authors and admin users can archive posts.
- Comment authors and admin users can archive comments.
- Editing posts and comments is out of scope for this step.

## API

- `GET /api/v1/forum-posts`
  - Lists published posts with author display name and comment count.
- `GET /api/v1/forum-posts/:id`
  - Returns one published post with published comments.
- `POST /api/v1/forum-posts`
  - Requires login.
  - Body: `{ "title": "最近如何缓解压力？", "content": "想听听大家的办法。" }`.
- `DELETE /api/v1/forum-posts/:id`
  - Requires login.
  - Author or admin only.
- `POST /api/v1/forum-posts/:id/comments`
  - Requires login.
  - Body: `{ "content": "我会先规律睡眠。" }`.
- `DELETE /api/v1/forum-comments/:id`
  - Requires login.
  - Author or admin only.

## Data Model

Add `forum_posts` and `forum_comments`.

Both tables use `publish_status` for soft archive. Comments are deleted from public view by setting `status = 'archived'`.

## Frontend

Add a compact "交流社区" section to the current work surface:

- Post list
- Selected post detail
- Create post form for logged-in users
- Comment list and comment form for logged-in users
- Delete buttons for admin and own content where ownership can be determined from API response

## Testing

Backend tests cover request normalization plus auth boundaries that do not need database access. Full backend and frontend verification is `go test ./...` and `npm run build:web`.
