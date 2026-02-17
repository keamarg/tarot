# Vercel Deployment (Recommended)

## What This Sets Up
- Frontend static app (Vite output from `dist/`)
- Server-side proxy routes under `/api/*` for:
  - `POST /api/anthropic/messages`
  - `GET /api/anthropic/models`
  - `POST /api/openai/chat/completions`
  - `GET /api/openai/models`
  - `GET|POST /api/google/*`
  - `GET /api/health`

The app treats this as server-proxy mode, so provider API keys can stay server-side.

## 1) Create Vercel Project
1. In Vercel, import `keamarg/tarot`.
2. Keep defaults:
  - Framework: `Vite`
  - Build command: `npm run build`
  - Output directory: `dist`

`vercel.json` is already included and sets `VITE_SERVER_PROXY_ENABLED=1`.

## 2) Add Vercel Environment Variables
Add these in Project -> Settings -> Environment Variables:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- Optional: `ALLOWED_ORIGINS`
  - Comma-separated list for cross-origin clients.
  - Example: `https://keamarg.github.io,http://127.0.0.1:4173`

## 3) Deploy
- Trigger a deploy from Vercel (or push to `main` if Git integration is enabled).

## 4) Verify
1. Open `https://<your-vercel-domain>/api/health` -> should return `{ "ok": true }`.
2. Open app settings:
  - API key should be optional (server proxy mode detected).
3. Run a reading/training turn and confirm non-mock responses.

## Optional: Keep GitHub Pages Frontend + Vercel Backend
If you keep the frontend on GitHub Pages:
1. Set GitHub variable `VITE_API_BASE_URL` to your Vercel URL (e.g. `https://<app>.vercel.app`).
2. Set Vercel `ALLOWED_ORIGINS` to include `https://keamarg.github.io`.
