# Progress

## Done (v1, 2026-10-25)
- Vite + React + TS + Tailwind port of v0, with identical look and timings
- Supabase schema, word bank (300 words, 10 topics), server-scored RPCs
- Email/password auth, guest-result claiming, auto-save for logged-in players
- History (personal curve + games list) and public Leaderboard
- Tests: unit (Vitest), integration against real Supabase, e2e (Playwright)
- AI context: `CLAUDE.md`, `.github/` instructions, agents, memory bank

- Deployed to Netlify: https://memory-test-tuan.netlify.app (2026-10-25; `/`, `/history`, `/leaderboard` return 200; live leaderboard e2e passes)

## Known gaps (accepted)
- No minimum-time anti-cheat; words are visible in the network tab.
- No password reset; email confirmation is off.
- Guest sessions that are never claimed are not purged.
