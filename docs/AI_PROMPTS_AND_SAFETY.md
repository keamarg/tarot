# AI Prompts and Safety

## Prompt Asset Index

- `data/prompts/guiding-philosophy.md`
- `data/prompts/training.md`
- `data/prompts/reading-upload.md`
- `data/prompts/reading-app-draw.md`
- `data/prompt-manifest.json`

## Guiding Philosophy (Project Default)

- tarot is read as symbolic language in context, not fixed keyword lookup
- interpretation quality favors reasoning and relational meaning
- responses stay grounded, non-fatalistic, and practical
- user agency and reflective guidance are prioritized

## Safety and Guardrails

- soft guardrails for health/legal/financial topics
- concise non-professional framing where needed
- avoid deterministic claims and fear framing

## Adapter Behavior

Primary adapter:
- `src/ai/anthropicAdapter.ts`
- parses structured model output through Zod-based parsers in `src/ai/parsers.ts`

Dev routing behavior:
- in dev, adapter target: `/api/anthropic/messages`
- proxy mapping in `vite.config.ts` rewrites to `/v1/messages`

Fallback behavior:
- mock mode when API key is missing (`src/ai/mockAdapter.ts`)
- keeps Training/Reading flows testable without live model access

## Quality Presets

- mapped in `src/ai/quality.ts` (`low`, `standard`, `high`)
- used to constrain `max_tokens`

## Update Checklist

Update this file when any of these change:
- prompt files or philosophy statements
- safety behavior or policy tone
- adapter routing behavior
- mock fallback behavior
- quality preset mapping
