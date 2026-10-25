# Product context

- **Guests** play exactly as in v0. About 1 s after the results appear, a modal offers "Save this result — log in or sign up". Closing it leaves a "Log in to save this result" link under the score. Signing up or logging in claims the result (within 1 hour), and the link becomes "Saved to your history".
- **Logged-in players**: results save automatically with no modal. The header shows History, Leaderboard, the player's email and Log out.
- **History**: a personal serial-position curve across valid games ("Based on N games"), with a warning below 5 games, plus a list of games (date, x/15, a "replayed" label).
- **Leaderboard** (public): top 20, one row per player, best score. Ties go to whoever reached the score first. The name shown is the part of the email before `@`, and the viewer's own row is highlighted.
- **Replay** ("defeats the exercise") marks the game as replayed; it no longer counts toward rank or stats. The second attempt is scored locally and not saved.
- Out of scope: Google/social login, password reset, email confirmation, display-name editing, topic selection, LLM comparison, airtight anti-cheat.
