# Workflows Runbook

## Standard Commands

From repo root (`/Users/martin/Documents/New project`):

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4173
npm test
npm run build
npm run assets:fetch
npm run assets:validate
```

Vercel proxy routes live under `api/*` and run in deployment (no extra local command required for normal frontend dev).

## Primary Manual Test Paths

1. Training flow
- open `/training`
- select active exercise
- toggle role + draw mode
- draw or enter cards
- send prompt and verify structured AI response

2. Reading upload flow
- open `/reading` -> setup modal -> choose spread -> click `Upload Image`
- upload one spread image from setup
- wait for automatic spread/card detection
- edit detected cards as needed
- click Regenerate Reading

3. Reading app-draw flow
- open `/reading` -> setup modal -> select spread -> `Start Reading`
- draw cards
- regenerate reading

4. PDF export flow
- generate a reading
- download PDF
- verify spread image/card breakdown/synthesis content exists

## Troubleshooting Playbooks

### Anthropic preflight/CORS issues

Symptoms:
- browser reports CORS preflight or `Disallowed CORS origin`

Expected v1 behavior:
- dev requests use local proxy route `/api/anthropic/messages`
- Vite proxy forwards to `https://api.anthropic.com/v1/messages`

Checks:
- confirm `vite.config.ts` has proxy route
- confirm adapter uses proxy route in dev
- restart dev server after config changes
- hard refresh browser

### Asset validation failures

Symptoms:
- `npm run assets:validate` reports missing or invalid files

Checks:
- run `npm run assets:fetch`
- run `npm run assets:validate`
- verify `public/cards` has 78 card images
- verify `public/backs` has `original.webp` and `centennial.webp`

## Operational Notes

- keep `assets:validate` green before handing off tasks that depend on card images
- keep `build` and `test` green before major merges or handoffs

## Update Checklist

Update this file when any of these change:
- npm scripts/commands
- manual verification steps
- troubleshooting procedures
- proxy or asset pipeline behavior
