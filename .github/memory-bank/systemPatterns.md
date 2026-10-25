# System patterns

- **Server-authoritative sessions.** `start_session(p_show_ms)` picks 15 random words (mixed topics) and returns `{session_id, claim_token, words}`. `submit_session(id, token, typed)` scores on the server with v0 parsing rules (lowercase, split on `[\s,;]+`, keep a–z) and accepts one submission only.
- **Ownership** = `claim_token` plus (if the session has an owner) `user_id = auth.uid()`; the shared check is `_owned_session()`. A guest session is claimed via `claim_session` by an authenticated user, within 1 hour.
- **Private tables.** RLS is on with no policies and grants are revoked; only the security-definer RPCs touch data.
- **Valid session filter**: submitted, not replayed, 15 words, 1500 ms. Fast e2e games (`show_ms = 50`) never reach rank or stats.
- **Client**: `Game` is a screen state machine (intro → present → recall → results, plus error). `AuthProvider` holds the session, a `ready` flag (set on `INITIAL_SESSION`) and the pending guest session, which it claims on `SIGNED_IN`. Supabase calls are deferred out of the auth callback.
- **Routing**: `/`, `/history` (guarded, waits for `ready`), `/leaderboard`. On Netlify, a SPA fallback in `netlify.toml` sends every path to `index.html`.
