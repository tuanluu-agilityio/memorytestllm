# Decisions

[Owner] = decided by Tuan · [Claude] = decided by Claude on the owner's behalf

| Decision | Why | By |
|---|---|---|
| Supabase backend (Postgres + Auth), no custom server | Accounts + leaderboard need a backend; managed is fastest | Owner |
| Email + password only | Google OAuth needs manual console setup and can't be e2e-tested | Owner |
| Deploy to Netlify, automated via token | Shareable leaderboard; unattended execution | Owner |
| English UI; words mixed from all topics each game | Keep v0 feel; topics only organise the bank | Owner |
| AI docs in `CLAUDE.md` + `.github/` (memory bank inside `.github/`) | Claude Code reads `CLAUDE.md`; Copilot/Cline read `.github/` | Owner |
| Guest result is saved when signing up/logging in from the modal (claim token, 1 h window) | Don't lose the game that motivated sign-up | Claude |
| Server picks words and scores | Players can't self-report a score | Claude |
| No minimum-duration check on submit | Would break fast e2e mode; accepted gap | Claude |
| Valid session = submitted, not replayed, 15 words, 1500 ms | Keeps fast test games and replays out of rank/stats | Claude |
| Leaderboard public, top 20, best score, earliest tie-break, name = email prefix | Gives guests a reason to sign up; no email exposure | Claude |
| Replay: first submit saved + flagged; second attempt local only | Matches v0 UX without corrupting data | Claude |
| Modal opens 1 s after results, on the "Sign up" tab | Let the player see the score first; prompt targets new users | Claude |
| v0 CSS kept verbatim in `src/index.css`, Tailwind tokens alongside | Guarantees visual parity | Claude |
| Submit failure shows the "Try again" error card | Avoids a stuck recall screen | Claude |
| Auth `ready` flag before guarding `/history` | A direct load must wait for session restore | Claude |
| Migrations applied with Supabase CLI `db push` (Management API SQL is the fallback, unused) | CLI tracks migration history | Claude |
| Test users `e2e+…@example.com`, deleted via Management API SQL after each run (cascade) | Leaves no test data in auth | Claude |
| Not done: forgot password, display-name editing, email confirmation | Out of v1 scope | Claude |
