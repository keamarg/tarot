# Architecture Map

## Directory Map

- `src/app`
  - bootstrapping, router, shell, session storage helpers, shared components
- `src/domain`
  - core types, schemas, cards/spreads/exercises data adapters, draw/random logic
- `src/modules`
  - `home`, `settings`, `training`, `reading`, `export`
- `src/ai`
  - provider adapters (Anthropic/OpenAI/Google), parsers, prompt loader, quality mapping, mock adapter, API-base helper
- `data`
  - cards/spreads/exercises/models JSON + prompt markdown assets
- `scripts`
  - asset fetch + validation pipeline
- `api`
  - Vercel serverless proxy routes for production API routing

## Canonical Entry Points

- app boot: `src/main.ts`
- route map: `src/app/router.ts`
- module views:
  - `src/modules/home/HomeView.vue`
  - `src/modules/settings/SettingsView.vue`
  - `src/modules/training/TrainingView.vue`
  - `src/modules/reading/ReadingView.vue`

## Data Flow

1. Settings flow
- `useSettingsStore` reads/writes `tarot.app.settings` in `sessionStorage`.
- Settings provide model, key, quality, reversal mode, card back preferences.

2. Session draft flow
- `useSessionStore` reads/writes `tarot.app.session` in `sessionStorage`.
- Stores active training and reading drafts (not long-term history).

3. Draw and spread flow
- domain draws from validated card dataset (`data/cards.json`).
- spread geometry from `data/spreads.json` drives board rendering.
- card edits are applied in-module and stored in session draft.

4. AI adapter flow
- module -> adapter factory -> provider adapter or mock adapter.
- adapter builds structured payload and enforces JSON-shaped responses via parsers.
- if server proxy mode is enabled (`VITE_SERVER_PROXY_ENABLED=1` or `VITE_API_BASE_URL` configured), live calls route through proxy endpoints.

5. Export flow
- reading view composes output and card/spread state.
- export module renders client-side PDF via `pdf-lib`.

## Integration Contracts (High-Level)

- training turn: exercise + role + draw mode + cards + user message -> structured assistant response
- reading detection: image -> spread guess + confidence + editable card list
- reading generation: spread slots + cards -> position-by-position output + synthesis

## Update Checklist

Update this file when any of these change:
- directory layout under `src`, `data`, or `scripts`
- entry points or routes
- store keys/data flow
- adapter/data contract behavior
- export pipeline behavior
