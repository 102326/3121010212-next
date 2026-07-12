# API Notes

Base URL: `/api/v1`

Implemented skeleton:

- `GET /healthz`
- `GET /api/v1/meta`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `GET /api/v1/counselors`
- `PUT /api/v1/counselors/{id}`
- `GET /api/v1/article-categories`
- `POST /api/v1/article-categories`
- `PUT /api/v1/article-categories/{id}`
- `DELETE /api/v1/article-categories/{id}`
- `POST /api/v1/uploads`
- `GET /api/v1/articles`
- `GET /api/v1/articles/{id}`
- `POST /api/v1/articles`
- `PUT /api/v1/articles/{id}`
- `DELETE /api/v1/articles/{id}`
- `GET /api/v1/forum-posts`
- `GET /api/v1/forum-posts/{id}`
- `POST /api/v1/forum-posts`
- `DELETE /api/v1/forum-posts/{id}`
- `POST /api/v1/forum-posts/{id}/comments`
- `DELETE /api/v1/forum-comments/{id}`
- `GET /api/v1/assessment/questions`
- `POST /api/v1/assessment/submissions`
- `GET /api/v1/assessment/submissions`
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

## Counselors

List published counselors:

```text
GET /api/v1/counselors
```

Update a counselor profile. Requires `admin` or `counselor`. Admin can update any counselor; counselors can update only their own linked profile:

```text
PUT /api/v1/counselors/{id}
```

Request:

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

`name` and `specialty` are required. Optional fields are stored as empty values in responses when unset.

## Uploads

Upload an image file. Requires login:

```text
POST /api/v1/uploads
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Form field:

```text
file=<image file>
```

Allowed image types:

- JPEG
- PNG
- WebP
- GIF

Maximum file size is 5 MB.

Response:

```json
{
  "filename": "20260709-150405-a1b2c3d4e5f60708.png",
  "url": "/uploads/20260709-150405-a1b2c3d4e5f60708.png"
}
```

The returned URL can be saved into `counselors.avatar_url` or `articles.cover_url`.

## Forum

List published posts:

```text
GET /api/v1/forum-posts
```

Load a post with comments:

```text
GET /api/v1/forum-posts/{id}
```

Create a post. Requires login:

```json
{
  "title": "最近如何缓解压力？",
  "content": "想听听大家的办法。"
}
```

Archive a post. Requires login; only the author or admin can archive it:

```text
DELETE /api/v1/forum-posts/{id}
```

Create a comment. Requires login:

```json
{
  "content": "我会先规律睡眠。"
}
```

Archive a comment. Requires login; only the author or admin can archive it:

```text
DELETE /api/v1/forum-comments/{id}
```

## Assessment

List active assessment questions:

```text
GET /api/v1/assessment/questions
```

Submit a self-assessment. Requires login:

```json
{
  "answers": [
    {
      "question_id": "<uuid>",
      "score": 2
    }
  ]
}
```

Each score must be between `0` and `4`.

Response:

```json
{
  "submission": {
    "id": "<uuid>",
    "total_score": 8,
    "level": "medium",
    "suggestion": "近期需要关注睡眠、情绪和日常节奏，可以尝试记录压力来源并主动调整。"
  }
}
```

List current user's recent submissions:

```text
GET /api/v1/assessment/submissions
```

## Article Categories

List enabled categories:

```text
GET /api/v1/article-categories
```

Response:

```json
{
  "categories": [
    {
      "id": "<uuid>",
      "name": "心理科普",
      "is_active": true
    }
  ]
}
```

Create or re-enable a category. Requires `admin` or `counselor`:

```json
{
  "name": "睡眠管理"
}
```

Rename a category. Requires `admin` or `counselor`:

```text
PUT /api/v1/article-categories/{id}
```

Disable a category. Requires `admin` or `counselor`; records are soft-disabled with `is_active = false`:

```text
DELETE /api/v1/article-categories/{id}
```

Article create and update requests still accept the existing `category` string field for compatibility.
