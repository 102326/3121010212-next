# Assessment Module Design

## Goal

Add a basic mental health self-assessment module with scored questions and result interpretation.

## Scope

- Public users can view active assessment questions.
- Logged-in users can submit answers.
- The API calculates total score, level, and suggestion.
- Logged-in users can view their recent submissions.
- This step does not add clinical diagnosis, AI interpretation, or custom questionnaire management.

## API

- `GET /api/v1/assessment/questions`
  - Returns active questions ordered by `sort_order`.
- `POST /api/v1/assessment/submissions`
  - Requires login.
  - Body: `{ "answers": [{ "question_id": "<uuid>", "score": 2 }] }`.
  - Score range per question: `0` to `4`.
- `GET /api/v1/assessment/submissions`
  - Requires login.
  - Returns the current user's recent submissions.

## Result Rules

- `0-5`: `low`, suggestion says current pressure is relatively low.
- `6-12`: `medium`, suggestion says pay attention to sleep, emotions, and daily rhythm.
- `13+`: `high`, suggestion says consider booking a counselor.

## Frontend

Add a "心理测评" panel to the current work surface:

- List questions with score selectors.
- Submit button for logged-in users.
- Show the latest result after submission.

## Testing

Backend tests cover score interpretation, answer validation, and authentication boundaries. Final verification uses `go test ./...` and `npm run build:web`.
