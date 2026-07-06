# Migration Plan

## Phase 1

1. Create modern project skeleton.
2. Archive old Java SSM source under `legacy/3121010212-java`.
3. Keep original MySQL SQL under `database/legacy-mysql`.
4. Implement PostgreSQL schema for users, articles, counselors, appointments.
5. Build auth and the appointment demo flow.

## Phase 2

Migrate useful modules from the old project in this order:

1. User and role permissions
2. Counselor profile management
3. Appointment management
4. Health knowledge
5. News/articles
6. Favorites
7. Forum and comments
8. Assessment/exam
9. File upload
10. Admin configuration

## Phase 3

Add AI features through the Go API first:

- AI mental-health Q&A
- Assessment result explanation
- Article summaries
- Forum/comment moderation
- Consultation question preparation

Only introduce Python FastAPI when RAG, embeddings, recommendation jobs, or local model inference becomes necessary.
