import { expect, test } from 'vitest';
import { getConfig } from '../../src/config';

test('fast mode only in dev', () => {
  expect(getConfig('?fast=1', true).showMs).toBe(50);
  expect(getConfig('?fast=1', false).showMs).toBe(1500);
  expect(getConfig('', true).fast).toBe(false);
});

test('normal timings match v0', () => {
  expect(getConfig('', false)).toEqual({ count: 15, showMs: 1500, gapMs: 300, doneMs: 600, fast: false });
});
