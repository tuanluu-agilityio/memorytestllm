# Memory Test

A word-recall game (15 words, 1.5 s each) that demonstrates the serial-position (primacy–recency) effect. v1 adds Supabase email/password accounts, server-scored saved sessions, a personal History curve and a public Leaderboard. Deployed to Netlify.

## Commands
- `npm run dev`: Vite dev server on http://localhost:5173 (`/?fast=1` = fast word timings, dev builds only)
- `npm test`: unit tests (Vitest, jsdom)
- `npm run test:int`: integration tests against the real Supabase project (creates + deletes `e2e+…` users)
- `npm run e2e`: Playwright (starts the dev server; `BASE_URL=<url>` to target a deployed site)
- `npm run build`: type-check + production build
- `npm run db:push`: apply `supabase/migrations/*` via Supabase CLI
- `node --env-file=.env.local scripts/sql.mjs "<sql>"`: run SQL via the Management API
- `node --env-file=.env.local scripts/deploy.mjs`: build, deploy to Netlify site `memorytestllm` (https://memorytestllm.netlify.app), set Supabase Auth URLs

## Rules
- Never read, print or commit values from `.env.local`; refer to variables by name only.
- Clients never touch tables: all data access goes through the security-definer RPCs in `supabase/migrations/*_rpc.sql`.
- Keep v0 look and timings (`legacy/index.v0.html` is the reference).
- Netlify: only ever touch the `memorytestllm` site (renamed from `memory-test-tuan` on 2026-10-25).

## Context
@.github/copilot-instructions.md
@.github/memory-bank/projectbrief.md
@.github/memory-bank/productContext.md
@.github/memory-bank/systemPatterns.md
@.github/memory-bank/techContext.md
@.github/memory-bank/activeContext.md
@.github/memory-bank/progress.md
@.github/memory-bank/decisions.md
