// @vitest-environment node
import { afterAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUsers, newClient } from '../helpers/admin';

type Started = { session_id: string; claim_token: string; words: string[] };

async function start(c: SupabaseClient, showMs?: number): Promise<Started> {
  const { data, error } = await c.rpc('start_session', showMs ? { p_show_ms: showMs } : {});
  if (error) throw error;
  return data;
}
const submit = (c: SupabaseClient, s: Started, typed: string) =>
  c.rpc('submit_session', { p_session_id: s.session_id, p_claim_token: s.claim_token, p_typed: typed });

afterAll(deleteTestUsers);

describe('sessions', () => {
  test('start returns 15 distinct a-z words', async () => {
    const s = await start(newClient());
    expect(s.words).toHaveLength(15);
    expect(new Set(s.words).size).toBe(15);
    s.words.forEach((w) => expect(w).toMatch(/^[a-z]+$/));
  });

  test('server scoring matches v0 rules', async () => {
    const c = newClient();
    const s = await start(c);
    const typed = `${s.words[0].toUpperCase()}, ${s.words[0]}!  ${s.words[14]};zzz`;
    const { data: r, error } = await submit(c, s, typed);
    expect(error).toBeNull();
    expect(r.score).toBe(2);
    expect(r.recalled).toHaveLength(15);
    expect(r.recalled[0]).toBe(true);
    expect(r.recalled[14]).toBe(true);
    expect(r.recalled[1]).toBe(false);
  });

  test('empty submission scores 0', async () => {
    const c = newClient();
    const s = await start(c);
    const { data: r } = await submit(c, s, '');
    expect(r.score).toBe(0);
    expect(r.recalled).toEqual(Array(15).fill(false));
  });

  test('second submit is rejected', async () => {
    const c = newClient();
    const s = await start(c);
    await submit(c, s, s.words[0]);
    const { error } = await submit(c, s, s.words.join(' '));
    expect(error?.message).toContain('already submitted');
  });

  test('wrong claim token is rejected', async () => {
    const c = newClient();
    const s = await start(c);
    const { error } = await submit(c, { ...s, claim_token: crypto.randomUUID() }, '');
    expect(error?.message).toContain('invalid session');
  });

  test('tables are not directly readable', async () => {
    const { data, error } = await newClient().from('sessions').select('*');
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});

describe('claiming', () => {
  test('guest session can be claimed once by a user', async () => {
    const guest = newClient();
    const s = await start(guest);
    await submit(guest, s, s.words[0]);
    const a = await createTestUser();
    const b = await createTestUser();
    const first = await a.client.rpc('claim_session', { p_session_id: s.session_id, p_claim_token: s.claim_token });
    expect(first.data).toBe(true);
    const second = await b.client.rpc('claim_session', { p_session_id: s.session_id, p_claim_token: s.claim_token });
    expect(second.data).toBe(false);
    const { data: hist } = await a.client.rpc('get_my_history');
    expect(hist.map((h: { id: string }) => h.id)).toContain(s.session_id);
  });

  test('anon cannot claim', async () => {
    const c = newClient();
    const s = await start(c);
    const { error } = await c.rpc('claim_session', { p_session_id: s.session_id, p_claim_token: s.claim_token });
    expect(error).not.toBeNull();
  });
});

describe('leaderboard and stats', () => {
  test('leaderboard has display name, no email, excludes fast and replayed', async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const c = await createTestUser();
    const sa = await start(a.client);
    await submit(a.client, sa, sa.words.join(' '));
    const sb = await start(b.client, 50);
    await submit(b.client, sb, sb.words.join(' '));
    const sc = await start(c.client);
    await submit(c.client, sc, sc.words.join(' '));
    await c.client.rpc('mark_replayed', { p_session_id: sc.session_id, p_claim_token: sc.claim_token });

    const { data: board, error } = await a.client.rpc('get_leaderboard');
    expect(error).toBeNull();
    const names = board.map((r: { display_name: string }) => r.display_name);
    expect(names).toContain(a.email.split('@')[0]);
    expect(names).not.toContain(b.email.split('@')[0]);
    expect(names).not.toContain(c.email.split('@')[0]);
    expect(JSON.stringify(board)).not.toContain('@');
    const mine = board.find((r: { display_name: string }) => r.display_name === a.email.split('@')[0]);
    expect(mine).toMatchObject({ best_score: 15, games: 1, is_me: true });
  });

  test('position stats only count valid sessions', async () => {
    const a = await createTestUser();
    const s1 = await start(a.client);
    await submit(a.client, s1, s1.words[0]);
    const s2 = await start(a.client);
    await submit(a.client, s2, s2.words.join(' '));
    await a.client.rpc('mark_replayed', { p_session_id: s2.session_id, p_claim_token: s2.claim_token });

    const { data: stats } = await a.client.rpc('get_my_position_stats');
    expect(stats).toHaveLength(15);
    expect(stats[0]).toMatchObject({ position: 1, games: 1 });
    expect(Number(stats[0].recall_rate)).toBe(1);
    expect(Number(stats[1].recall_rate)).toBe(0);
    const { data: hist } = await a.client.rpc('get_my_history');
    expect(hist).toHaveLength(2);
    expect(hist.filter((h: { replayed: boolean }) => h.replayed)).toHaveLength(1);
  });

  test('anon gets empty history and stats', async () => {
    const c = newClient();
    expect((await c.rpc('get_my_history')).data).toEqual([]);
    expect((await c.rpc('get_my_position_stats')).data).toEqual([]);
  });
});
