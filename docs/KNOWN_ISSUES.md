# Known Issues

## 1) Generated Artifacts in `src`

Status: active

- issue: checked-in generated `.js` and `.d.ts` files exist alongside source `.ts`/`.vue` files
- impact: thread agents can edit wrong files or misread source of truth
- root cause: TypeScript build outputs were emitted into source tree
- workaround: treat `.ts` and `.vue` as authoritative; avoid editing generated artifacts
- desired fix: move generated outputs out of `src` (or stop checking them in)

## 2) Browser-Direct Anthropic Calls Are Fragile

Status: mitigated in dev

- issue: direct browser requests can fail with preflight/CORS behavior depending on request headers/origin
- impact: Training/Reading live AI appears broken
- root cause: browser CORS constraints and preflight requirements on cross-origin API calls
- workaround: use Vite dev proxy route `/api/anthropic/messages`
- desired fix: add backend proxy/service layer for production-safe architecture

## 3) Local/Session-Only Persistence

Status: accepted v1 limitation

- issue: settings/drafts disappear when browser session is cleared/closed
- impact: no durable user history
- root cause: v1 intentionally avoids backend/database
- workaround: export readings to PDF for persistence
- desired fix: optional backend persistence in a later phase

## 4) Card Asset Source Fragility

Status: operational risk

- issue: upstream card image source availability can change
- impact: asset refresh pipeline can break
- root cause: dependence on external website structure
- workaround: keep existing validated local assets committed and run `assets:validate`
- desired fix: add mirrored/controlled asset source with integrity checks

## Update Checklist

Update this file when any of these change:
- known bugs/risks
- workaround steps
- desired fix direction
- issue status (active, mitigated, accepted)
