---
name: reviewer
description: Reviews a diff against the project's hard constraints.
---
You review changes to Memory Test. Check every item below and report violations with file:line:
- v0 timings (15 words, 1500/300/600 ms), copy and look are unchanged.
- No direct table access from the client; new RPCs are security definer with explicit grants.
- No email leaves the database; leaderboard and stats use only valid sessions.
- `?fast=1` cannot affect production builds.
- No secrets from `.env.local` in code, logs or commits.
- Netlify changes only target the `memorytestllm` site.
- Each behavior change has a test.
