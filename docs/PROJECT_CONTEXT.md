# Project Context

## Purpose

Tarot Web App v1 is a session-based Vue application for:
- tarot training exercises
- tarot readings from uploaded spread images or app-drawn spreads
- local/private usage with configurable Anthropic model access

## Scope (In)

- Training module with role modes and hint-first coaching.
- Reading module with upload + app-draw flows.
- Settings module for model/API key/quality/reversal/card backs.
- PDF export for completed readings.
- Asset pipeline for Rider-Waite card images and card backs.

## Non-Goals (v1)

- No required backend or database for local usage.
- No persistent backend storage/database.
- No multi-user auth.
- No persistent cross-session history beyond browser session storage.
- No production-grade deployment hardening.

## Stack

- Vue 3 + Vite + TypeScript
- Pinia + Vue Router
- Zod for runtime schema validation
- `pdf-lib` for client-side PDF generation
- Vitest for unit tests

## Runtime Constraints

- App is local/private-first.
- API key is stored in `sessionStorage` (per browser session).
- In dev, Anthropic calls use Vite proxy endpoint `/api/anthropic/messages`.
- Optional production profile uses `VITE_API_BASE_URL` with a server-side proxy.

## Module Boundaries

- `Training`: exercise selection, role mode, draw mode, transcript.
- `Reading`: upload detection/edit flow + app-draw flow.
- `Settings`: provider/model/key/quality/reversal/back customization.
- `Export`: PDF generator for reading snapshots and interpretation output.

## Update Checklist

Update this file when any of these change:
- project purpose/scope
- non-goals
- tech stack
- runtime constraints
- top-level module definitions
