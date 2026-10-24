# Memory Test v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the v0 single-file memory test to Vite + React + TS. Add Supabase email/password accounts, server-scored saved sessions, History and Leaderboard pages, AI-context docs, and a Netlify deploy, all executable without human input.

**Architecture:**
- The SPA calls Supabase only through `security definer` Postgres RPCs. The server picks the words and scores each submission, so clients cannot write tables directly.
- A guest session carries a `claim_token`, so it can be attached to an account right after the guest signs up or logs in.
- Fast test mode (`?fast=1`, dev build only) shortens timings. Sessions it creates are excluded from rank and stats by their `show_ms`.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), react-router, @supabase/supabase-js, Vitest, Playwright, Supabase CLI (`npx supabase`), Netlify CLI (`npx netlify-cli`), dotenv-cli.

**Spec:** `docs/superpowers/specs/2026-10-25-memory-test-v1-design.md`. Read it before starting; section numbers below (§N) refer to it.

## Global Constraints

- Runs fully unattended. Every step uses CLI/API plus `.env.local`. Never stop to ask; if a step fails, use the fallback written in it.
- Never print, log or commit values from `.env.local`. `.env.local` must be in `.gitignore` before the first commit.
- UI copy is English. Game timings must match v0 exactly: 15 words, `showMs 1500`, `gapMs 300`, `doneMs 600`. Visuals must match v0 (colors, fonts, card, chips, bars, insight text). `legacy/index.v0.html` is the reference.
- Leaderboard and stats count only sessions where `submitted_at is not null and replayed = false and word_count = 15 and show_ms = 1500`. This set is called **valid** below.
- Never return emails from any RPC. Display name is `split_part(email,'@',1)`.
- Netlify: create exactly one new site `memory-test-tuan`. Never modify existing sites (`sotaytrietgia`, `danangbridges`, `causonghan`, `caudanang`, `mhotelsresortsdanang`, `demo-gatsby-contentful-blog`).
- Test accounts use `e2e+<Date.now()>-<rand>@example.com`, through the constant `TEST_EMAIL_DOMAIN` in `tests/helpers/admin.ts`. If sign-up rejects the domain (`email_address_invalid`), change the constant to `mailinator.com`. Delete test users after every test run.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Keep it small. No libraries beyond the Tech Stack line, no chart library, no state library.

## Review Focus

1. **Messy recall input** such as `"Bridge, bridge!  CANDLE;"`. Each word counts once, regardless of case or punctuation, exactly like v0. → integration test in Task 3, unit test in Task 4.
2. **Guest closes the modal, then saves via the "Log in to save this result" link or the header "Log in".** The result must still be claimed. → e2e in Task 6.
3. **Sign-up with an already-registered email, or log-in with a wrong password.** The error is shown inside the modal and the modal stays open. → e2e in Task 6.
4. **Supabase unreachable or paused when "Show the Words" is clicked.** The card shows "Couldn't reach the server. Please try again." with a "Try again" button, never a blank card. → unit test in Task 5.
5. **Direct load or refresh of `/history` or `/leaderboard` on Netlify.** The page returns 200 and renders, not 404. → deploy verification in Task 8.

---

## File Structure

```
.gitignore  .env.local(untracked)  package.json  vite.config.ts  tsconfig.json  index.html  netlify.toml  playwright.config.ts
legacy/index.v0.html                     v0 reference (moved)
supabase/config.toml                     from `supabase init`
supabase/migrations/20261025000001_schema.sql    tables, RLS, cascade
supabase/migrations/20261025000002_words.sql     ~300 words seed
supabase/migrations/20261025000003_rpc.sql       all RPCs + grants
scripts/sql.mjs                          run SQL via Management API (cleanup / fallback)
scripts/deploy.mjs                       Netlify site create/deploy + Supabase auth URL config
src/main.tsx  src/App.tsx  src/index.css
src/config.ts                            CFG + fast mode
src/lib/supabase.ts                      client singleton
src/lib/api.ts                           typed RPC wrappers
src/lib/scoring.ts                       parseTyped, scoreLocal, thirds
src/auth/AuthProvider.tsx                session context + pending-claim logic
src/auth/AuthModal.tsx
src/components/Header.tsx
src/components/BarChart.tsx              v0 bar chart (reused by History)
src/game/Game.tsx                        screen state machine
src/game/screens.tsx                     Intro, Presenter, Recall, Results, ErrorCard
src/pages/History.tsx  src/pages/Leaderboard.tsx
tests/unit/*.test.ts(x)                  Vitest, jsdom
tests/integration/rpc.test.ts            Vitest against real Supabase
tests/helpers/admin.ts                   createTestUser, deleteTestUsers
tests/e2e/*.spec.ts                      Playwright
CLAUDE.md  .github/copilot-instructions.md  .github/instructions/  .github/agents/  .github/memory-bank/
```

---

### Task 1: Repo bootstrap and Vite scaffold

**Files:**
- Create: `.gitignore`, `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tests/unit/smoke.test.ts`
- Move: `index.html` → `legacy/index.v0.html`

**Interfaces:**
- Produces npm scripts:
  - `dev` (vite, port 5173)
  - `build` (`tsc -b && vite build`)
  - `test` (`vitest run tests/unit`)
  - `test:int` (`vitest run tests/integration`)
  - `e2e` (`playwright test`)
  - `db:push` (`dotenv -e .env.local -- supabase db push`; the Supabase CLI reads `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` from env, so don't interpolate them in the script string; see the Task 2 fallback)

- [ ] **Step 1:** `git init -b main`. If `git config user.email` is empty, set it locally to `tuan.luu@asnet.com.vn`, and set `user.name` to `Tuan Luu`.
- [ ] **Step 2:** Write `.gitignore`: `.env.local`, `.env*.local`, `node_modules/`, `dist/`, `*.docx`, `~$*`, `test-results/`, `playwright-report/`, `supabase/.temp/`, `.netlify/`. Run `git check-ignore .env.local`. Expected: prints `.env.local`.
- [ ] **Step 3:** Move v0 into `legacy/` with `git mv` after the first add, or a plain move before it. Then initial commit: `.gitignore`, `legacy/`, `docs/`. Run `git status --short`. Expected: no `.env.local` and no `.docx` in the output. Then create branch `feat/v1` and do all later work on it.
- [ ] **Step 4:** Install packages.
  - Dependencies: `react react-dom react-router @supabase/supabase-js`
  - Dev dependencies: `vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/user-event @playwright/test dotenv-cli supabase netlify-cli`
- [ ] **Step 5:** Configure the build.
  - `vite.config.ts`: plugins react + tailwind, `server.port 5173`, `strictPort true`.
  - `test`: `environment 'jsdom'`, and `env: loadEnv(mode, process.cwd(), '')` so integration tests can read every `.env.local` key.
  - `src/index.css`: `@import "tailwindcss";` plus `@theme` tokens copied from v0 `:root` (`--color-bg #1a1a1a`, `card #2a2a2a`, `panel #1f1f1f`, `border #3a3a3a`, `text #f2efe8`, `muted #a9a69e`, `blue #6a9fd8`, `orange #e0735a`, `green #4ade80`, `--font-heading Georgia,"Times New Roman",serif`). Body styles copied from v0. Plain CSS is allowed for the bar transition and the chips where Tailwind is clumsier.
- [ ] **Step 6:** `tests/unit/smoke.test.ts` asserts `1+1===2`. Run `npm test` and `npm run build`. Expected: both pass.
- [ ] **Step 7:** Commit `chore: scaffold vite react ts app`.

### Task 2: Database schema, RLS and word bank

**Files:**
- Create: `supabase/config.toml` (via `npx supabase init`), `supabase/migrations/20261025000001_schema.sql`, `supabase/migrations/20261025000002_words.sql`, `scripts/sql.mjs`

**Interfaces:**
- Produces tables per §6:
  - `words(id serial pk, word text unique not null check (word ~ '^[a-z]+$'), topic text not null)`
  - `sessions(id uuid pk default gen_random_uuid(), user_id uuid null references auth.users on delete cascade, claim_token uuid not null default gen_random_uuid(), created_at timestamptz default now(), submitted_at timestamptz, word_count int not null, show_ms int not null, score int, replayed bool not null default false)`
  - `session_items(session_id uuid references sessions on delete cascade, position int, word text not null, recalled bool, primary key(session_id, position))`
- Produces `node scripts/sql.mjs "<sql>"` (or `--file <path>`). It POSTs to `https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` and body `{query}`, reads env via `--env-file=.env.local`, prints the JSON rows, and exits 1 on non-2xx.

- [ ] **Step 1:** Write `scripts/sql.mjs`. Run `node --env-file=.env.local scripts/sql.mjs "select 1 as ok"`. Expected: `[{"ok":1}]`.
- [ ] **Step 2:** Write the schema migration.
  - `enable row level security` on all three tables.
  - No policies, and `revoke all` on the tables from `anon, authenticated`. Only the RPCs (Task 3) touch them.
  - Index `sessions(user_id)`.
- [ ] **Step 3:** Write the words migration: 300 distinct common, concrete, lowercase a–z English nouns of 4–8 letters, in 10 topics × 30 (animals, food, nature, objects, places, music, sports, weather, tools, body). Insert with `on conflict do nothing`. Include the 30 v0 words, spread over fitting topics.
- [ ] **Step 4:** Apply the migrations.
  - Run `npx dotenv -e .env.local -- supabase link --project-ref <ref from the VITE_SUPABASE_URL host>` and then `npm run db:push`.
  - **Fallback** (link/push auth failure, e.g. a wrong DB password): apply each migration file in order with `node --env-file=.env.local scripts/sql.mjs --file <path>`. Note in `.github/memory-bank/decisions.md` (Task 9) that migrations were applied through the Management API.
- [ ] **Step 5:** Verify.
  - Run `scripts/sql.mjs "select count(*)::int n, count(distinct topic)::int t from words"`. Expected: `n` = 300, `t` = 10.
  - Run `scripts/sql.mjs "select relrowsecurity from pg_class where relname in ('words','sessions','session_items')"`. Expected: all true.
- [ ] **Step 6:** Commit `feat(db): schema, rls, word bank`.

### Task 3: RPCs and integration tests

**Files:**
- Create: `supabase/migrations/20261025000003_rpc.sql`, `tests/helpers/admin.ts`, `tests/integration/rpc.test.ts`

**Interfaces:**
- Produces RPCs. All are `security definer`, with `set search_path = public`. Execute is revoked from `public` and granted to `anon, authenticated` unless noted.
  - `start_session(p_show_ms int default 1500) returns jsonb`. Returns `{session_id uuid, claim_token uuid, words text[15]}`. It picks 15 distinct random words (`order by random() limit 15`), sets `user_id = auth.uid()`, `word_count 15`, `show_ms = p_show_ms`, and inserts `session_items` at positions 1..15.
  - `submit_session(p_session_id uuid, p_claim_token uuid, p_typed text) returns jsonb`. Returns `{score int, recalled bool[15]}` in position order.
    - Raises `'invalid session'` if the token does not match, or if `user_id` is not null and differs from `auth.uid()`.
    - Raises `'already submitted'` if `submitted_at` is not null.
    - Scoring: the token set is `regexp_replace(t,'[^a-z]','','g')` over `regexp_split_to_table(lower(p_typed), '[\s,;]+')`, with empty tokens dropped. An item is recalled if its word is in the set.
  - `mark_replayed(p_session_id uuid, p_claim_token uuid) returns void`. Same ownership check as `submit_session`.
  - `claim_session(p_session_id uuid, p_claim_token uuid) returns boolean`. Granted to `authenticated` only. Sets `user_id = auth.uid()` if `user_id is null`, the token matches, and `created_at > now() - interval '1 hour'`. Returns whether a row was updated.
  - `get_leaderboard() returns table(rank int, display_name text, best_score int, games int, is_me boolean)`. Covers valid sessions with `user_id` not null: per user, the max score; the tie-break is the earliest `submitted_at` achieving that max; `games` is the count of valid sessions. Top 20, `rank` from `row_number()`.
  - `get_my_history() returns table(id uuid, created_at timestamptz, score int, replayed boolean)`. All of `auth.uid()`'s submitted sessions, newest first. Empty for anon.
  - `get_my_position_stats() returns table(position int, recall_rate numeric, games int)`. Over `auth.uid()`'s valid sessions: per position 1..15, `avg(recalled::int)` rounded to 2 decimals; `games` is the count of valid sessions (the same on every row). Zero rows when there are none.
- Produces `tests/helpers/admin.ts`:
  - `TEST_EMAIL_DOMAIN`
  - `newClient(): SupabaseClient` (publishable key, `persistSession:false`)
  - `createTestUser(): Promise<{client, email, password}>` (calls signUp; throws on error)
  - `deleteTestUsers(): Promise<void>` (Management API SQL `delete from auth.users where email like 'e2e+%@' || TEST_EMAIL_DOMAIN`)

- [ ] **Step 1: Write the failing tests** in `tests/integration/rpc.test.ts` (`afterAll(deleteTestUsers)`, timeout 30s):

```ts
test('start returns 15 distinct a-z words', async () => {
  const { data } = await newClient().rpc('start_session');
  expect(data.words).toHaveLength(15);
  expect(new Set(data.words).size).toBe(15);
  data.words.forEach((w: string) => expect(w).toMatch(/^[a-z]+$/));
});
test('server scoring matches v0 rules', async () => {
  const c = newClient(); const { data: s } = await c.rpc('start_session');
  const typed = `${s.words[0].toUpperCase()}, ${s.words[0]}!  ${s.words[14]};zzz`;
  const { data: r } = await c.rpc('submit_session', { p_session_id: s.session_id, p_claim_token: s.claim_token, p_typed: typed });
  expect(r.score).toBe(2); expect(r.recalled[0]).toBe(true); expect(r.recalled[14]).toBe(true); expect(r.recalled[1]).toBe(false);
});
test('empty submission scores 0');                    // p_typed '' -> score 0, 15 x false
test('second submit is rejected');                    // error.message contains 'already submitted'
test('wrong claim token is rejected');                // submit with random uuid -> 'invalid session'
test('guest session can be claimed once by a user');  // claim -> true; second user claim -> false; get_my_history of first user has it
test('anon cannot claim');                            // newClient().rpc('claim_session',…) -> error
test('leaderboard has display name, no email, excludes fast and replayed'); // user A: valid 1500ms submit; user B: show_ms 50 submit; user C: submit then mark_replayed. Board has A's name (email prefix), not B or C; JSON.stringify(board) has no '@'
test('position stats only count valid sessions');     // A: one valid + one replayed -> games 1, 15 rows
test('anon gets empty history and stats');
test('tables are not directly readable');             // newClient().from('sessions').select() -> error or []
```

- [ ] **Step 2:** Run `npm run test:int`. Expected: FAIL, functions not found.
- [ ] **Step 3:** Write the RPC migration and apply it as in Task 2 Step 4.
- [ ] **Step 4:** Run `npm run test:int`. Expected: all pass. Then run `node --env-file=.env.local scripts/sql.mjs "select count(*)::int n from auth.users where email like 'e2e+%'"`. Expected: `n` = 0.
- [ ] **Step 5:** Commit `feat(db): server-scored session rpcs`.

### Task 4: Client config, scoring and API wrappers

**Files:**
- Create: `src/config.ts`, `src/lib/scoring.ts`, `src/lib/supabase.ts`, `src/lib/api.ts`, `tests/unit/scoring.test.ts`, `tests/unit/config.test.ts`

**Interfaces:**
- `config.ts`:
  - `getConfig(search?: string, isDev = import.meta.env.DEV): { count: 15; showMs: number; gapMs: number; doneMs: number; fast: boolean }`. Normal: 1500/300/600. Fast (only when `isDev` and the search has `fast=1`): 50/10/50.
  - `export const CFG = getConfig(location.search)`
- `scoring.ts`:
  - `parseTyped(raw: string): Set<string>` (v0 rule)
  - `scoreLocal(words: string[], raw: string): boolean[]`
  - `thirds(hit: boolean[]): { beginning: number; middle: number; end: number }` (v0 `avg` with `Math.floor(n/3)` split, integer percents)
- `supabase.ts`: `export const supabase` created from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `api.ts` (each throws `Error` on an RPC error):
  - `type StartedSession = { sessionId: string; claimToken: string; words: string[] }`
  - `startSession(showMs: number): Promise<StartedSession>`
  - `submitSession(s: StartedSession, typed: string): Promise<{ score: number; recalled: boolean[] }>`
  - `markReplayed(s: StartedSession): Promise<void>`
  - `claimSession(s: StartedSession): Promise<boolean>`
  - `getLeaderboard(): Promise<{ rank: number; displayName: string; bestScore: number; games: number; isMe: boolean }[]>`
  - `getMyHistory(): Promise<{ id: string; createdAt: string; score: number; replayed: boolean }[]>`
  - `getMyPositionStats(): Promise<{ position: number; recallRate: number; games: number }[]>`

- [ ] **Step 1:** Tests:
  - `parseTyped('Bridge, bridge!  CANDLE;')` equals `new Set(['bridge','candle'])`
  - `parseTyped('')` has size 0
  - `scoreLocal(['a','b'],'B')` equals `[false,true]`
  - `thirds` of 15 values with the first 5 true gives `{beginning:100, middle:0, end:0}`
  - `getConfig('?fast=1', true).showMs === 50`
  - `getConfig('?fast=1', false).showMs === 1500`
  - `getConfig('', true).fast === false`
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the four files. `api.ts` maps snake_case to camelCase.
- [ ] **Step 4:** Run `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: client config, scoring, api`.

### Task 5: Game port (guest flow, server-backed)

**Files:**
- Create: `src/game/Game.tsx`, `src/game/screens.tsx`, `src/components/BarChart.tsx`, `tests/unit/game.test.tsx`, `playwright.config.ts`, `tests/e2e/guest.spec.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CFG`, `api.ts`, `scoring.ts`
- Produces:
  - `<Game onResult?: (s: StartedSession, result: {score:number; recalled:boolean[]}) => void />`, called once after the first server-scored submit.
  - The `Results` screen accepts a `slot?: ReactNode`, rendered directly under the score line (Task 6 puts the save link there).
  - `<BarChart values: number[] /* 0..1 per position */ title: string />` reproduces the v0 `.chart` block: bars, numbers, gradient, legend.
- `playwright.config.ts`:
  - `webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true }`
  - `use.baseURL` = `process.env.BASE_URL ?? 'http://localhost:5173'`
  - Chromium only, `workers: 1`

- [ ] **Step 1:** Unit test `game.test.tsx` (mock `api.ts`, fake timers):
  - When `startSession` rejects, clicking "Show the Words" shows "Couldn't reach the server. Please try again." and a "Try again" button that calls `startSession` again.
  - After presenting, "Check My Memory" is disabled while `submitSession` is pending.
- [ ] **Step 2:** e2e `guest.spec.ts`: open `/?fast=1` → click "Show the Words" → wait for the textarea → type the first word shown (capture words via `page.waitForResponse` on `/rest/v1/rpc/start_session`, parse JSON) → click "Check My Memory" → expect "You recalled 1 of 15", 15 chips, and the insight text "primacy–recency effect".
- [ ] **Step 3:** Run `npm test` and `npx playwright install chromium`, then `npm run e2e -- guest`. Expected: FAIL.
- [ ] **Step 4:** Implement.
  - Screens and copy are verbatim from `legacy/index.v0.html`: intro text, word presentation with "n of 15", "Done!", recall label and placeholder, results score, chips, chart title "Serial position — your recall pattern", stats line, both insight paragraphs, and the replay button text.
  - `Game` calls `startSession(CFG.showMs)` on "Show the Words".
  - Results use the server `recalled`.
  - Replay calls `markReplayed`, replays the same words, then goes back to recall. That second check uses `scoreLocal` and does not call `submitSession` or `onResult`.
  - The bar animation is the same as v0 (12% height for a miss, 0.6s transition).
- [ ] **Step 5:** Run `npm test` and `npm run e2e -- guest`. Expected: PASS. Then open `legacy/index.v0.html` and `/` side by side via Playwright screenshots (`tests/e2e/guest.spec.ts` may save `test-results/v1-results.png`) and fix visible style differences.
- [ ] **Step 6:** Commit `feat: port v0 game to react with server sessions`.

### Task 6: Auth, header, modal and claim flow

**Files:**
- Create: `src/auth/AuthProvider.tsx`, `src/auth/AuthModal.tsx`, `src/components/Header.tsx`, `tests/e2e/auth.spec.ts`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `supabase`, `claimSession`, `<Game onResult slot>`
- Produces:
  - `useAuth(): { user: { id: string; email: string } | null; openAuth(title?: string): void; signOut(): Promise<void>; setPending(s: StartedSession | null): void; pendingSaved: boolean }`
  - Routes in `App.tsx`: `/` → Game, `/history`, `/leaderboard` (pages added in Task 7; placeholder headings for now).
- Claim behavior:
  - `AuthProvider` holds the pending guest session (memory only).
  - On every `SIGNED_IN` event while a pending session exists, it calls `claimSession` once, then clears the pending session and sets `pendingSaved = true`.
  - For a logged-in player, `Game.onResult` does nothing extra (the session already has a `user_id`) and shows no modal.

- [ ] **Step 1:** e2e `auth.spec.ts` (`afterAll(deleteTestUsers)`, fresh email per test):
  - **guest saves via modal:** play `/?fast=1` → within 3s a dialog titled "Save this result — log in or sign up" appears → Sign up tab → email/password → dialog closes → "Saved to your history" is visible → header shows the email and "History" → `/history` lists one game.
  - **guest closes modal, saves later:** close the dialog → click "Log in to save this result" → sign up → "Saved to your history".
  - **logged-in user auto-saves:** log in via the header "Log in" → play → no dialog after 3s → `/history` lists the game.
  - **duplicate sign-up shows error:** sign up with an already-used email → the dialog stays open with a visible error text (Supabase message). Wrong password on Log in → visible error.
  - **log out:** click "Log out" → the header shows "Log in", and "History" is gone.
- [ ] **Step 2:** Run `npm run e2e -- auth`. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - Header labels (exact): "Memory Test", "History", "Leaderboard", "Log in", "Log out".
  - Modal tabs "Log in" / "Sign up", with `role="dialog"`, a close button `aria-label="Close"`, and the submit button disabled while pending.
  - The modal auto-opens 1000 ms after guest results render.
  - The results slot shows "Log in to save this result" (opens the modal with the save title) or, once saved, "Saved to your history".
  - `/history` for a guest redirects to `/` and opens the modal.
- [ ] **Step 4:** Run `npm run e2e` and `npm test`. Expected: all PASS. Then check `scripts/sql.mjs` for e2e users. Expected: 0.
- [ ] **Step 5:** Commit `feat: email auth, guest result claiming`.

### Task 7: History and Leaderboard pages

**Files:**
- Create: `src/pages/History.tsx`, `src/pages/Leaderboard.tsx`, `tests/unit/pages.test.tsx`, `tests/e2e/pages.spec.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `getMyHistory`, `getMyPositionStats`, `getLeaderboard`, `BarChart`, `useAuth`

- [ ] **Step 1:** Unit tests with mocked api:
  - History with 3 valid games shows "Your serial-position curve", "Based on 3 games" and "Play a few more games to see a reliable curve".
  - With 5 games, the warning is absent.
  - A replayed row shows the label "replayed".
  - Score is shown as "x/15".
  - Leaderboard renders the columns rank, name, best, games, and the row with `isMe` has `aria-current="true"`.
  - Empty states: "No games yet." and "No scores yet."
- [ ] **Step 2:** e2e `pages.spec.ts`: `/leaderboard` as a guest shows the heading "Leaderboard". As a logged-in user after one fast game, `/history` shows "Based on 0 games" (fast games are not valid) and lists 1 game. This proves the fast-mode exclusion end to end.
- [ ] **Step 3:** Run `npm test` and `npm run e2e -- pages`. Expected: FAIL.
- [ ] **Step 4:** Implement both pages in the v0 card style.
  - History curve: `BarChart` with `values = recallRate` per position. With zero rows, the chart is hidden and "Based on 0 games" plus the warning are shown.
  - Dates use `toLocaleString()`.
- [ ] **Step 5:** Run `npm test`, `npm run e2e` and `npm run build`. Expected: all PASS.
- [ ] **Step 6:** Commit `feat: history and leaderboard pages`.

### Task 8: Netlify deploy

**Files:**
- Create: `netlify.toml`, `scripts/deploy.mjs`

**Interfaces:**
- `netlify.toml`: `[build] publish = "dist"`, plus `[[redirects]] from="/*" to="/index.html" status=200`.
- `node --env-file=.env.local scripts/deploy.mjs`:
  1. `GET https://api.netlify.com/api/v1/accounts`. If more than one, pick the account whose slug owns the existing sites (`GET /api/v1/sites` → `account_slug`).
  2. Look up a site named `memory-test-tuan`. If absent, `POST /api/v1/{account_slug}/sites {name}`. On a name conflict (422), retry with `memory-test-tuan-<4 random chars>`. Only ever touch this site's id.
  3. Run `npm run build`, then `npx netlify-cli deploy --prod --dir dist --site <id>` (with the env var `NETLIFY_AUTH_TOKEN`).
  4. `PATCH https://api.supabase.com/v1/projects/{ref}/config/auth` with `{ site_url: <netlify url>, uri_allow_list: "http://localhost:5173,<netlify url>" }`.
  5. Print the site URL.

- [ ] **Step 1:** Write both files. Run the deploy script. Expected: prints `https://memory-test-tuan*.netlify.app`.
- [ ] **Step 2:** Verify.
  - `curl -s -o /dev/null -w "%{http_code}"` on `<url>/`, `<url>/history` and `<url>/leaderboard`. Expected: 200 for all.
  - `BASE_URL=<url> npx playwright test pages -g "leaderboard"`. Expected: PASS.
  - `GET /api/v1/sites` shows the 6 pre-existing sites unchanged (the same `updated_at` as before Step 1; record it beforehand).
  - `?fast=1` on prod still uses 1500ms. Check that `getConfig` with `isDev=false` is covered by the unit test; no extra prod test is needed.
- [ ] **Step 3:** Commit `chore: netlify deploy`.

### Task 9: AI context docs

**Files:**
- Create:
  - `CLAUDE.md`
  - `.github/copilot-instructions.md`
  - `.github/instructions/react.instructions.md` (`applyTo: "src/**/*.tsx,src/**/*.ts"`)
  - `.github/instructions/sql.instructions.md` (`applyTo: "supabase/**"`)
  - `.github/instructions/tests.instructions.md` (`applyTo: "tests/**"`)
  - `.github/agents/tester.agent.md`
  - `.github/agents/reviewer.agent.md`
  - `.github/memory-bank/{projectbrief,productContext,systemPatterns,techContext,activeContext,progress,decisions}.md`

- [ ] **Step 1:** Write the docs in English, concise, without copying code, reflecting the finished state:
  - `CLAUDE.md`: one-paragraph project summary, the commands (`dev`, `test`, `test:int`, `e2e`, `db:push`, the deploy script), the rule "never read/print `.env.local` values", and `@.github/memory-bank/…` imports for all 7 files plus `@.github/copilot-instructions.md`.
  - `decisions.md`: every [Tuan]/[Claude] decision from spec §2–§9, each with its reason, plus anything decided during execution (for example, the migration fallback).
  - `progress.md`: what's done, the live URL, known gaps (no minimum-time anti-cheat, no password reset).
  - `activeContext.md`: suggested next steps from the spec's deferred items.
  - The agents files hold frontmatter `name`, `description` and a short role prompt: tester runs `npm test`, `test:int`, `e2e`; reviewer checks the Global Constraints.
- [ ] **Step 2:** Verify. Every path or command mentioned in the docs exists (grep each script name against `package.json`). `git grep -n "sb_\|sbp_\|nfp_\|SUPABASE_DB_PASSWORD="` returns only variable names, no values.
- [ ] **Step 3:** Commit `docs: ai context, memory bank, agents`.

### Task 10: Final verification

- [ ] **Step 1:** Run, in order: `npm test`, `npm run test:int`, `npm run e2e`, `npm run build`. Expected: all pass. Then e2e users = 0 via `scripts/sql.mjs`.
- [ ] **Step 2:** Run `git status`. Expected: clean, with `.env.local` and the docx untracked and ignored. Run `git log --oneline`. Expected: one commit per task.
- [ ] **Step 3:** Report the live URL, the test counts, and any fallback used. Leave `feat/v1` unmerged for `superpowers:finishing-a-development-branch`.
