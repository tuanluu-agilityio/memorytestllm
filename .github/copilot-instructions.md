# Memory Test — project instructions

Vite + React 19 + TypeScript SPA with Tailwind v4, backed by Supabase (Postgres + Auth), deployed on Netlify. Read `.github/memory-bank/` first. It holds the product context, architecture, decisions and current progress.

## Layout
- `src/game/`: the game: `Game.tsx` (screen state machine) and `screens.tsx` (Intro, Presenter, Recall, Results, ErrorCard)
- `src/auth/`: `AuthProvider` (session, `ready`, pending guest-session claim) and `AuthModal`
- `src/pages/`: `History`, `Leaderboard`
- `src/lib/`: `api.ts` (typed RPC wrappers), `scoring.ts` (v0 parsing rules), `supabase.ts`
- `src/config.ts`: timings; `?fast=1` only in dev builds
- `supabase/migrations/`: schema, word bank, RPCs
- `tests/unit`, `tests/integration`, `tests/e2e`, `tests/helpers/admin.ts`
- `legacy/index.v0.html`: original single-file version (visual and copy reference)

## Conventions
- UI copy is English. Keep the v0 card look; v0 CSS lives verbatim in `src/index.css`.
- New data access means a new RPC (security definer, `set search_path = public`, explicit grants), plus an integration test.
- TDD: write the failing test first. Run `npm test`, `npm run test:int` and `npm run e2e` before committing.
- Never expose emails from the database; the display name is the part of the email before `@`.
