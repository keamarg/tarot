# GitHub Pages + External Proxy Deployment

## Goal
Deploy the UI on GitHub Pages and keep provider keys server-side via an external proxy (Vercel recommended).

## Current Implementation
- Pages workflow: `.github/workflows/deploy-pages.yml`
- External proxy routes expected by frontend:
  - `POST /api/anthropic/messages`
  - `GET /api/anthropic/models`
  - `POST /api/openai/chat/completions`
  - `GET /api/openai/models`
  - `GET|POST /api/google/*`

## Frontend Behavior
- If `VITE_API_BASE_URL` is set, app requests go to that base URL.
- In proxy mode, live AI can run without entering a client API key.
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
    - example: `https://<your-vercel-app>.vercel.app`

## 2. Configure External Proxy
Use `docs/DEPLOYMENT_VERCEL.md` for the recommended path.

At minimum:
- Set provider secrets server-side:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GOOGLE_API_KEY`
- Allow GitHub Pages origin if cross-origin calls are blocked:
  - `ALLOWED_ORIGINS=https://<user>.github.io,http://127.0.0.1:4173`

## 3. Verify
1. Wait for `Deploy To GitHub Pages` workflow to pass.
2. Open deployed Pages URL.
3. In Settings:
  - select provider/model
  - leave API key empty (proxy mode)
4. Run a reading/training turn and confirm live response (not mock).

## Security Notes
- Never put provider keys in GitHub Pages variables.
- Restrict `ALLOWED_ORIGINS` to known origins.
- Add rate limiting at proxy level if abuse appears.
