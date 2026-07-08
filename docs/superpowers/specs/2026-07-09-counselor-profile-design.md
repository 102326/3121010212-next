# Counselor Profile Management Design

## Goal

Allow admin and counselor users to edit counselor profile details used by the appointment flow.

## Scope

- Public users continue to list published counselors.
- Admin users can update any counselor profile.
- Counselor users can update only their own linked counselor profile.
- Student users cannot update counselor profiles.
- File upload is out of scope; avatar remains a URL string for now.

## API

- `PUT /api/v1/counselors/:id`
  - Requires `admin` or `counselor`.
  - Body:

```json
{
  "name": "演示咨询师",
  "gender": "女",
  "avatar_url": "",
  "specialty": "情绪管理、校园适应",
  "available_time": "周一至周五 14:00-18:00",
  "phone": "13800000002",
  "bio": "专注学生心理支持与压力管理。"
}
```

## Data Rules

- `name` and `specialty` are required after trimming.
- Optional fields are trimmed and stored as `NULL` when blank.
- `updated_at` is refreshed on update.
- Counselor ownership is checked by `counselors.user_id = token.user_id`, unless the role is `admin`.

## Frontend

Add a compact profile editor for admin and counselor users. Selecting a counselor fills the form. Saving updates the API, refreshes the counselor list, and keeps the selected counselor active.

## Testing

Backend tests cover trimming/validation, unauthenticated update rejection, and student update rejection before database access. Full update behavior is validated through `go test ./...`; database-backed manual validation can be run when PostgreSQL is available.
