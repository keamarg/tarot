# Thread Bootstrap

Use this file as the first and only context payload when starting a new Codex thread for this repo.

## Paste-Ready Prompt

```text
You are joining an existing Vue 3 tarot application project.

Read these files in order before proposing changes:
1) docs/PROJECT_CONTEXT.md
2) docs/ARCHITECTURE_MAP.md
3) docs/WORKFLOWS_RUNBOOK.md
4) docs/AI_PROMPTS_AND_SAFETY.md
5) docs/SOURCE_OF_TRUTH.md
6) docs/KNOWN_ISSUES.md
7) docs/ACTIVE_BACKLOG.md
8) docs/CHANGE_CHECKLIST.md

Constraints to honor:
- Local/private app only in v1.
- Session-based state and settings.
- In dev, provider calls use Vite proxy routes under `/api/*`.
- Optional production mode uses `VITE_API_BASE_URL` + server proxy.
- `.ts` and `.vue` files are source of truth; generated `.js`/`.d.ts` under `src` are not authoritative.

When done reading, summarize:
- current architecture
- current known issues
- proposed implementation steps
Then proceed with code changes.
```

## Reading Order

1. `docs/PROJECT_CONTEXT.md`
2. `docs/ARCHITECTURE_MAP.md`
3. `docs/WORKFLOWS_RUNBOOK.md`
4. `docs/AI_PROMPTS_AND_SAFETY.md`
5. `docs/SOURCE_OF_TRUTH.md`
6. `docs/KNOWN_ISSUES.md`
7. `docs/ACTIVE_BACKLOG.md`
8. `docs/CHANGE_CHECKLIST.md`

## Do First Checklist

- Confirm route map from `src/app/router.ts`.
- Confirm scripts from `package.json`.
- Confirm dev proxy from `vite.config.ts`.
- Confirm source-of-truth policy in `docs/SOURCE_OF_TRUTH.md`.

## Core Constraints

- Runtime: local/private-first.
- Persistence: `sessionStorage` only for settings and drafts.
- AI providers: Anthropic/OpenAI/Google, with dev proxy routes.
- Optional production proxy via `VITE_API_BASE_URL`.
- Exports: client-side PDF with `pdf-lib`.

## Update Checklist

Update this file when any of these change:
- primary reading order for context docs
- dev proxy route or provider policy
- source-of-truth policy
- v1 constraints that new threads must enforce
