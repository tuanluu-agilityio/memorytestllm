// Run SQL against the Supabase project via the Management API.
// Usage: node --env-file=.env.local scripts/sql.mjs "<sql>"   |   ... scripts/sql.mjs --file <path>
import { readFileSync } from 'node:fs';

const [flag, arg] = process.argv.slice(2);
const query = flag === '--file' ? readFileSync(arg, 'utf8') : flag;
if (!query) { console.error('usage: sql.mjs "<sql>" | --file <path>'); process.exit(2); }

const { SUPABASE_PROJECT_REF: ref, SUPABASE_ACCESS_TOKEN: token } = process.env;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
const body = await res.text();
console.log(body);
if (!res.ok) process.exit(1);
