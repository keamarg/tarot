# Source of Truth

## Authoritative Files

Treat these as canonical:

- source code
  - `src/**/*.ts`
  - `src/**/*.vue`
- data contracts and prompt assets
  - `data/*.json`
  - `data/prompts/*.md`
- operational scripts
  - `scripts/*.mjs`
- config and runtime wiring
  - `package.json`
  - `vite.config.ts`
  - `tsconfig*.json`

## Non-Authoritative Artifacts

Treat these as generated/secondary:

- `src/**/*.js`
- `src/**/*.d.ts`

Policy:
- do not edit these by default
- if they exist, regenerate from authoritative sources rather than manually patching

## Editing Rules for New Threads

- prefer changes in `.ts` and `.vue` files
- update docs when behavioral contracts change
- verify commands and routes against authoritative config files before proposing changes

## Why This Matters

Without this policy, thread handoffs can drift because agents may:
- patch generated files only
- miss true implementation sources
- produce inconsistent updates across duplicate artifacts

## Update Checklist

Update this file when any of these change:
- file authority policy
- generated artifact handling policy
- build or codegen behavior affecting source ownership
