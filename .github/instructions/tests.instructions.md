---
applyTo: "tests/**"
---
- Unit (`tests/unit`, jsdom): mock `src/lib/api` and `src/config`; query by role and text.
- Integration (`tests/integration`, `// @vitest-environment node`): real Supabase via `tests/helpers/admin.ts`. Always `afterAll(deleteTestUsers)`.
- E2E (`tests/e2e`): use `/?fast=1` and `playFastGame()`; capture shown words from the `start_session` response. Test users are `e2e+…@example.com` and are deleted after the run.
- A new test must fail before the implementation exists.
