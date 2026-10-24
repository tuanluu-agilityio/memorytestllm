import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const TEST_EMAIL_DOMAIN = 'example.com';
export const TEST_PASSWORD = 'e2e-Passw0rd!';

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`missing env ${k}`);
  return v;
};

export const testEmail = () =>
  `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_EMAIL_DOMAIN}`;

export const newClient = (): SupabaseClient =>
  createClient(env('VITE_SUPABASE_URL'), env('VITE_SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export async function createTestUser() {
  const client = newClient();
  const email = testEmail();
  const { error } = await client.auth.signUp({ email, password: TEST_PASSWORD });
  if (error) throw error;
  return { client, email, password: TEST_PASSWORD };
}

export async function runSql(query: string): Promise<unknown> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${env('SUPABASE_PROJECT_REF')}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('SUPABASE_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`sql failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Deletes every e2e user; sessions cascade. */
export async function deleteTestUsers() {
  await runSql(`delete from auth.users where email like 'e2e+%@${TEST_EMAIL_DOMAIN}'`);
}
