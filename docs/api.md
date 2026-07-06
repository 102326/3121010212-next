# API Notes

Base URL: `/api/v1`

Implemented skeleton:

- `GET /healthz`
- `GET /api/v1/meta`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `GET /api/v1/counselors`
- `GET /api/v1/articles`
- `GET /api/v1/articles/{id}`
- `POST /api/v1/articles`
- `PUT /api/v1/articles/{id}`
- `DELETE /api/v1/articles/{id}`
- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `PATCH /api/v1/appointments/{id}/status`

## Auth

Demo users seeded with password `123456`:

- `admin`
- `student-demo`
- `counselor-demo`

Register:

```json
{
  "username": "student-new",
  "password": "123456",
  "display_name": "新学生",
  "phone": "13900000000"
}
```

Login:

```json
{
  "username": "student-demo",
  "password": "123456"
}
```

Use the returned token as:

```text
Authorization: Bearer <token>
```

Create appointment:

```json
{
  "counselor_id": "<uuid>",
  "scheduled_at": "2026-07-05T14:00:00+08:00",
  "content": "最近睡眠不好，想预约咨询。"
}
```

Update appointment status:

```json
{
  "status": "approved"
}
```

Allowed appointment statuses:

- `pending`
- `approved`
- `cancelled`
- `completed`

Only `admin` and `counselor` roles can update appointment status. Counselors can only update appointments assigned to their own counselor profile.
