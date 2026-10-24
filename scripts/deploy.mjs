// Build and deploy to Netlify (site "memory-test-tuan" only), then point Supabase Auth at the live URL.
// Usage: node --env-file=.env.local scripts/deploy.mjs
import { execSync } from 'node:child_process';

const SITE_NAME = 'memory-test-tuan';
const { NETLIFY_AUTH_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN } = process.env;

async function api(url, token, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}
const netlify = (path, init) => api(`https://api.netlify.com/api/v1${path}`, NETLIFY_AUTH_TOKEN, init);

// 1. Pick the account: the only one, or the one that owns the existing sites.
const { body: accounts } = await netlify('/accounts');
const { body: sites } = await netlify('/sites?filter=all&per_page=100');
const slug = accounts.length === 1
  ? accounts[0].slug
  : (sites.find((s) => s.account_slug)?.account_slug ?? accounts[0].slug);

// 2. Find or create our site; never touch any other.
let site = sites.find((s) => s.name === SITE_NAME || s.name?.startsWith(`${SITE_NAME}-`));
if (!site) {
  let name = SITE_NAME;
  for (let attempt = 0; attempt < 3 && !site; attempt++) {
    const r = await netlify(`/${slug}/sites`, { method: 'POST', body: JSON.stringify({ name }) });
    if (r.ok) site = r.body;
    else if (r.status === 422) name = `${SITE_NAME}-${Math.random().toString(36).slice(2, 6)}`;
    else throw new Error(`create site failed: ${r.status} ${JSON.stringify(r.body)}`);
  }
}
const url = site.ssl_url || site.url;
console.log(`site: ${site.name} (${site.id})`);

// 3. Build and deploy.
execSync('npm run build', { stdio: 'inherit' });
execSync(`npx netlify deploy --prod --no-build --dir dist --site ${site.id}`, { stdio: 'inherit' });

// 4. Supabase Auth: site URL + allowed redirects.
const auth = await api(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`, SUPABASE_ACCESS_TOKEN, {
  method: 'PATCH',
  body: JSON.stringify({ site_url: url, uri_allow_list: `http://localhost:5173,${url}` }),
});
if (!auth.ok) throw new Error(`supabase auth config failed: ${auth.status}`);

console.log(`LIVE: ${url}`);
