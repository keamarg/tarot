# Active Backlog

## Must Fix

- `[MUST][Open]` Separate generated artifacts from source tree.
  - target: stop treating `src/**/*.js` and `src/**/*.d.ts` as first-class files
  - outcome: reduce accidental edits and context ambiguity

- `[MUST][Done]` Add production-safe API architecture note and transition plan.
  - outcome: documented GitHub Pages + Cloudflare Worker deployment path in `docs/DEPLOYMENT_GITHUB_PAGES.md`

## Quality Improvements

- `[QUALITY][Open]` Add integration tests for adapter parse contracts.
  - target: malformed model output handling and error messaging

- `[QUALITY][Open]` Add manual QA checklist for reading upload card-edit flow.
  - target: ensure edit/regenerate remains reliable after UI changes

- `[QUALITY][Open]` Improve docs discoverability from `README.md`.
  - target: add explicit link to docs pack and bootstrap file

## Future Enhancements

- `[FUTURE][Open]` Introduce optional backend persistence for reading/training history.
- `[FUTURE][Open]` Expand spread catalog beyond core 5 spreads.
- `[FUTURE][Open]` Add richer E2E test coverage (Playwright) for major user journeys.

## Documentation Maintenance Tasks

- `[DOCS][Always]` Run through `docs/CHANGE_CHECKLIST.md` on any behavior change.
- `[DOCS][Always]` Keep `docs/THREAD_BOOTSTRAP.md` concise and up-to-date for handoff.

## Update Checklist

Update this file when any of these change:
- current priorities
- issue severity or status
- roadmap sequencing
- documentation maintenance expectations
