# Active context

**Current state**: v1 is implemented on branch `feat/v1`, with all unit, integration and e2e tests passing locally. The Netlify deploy is blocked because the Netlify token returned 401 during execution. Once a new `NETLIFY_AUTH_TOKEN` is in `.env.local`, run `node --env-file=.env.local scripts/deploy.mjs`.

**Suggested next steps**
1. Deploy, then verify `/`, `/history` and `/leaderboard` return 200, and run `BASE_URL=<url> npx playwright test pages -g leaderboard`.
2. Before inviting real users, turn email confirmation back on (requires a Site URL and an e2e strategy for confirmation).
3. Add password reset.
4. Purge abandoned guest sessions (e.g. older than 1 day and unclaimed) with a scheduled job.
5. Consider a minimum-duration check on `submit_session` (needs a server-trusted way to exempt e2e).
