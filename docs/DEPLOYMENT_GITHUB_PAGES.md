# GitHub Pages + Worker Deployment

## Goal
Deploy the UI on GitHub Pages and keep provider keys server-side via a Cloudflare Worker proxy.

## Current Implementation
- Pages workflow: `.github/workflows/deploy-pages.yml`
- Worker workflow: `.github/workflows/deploy-cloudflare-worker.yml`
- Worker source: `worker/src/index.ts`
- Worker routes:
  - `POST /api/anthropic/messages`
  - `GET /api/anthropic/models`
  - `POST /api/openai/chat/completions`
  - `GET /api/openai/models`
  - `GET|POST /api/google/*`

## Frontend Behavior
- If `VITE_API_BASE_URL` is set, app requests go to that base.
- In proxy mode (`VITE_API_BASE_URL` present), live AI can run without entering a client API key.
- If proxy mode is not set and no client key is present, app falls back to mock mode.

## 1. Configure GitHub Pages
1. Push repo to GitHub.
2. In repo Settings -> Pages:
  - Source: `GitHub Actions`.
3. In repo Settings -> Secrets and variables -> Actions -> Variables, set:
  - `VITE_BASE_PATH`
    - project pages: `/<repo-name>/`
    - user/org pages: `/`
  - `VITE_API_BASE_URL`
    - example: `https://oracle-engine-api.<subdomain>.workers.dev`

## 2. Configure Cloudflare Worker
1. Create a Cloudflare account and Worker.
2. Set Worker secrets (CLI or dashboard):
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GOOGLE_API_KEY`
3. Set Worker variable:
  - `ALLOWED_ORIGINS`
    - comma-separated origins, for example:
      - `https://<user>.github.io`
      - `https://<user>.github.io/<repo>/` origin is still `https://<user>.github.io`
      - `http://127.0.0.1:4173` for local dev

### Local Worker Commands
From repo root:
```bash
cd worker
npm install
npm run dev
```

## 3. Configure GitHub Actions For Worker Deploy
In repo Settings -> Secrets and variables -> Actions -> Secrets, set:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Then deploy via:
- push to `main`/`master` with changes under `worker/`, or
- run workflow manually: `Deploy Cloudflare Worker`.

## 4. Verify
1. Wait for both workflows to pass:
  - `Deploy Cloudflare Worker`
  - `Deploy To GitHub Pages`
2. Open deployed Pages URL.
3. In Settings:
  - select provider/model
  - leave API key empty (proxy mode)
4. Run a reading/training turn and confirm live response (not mock).

## Security Notes
- Never put provider keys in GitHub Pages variables.
- Restrict `ALLOWED_ORIGINS` to known origins.
- Add rate limiting at Worker level if abuse appears.
