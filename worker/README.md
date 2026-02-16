# Oracle Engine API Worker

Cloudflare Worker proxy for provider APIs used by the frontend.

## Routes

- `POST /api/anthropic/messages`
- `GET /api/anthropic/models`
- `POST /api/openai/chat/completions`
- `GET /api/openai/models`
- `GET|POST /api/google/*`
- `GET /health`

## Required Secrets

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`

## Optional Vars

- `ALLOWED_ORIGINS`
  - comma-separated browser origins allowed for CORS
  - example: `https://<user>.github.io,http://127.0.0.1:4173`

## Commands

```bash
npm install
npm run dev
npm run deploy
```
