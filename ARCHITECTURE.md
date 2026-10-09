# Yawar AI — Architecture and Extension Plan

## Request flow

1. Browser sends a message to `POST /api/chat`.
2. `chatRoutes` validates the request and retrieves up to five matching knowledge articles.
3. `AIService` combines the system instruction, a small recent history, and the article context.
4. The server calls the configured AI provider using a secret stored in its environment.
5. The browser renders the response as plain text.

## Keep responsibilities separate

- `routes/`: HTTP input/output and request validation.
- `services/`: business logic and integrations.
- `models/`: data validation.
- `middleware/`: cross-cutting request behavior.
- `public/`: browser-only assets.
- `tests/`: automated checks.

## Sensible next milestones

1. Add tests for `/api/chat` with a mocked AI service.
2. Add persistent storage (SQLite for a small single-instance project, PostgreSQL for a larger hosted app).
3. Add authentication and a shared rate limiter before public release.
4. Replace keyword article matching with retrieval-augmented generation (RAG) if the knowledge base grows.
5. Add tools as separate, permission-checked services. Do not let model output execute arbitrary shell commands or database queries.
6. Add logs and metrics without logging secrets or sensitive message contents.

## API contract

`POST /api/chat`

Request:
```json
{
  "message": "What do my notes say about networking?",
  "history": [
    { "role": "user", "content": "Earlier question" },
    { "role": "assistant", "content": "Earlier answer" }
  ]
}
```

Success response:
```json
{
  "reply": "Assistant response",
  "knowledgeUsed": [
    { "id": "article-id", "title": "Networking Basics" }
  ]
}
```

The history is untrusted user input. The service accepts only user/assistant roles and truncates content length.
