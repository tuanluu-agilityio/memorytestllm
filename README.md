# Memory Test

A word-recall game that demonstrates the **serial-position effect** (primacy–recency). You see 15 random words, one at a time (1.5 s each), then type every word you remember. The results show which positions you recalled, and explain how the same U-shaped curve shows up in LLM context windows.

**Live:** https://memory-test-tuan.netlify.app

## Features

- **Play as a guest**, exactly like the original single-file version (`legacy/index.v0.html`).
- **Save your result**: after a game, a modal offers to log in or sign up (email + password). The game you just played is saved to your account.
- **History**: your personal serial-position curve across all your games, plus a list of past games.
- **Leaderboard**: the public top 20, ranked by each player's best score.
- Words are picked at random from a 300-word bank across 10 topics, and **scored on the server**, so players can't submit their own score.

## Tech stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · react-router · Supabase (Postgres + Auth) · Vitest · Playwright · Netlify

## Getting started

Requirements: Node 24+ and a Supabase project.

```bash
npm install
```

Create `.env.local` in the project root. It is git-ignored; never commit it.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=
SUPABASE_DB_PASSWORD=
NETLIFY_AUTH_TOKEN=
```

Apply the database migrations, then start the dev server:

```bash
npm run db:push
npm run dev            # http://localhost:5173  (add ?fast=1 for fast word timings in dev)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Type-check + production build into `dist/` |
| `npm test` | Unit tests (Vitest, jsdom) |
| `npm run test:int` | Integration tests against the real Supabase project (creates and deletes `e2e+…@example.com` users) |
| `npm run e2e` | Playwright end-to-end tests (`BASE_URL=<url>` targets a deployed site) |
| `npm run db:push` | Apply `supabase/migrations/*` with the Supabase CLI |
| `node --env-file=.env.local scripts/deploy.mjs` | Build, deploy to Netlify, and set the Supabase Auth URLs |

## Project structure

```
src/
  game/        Game state machine and screens (intro → present → recall → results)
  auth/        AuthProvider (session, guest-result claim) and AuthModal
  pages/       History, Leaderboard
  lib/         Typed RPC wrappers, scoring rules, Supabase client
supabase/migrations/   Schema, word bank, security-definer RPCs
tests/         unit / integration / e2e
scripts/       deploy and SQL helpers
legacy/        Original v0 single-file game (visual reference)
```

## How data is protected

Row-level security is on and no table grants are given, so clients can never read or write tables directly. All data access goes through security-definer RPCs (`start_session`, `submit_session`, `claim_session`, `get_leaderboard`, …). The leaderboard shows only the part of the email before `@`; full emails are never returned.

## For AI assistants

Project context lives in `CLAUDE.md` and `.github/` (`copilot-instructions.md`, `instructions/`, `agents/` and `memory-bank/`). Read the memory bank before making changes.
