# Active context

**Current state**: v1 is implemented on branch `feat/v1`, with all tests passing, and live at https://memory-test-tuan.netlify.app. Redeploy with `node --env-file=.env.local scripts/deploy.mjs`.

**Suggested next steps**
1. Merge `feat/v1` into `main`.
2. Before inviting real users, turn email confirmation back on (requires a Site URL and an e2e strategy for confirmation).
3. Add password reset.
4. Purge abandoned guest sessions (e.g. older than 1 day and unclaimed) with a scheduled job.
5. Consider a minimum-duration check on `submit_session` (needs a server-trusted way to exempt e2e).
