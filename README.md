# Yawar Knowledge Center

A modular Express REST API for managing knowledge articles. It includes input validation, API-key protection for write operations, security headers via Helmet, graceful shutdown, a Dockerfile, and GitHub Actions CI.

## Features

- Full CRUD for articles (`/api/articles`)
- Filtering by tag and free-text search
- Input validation with clear error details
- API-key protection for create, update, and delete (`x-api-key` header)
- Health check at `/health`
- Node built-in test runner, no extra test dependencies
- Docker support and CI across Node 18, 20, and 22

## Project structure

```
yawar-knowledge-center/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── config/
│   │   └── index.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   └── article.js
│   ├── routes/
│   │   └── articleRoutes.js
│   ├── services/
│   │   └── articleService.js
│   ├── utils/
│   │   └── httpError.js
│   ├── app.js
│   └── index.js
├── tests/
│   └── articles.test.js
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

## Getting started

Requirements: Node.js 18 or newer.

```bash
git clone https://github.com/<your-username>/yawar-knowledge-center.git
cd yawar-knowledge-center
cp .env.example .env        # then set API_KEY to a long random string
npm install
npm run dev                 # development with auto-reload
```

Run tests:

```bash
npm test
```

## API reference

| Method | Endpoint             | Auth | Description                          |
| ------ | -------------------- | ---- | ------------------------------------ |
| GET    | `/health`            | No   | Service status                       |
| GET    | `/api/articles`      | No   | List articles (`?tag=` and `?search=`) |
| GET    | `/api/articles/:id`  | No   | Get one article                      |
| POST   | `/api/articles`      | Yes  | Create an article                    |
| PATCH  | `/api/articles/:id`  | Yes  | Update fields of an article          |
| DELETE | `/api/articles/:id`  | Yes  | Delete an article                    |

Protected routes require the header `x-api-key: <your API_KEY>`.

Example:

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"title":"Getting started","content":"Welcome to the knowledge base.","tags":["intro"]}'
```

## Docker

```bash
docker build -t yawar-knowledge-center .
docker run --rm -p 3000:3000 --env-file .env yawar-knowledge-center
```

## Notes for production

- Storage is in memory, so data resets on restart. Replace `ArticleService` with a database adapter (PostgreSQL, MongoDB, etc.) without changing the routes.
- Generate and commit a `package-lock.json` (`npm install`) so builds are reproducible. CI can then switch to `npm ci`.
- Use a long random `API_KEY` and keep `.env` out of version control.

## License

MIT

## Yawar AI chat interface (added)

This version adds a browser chat UI and an OpenAI-compatible model adapter while preserving the existing article API.

### New files

- `public/index.html`, `public/style.css`, `public/script.js` — responsive chat interface.
- `src/services/aiService.js` — server-side AI provider adapter.
- `src/routes/chatRoutes.js` — `POST /api/chat` endpoint, input checks, and basic per-process rate limiting.
- `src/config.js` — environment configuration.

### Run locally

1. Install Node.js 18 or later.
2. Copy `.env.example` to `.env`.
3. Set `AI_API_KEY` to a valid key from your chosen AI provider. Keep this key private.
4. Optionally set `AI_BASE_URL` and `AI_MODEL` to match an OpenAI-compatible provider.
5. Run `npm install`, then `npm start`.
6. Open `http://localhost:3000`.

The chat UI and API are served by the same Express server. GitHub Pages alone cannot run this backend; deploy the Node.js server to a backend host and use its URL for your app.

### Important limits and security notes

- The API key belongs only in the backend environment, never in `public/` or client-side JavaScript.
- The article service currently uses in-memory storage. Articles are not durable across restarts; add a database adapter before relying on it for long-term storage.
- Chat history is kept in the browser memory only and resets when the page is refreshed.
- The included in-memory rate limiter is a starter safeguard, not a substitute for a shared production rate limiter.
- The assistant can use matching saved articles as context, but this is simple keyword retrieval rather than a full vector-search/RAG pipeline.
- Before public deployment, configure a strong `API_KEY`, provider spending limits, monitoring, and a production-grade rate limiter. Consider authentication for chat endpoints to prevent unauthorized use.
