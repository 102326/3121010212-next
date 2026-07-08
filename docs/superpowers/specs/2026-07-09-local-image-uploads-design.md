# Local Image Uploads Design

## Goal

Add authenticated local image uploads for counselor avatars and article covers.

## Scope

- Logged-in users can upload image files through the API.
- Supported file types: JPEG, PNG, WebP, and GIF.
- Maximum file size: 5 MB.
- Uploaded files are stored under the project-local `uploads/` directory.
- Uploaded files are served back from `/uploads/<filename>`.
- The frontend can use returned URLs for counselor `avatar_url` and article `cover_url`.

## API

- `POST /api/v1/uploads`
  - Requires `Authorization: Bearer <token>`.
  - Accepts `multipart/form-data` with field name `file`.
  - Returns:

```json
{
  "url": "/uploads/20260709-150405-example.png",
  "filename": "20260709-150405-example.png"
}
```

## Storage Rules

- Do not commit uploaded files.
- Create `uploads/.gitkeep` so the folder exists in fresh clones.
- Use generated filenames to avoid collisions and path traversal.
- Reject files by detected content type, not only by extension.

## Frontend

- The counselor profile panel gets an avatar upload input.
- The article editor gets a cover upload input.
- Upload success fills the corresponding URL field automatically.

## Testing

Backend tests cover filename sanitization, allowed image type detection, rejected non-image content, missing auth, and oversized upload handling.
