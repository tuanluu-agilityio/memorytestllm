# Tech context

- **Stack**: Vite 8, React 19, TypeScript 5.9, Tailwind CSS 4 (`@tailwindcss/vite`), react-router 8, @supabase/supabase-js 2.
- **Tests**: Vitest 5 (jsdom for unit; node for integration), Testing Library, Playwright (Chromium, 1 worker).
- **Tooling**: Supabase CLI (`npx supabase`, linked project), Netlify CLI (`npx netlify`), dotenv-cli.
- **Env** (`.env.local`, git-ignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `NETLIFY_AUTH_TOKEN`.
- **Supabase**: region ap-southeast-1. Email auth is on with confirmation off (autoconfirm). Management API is used for SQL (`scripts/sql.mjs`) and auth config.
- **Platform**: Windows 11, Node 24, npm 11. npm install scripts were approved for esbuild and netlify-cli. `core.autocrlf` is false in this repo.
- The free Supabase project pauses after 7 days idle; restore it from the dashboard.
