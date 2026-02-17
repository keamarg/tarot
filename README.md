# Tarot Web App v1

Session-based, local/private-first tarot app built with Vue 3 + Vite + TypeScript.

## Modules

- `Training`: exercise-based tarot skill practice with role modes and hint-first coaching.
- `Reading`: upload-image reading flow and app-drawn spread flow.
- `Settings`: model/API key, quality, reversals, card backs, deterministic seed.

## Tech

- Vue 3, Vue Router, Pinia
- Zod runtime validation
- Anthropic client adapter (browser direct in v1)
- `pdf-lib` reading export
- Vitest unit tests

## Run

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Run tests:

```bash
npm test
```

## Asset Pipeline

Fetch and validate Rider-Waite assets:

```bash
npm run assets:fetch
npm run assets:validate
```

Pipeline scripts:

- `scripts/fetch-rider-waite-assets.mjs`
- `scripts/fetch-card-backs.mjs`
- `scripts/validate-assets.mjs`

## Notes

- v1 is local/private only and stores data in `sessionStorage`.
- API key is not persisted beyond browser session.
- Disclaimer is settings-only and included in PDF metadata text.
- Until card assets are fetched, the UI shows robust card-name fallbacks.

## Deployment

- Vercel (frontend + `/api` proxy):
  - `docs/DEPLOYMENT_VERCEL.md`
- Legacy GitHub Pages notes:
  - `docs/DEPLOYMENT_GITHUB_PAGES.md`
