// Build and deploy to Netlify (site "memorytestllm" only), then point Supabase Auth at the live URL.
// Usage: node --env-file=.env.local scripts/deploy.mjs
import { execSync } from 'node:child_process';
import { assertOk, mergeAllowList, pickSite } from './deploy-lib.mjs';

const SITE_NAME = 'memorytestllm';
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

async function allSites() {
  const out = [];
  for (let page = 1; ; page++) {
    const batch = assertOk(await netlify(`/sites?per_page=100&page=${page}`), 'netlify /sites');
    out.push(...batch);
    if (batch.length < 100) return out;
  }
}

// 1. Pick the account: the only one, or the one that owns the existing sites.
const accounts = assertOk(await netlify('/accounts'), 'netlify /accounts');
const sites = await allSites();
const slug = accounts.length === 1
  ? accounts[0].slug
  : (sites.find((s) => s.account_slug)?.account_slug ?? accounts[0].slug);

// 2. Find (exact name) or create our site; never touch any other.
let site = pickSite(sites, SITE_NAME);
if (!site) {
  let name = SITE_NAME;
  for (let attempt = 0; attempt < 3 && !site; attempt++) {
    const r = await netlify(`/${slug}/sites`, { method: 'POST', body: JSON.stringify({ name }) });
    if (r.status === 422) name = `${SITE_NAME}-${Math.random().toString(36).slice(2, 6)}`;
    else site = assertOk(r, 'netlify create site');
  }
  if (!site) throw new Error('could not create a site name');
}
const url = site.ssl_url || site.url;
console.log(`site: ${site.name} (${site.id})`);

// 3. Build and deploy.
execSync('npm run build', { stdio: 'inherit' });
execSync(`npx netlify deploy --prod --no-build --dir dist --site ${site.id}`, { stdio: 'inherit' });

// 4. Supabase Auth: site URL + allowed redirects (merged with what is already configured).
const authUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`;
const current = assertOk(await api(authUrl, SUPABASE_ACCESS_TOKEN), 'supabase get auth config');
assertOk(await api(authUrl, SUPABASE_ACCESS_TOKEN, {
  method: 'PATCH',
  body: JSON.stringify({ site_url: url, uri_allow_list: mergeAllowList(current.uri_allow_list, ['http://localhost:5173', url]) }),
}), 'supabase patch auth config');

console.log(`LIVE: ${url}`);
