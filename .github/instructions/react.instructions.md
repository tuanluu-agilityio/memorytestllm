---
applyTo: "src/**/*.tsx,src/**/*.ts"
---
- Function components and hooks only; no state library. Shared auth state comes from `useAuth()`.
- Call Supabase only through `src/lib/api.ts`. Add a wrapper there for each new RPC (map snake_case to camelCase, throw `Error` on failure).
- Styling: reuse the v0 classes in `src/index.css` (`card`, `btn`, `chip`, `chart`, …) and Tailwind tokens (`bg-card`, `text-muted`, `border-line`, `text-blue`, `font-heading`).
- Accessible roles drive the tests: dialogs use `role="dialog"`, tabs use `role="tab"`, errors use `role="alert"`.
- Timings come from `CFG` in `src/config.ts`; never hardcode delays.
