import { expect, test } from 'vitest';
import { assertOk, mergeAllowList, pickSite } from '../../scripts/deploy-lib.mjs';

test('pickSite matches the exact name only', () => {
  const sites = [{ name: 'memory-test-tuan-old', id: 'x' }, { name: 'caudanang', id: 'y' }];
  expect(pickSite(sites, 'memory-test-tuan')).toBeUndefined();
  expect(pickSite([...sites, { name: 'memory-test-tuan', id: 'z' }], 'memory-test-tuan')?.id).toBe('z');
});

test('mergeAllowList keeps existing redirect URLs', () => {
  expect(mergeAllowList('https://a.com,http://localhost:5173', ['http://localhost:5173', 'https://b.app']))
    .toBe('https://a.com,http://localhost:5173,https://b.app');
  expect(mergeAllowList(undefined, ['https://b.app'])).toBe('https://b.app');
});

test('assertOk throws with the status on a failed response', () => {
  expect(() => assertOk({ ok: false, status: 401, body: null }, 'netlify /accounts')).toThrow('netlify /accounts failed: 401');
  expect(assertOk({ ok: true, status: 200, body: [1] }, 'x')).toEqual([1]);
});
