---
applyTo: "supabase/**"
---
- Add a new timestamped file in `supabase/migrations/` for every change; never edit an applied migration. Apply with `npm run db:push`. The fallback is `scripts/sql.mjs --file <path>`.
- Tables keep RLS on with no policies, and are revoked from `anon` and `authenticated`. Clients use RPCs only.
- RPCs: `security definer`, `set search_path = public`, `revoke execute … from public`, then grant explicitly. Quote reserved words (e.g. `"position"`) in `returns table`.
- "Valid" sessions for rank/stats: `submitted_at is not null and not replayed and word_count = 15 and show_ms = 1500`.
- Never return `auth.users.email`.
