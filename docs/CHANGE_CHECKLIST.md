# Change Checklist

Use this after any code change to keep docs in sync.

## Change Type -> Docs to Update

- runtime or scope changes
  - update `docs/PROJECT_CONTEXT.md`
  - update `docs/THREAD_BOOTSTRAP.md` if handoff constraints changed

- route/module/component topology changes
  - update `docs/ARCHITECTURE_MAP.md`

- command/script or troubleshooting changes
  - update `docs/WORKFLOWS_RUNBOOK.md`

- prompt/safety/adapter behavior changes
  - update `docs/AI_PROMPTS_AND_SAFETY.md`
  - update `docs/THREAD_BOOTSTRAP.md` if startup guidance changed

- newly discovered bug/risk
  - update `docs/KNOWN_ISSUES.md`
  - update `docs/ACTIVE_BACKLOG.md` priority/status

- source ownership/build artifact policy changes
  - update `docs/SOURCE_OF_TRUTH.md`
  - update `docs/THREAD_BOOTSTRAP.md`

- roadmap/priorities changed
  - update `docs/ACTIVE_BACKLOG.md`

## Example Mapping

- changed prompt behavior:
  - `docs/AI_PROMPTS_AND_SAFETY.md`
  - `docs/THREAD_BOOTSTRAP.md`

- added new npm script:
  - `docs/WORKFLOWS_RUNBOOK.md`
  - optionally `docs/PROJECT_CONTEXT.md` if it changes delivery model

## Quick Validation Pass

Before closing a task:
- verify command snippets still match `package.json`
- verify proxy or route notes still match `vite.config.ts` and `src/app/router.ts`
- verify known issues reflect current reality
- verify backlog statuses are current

## Update Checklist

Update this file when any of these change:
- documentation ownership model
- cross-file update mapping rules
- release/handoff validation expectations
