// Pure helpers for scripts/deploy.mjs (unit-tested in tests/unit/deploy-lib.test.ts).

/** @param {{ok:boolean,status:number,body:any}} r @param {string} what */
export function assertOk(r, what) {
  if (!r.ok) throw new Error(`${what} failed: ${r.status}`);
  return r.body;
}

/**
 * Exact name match only: never adopt a look-alike site.
 * @template {{name: string}} T
 * @param {T[]} sites @param {string} name @returns {T | undefined}
 */
export const pickSite = (sites, name) => sites.find((s) => s.name === name);

/** Adds URLs to Supabase's comma-separated allow list without dropping existing ones. @param {string|undefined} existing @param {string[]} add */
export function mergeAllowList(existing, add) {
  const urls = (existing ?? '').split(',').map((u) => u.trim()).filter(Boolean);
  for (const u of add) if (!urls.includes(u)) urls.push(u);
  return urls.join(',');
}
