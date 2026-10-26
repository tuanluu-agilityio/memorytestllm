import { expect, test } from 'vitest';
import { hallucinated, parseTyped, scoreLocal, thirds } from '../../src/lib/scoring';

test('parseTyped follows v0 rules', () => {
  expect(parseTyped('Bridge, bridge!  CANDLE;')).toEqual(new Set(['bridge', 'candle']));
  expect(parseTyped('').size).toBe(0);
});

test('scoreLocal marks recalled positions', () => {
  expect(scoreLocal(['a', 'b'], 'B')).toEqual([false, true]);
});

test('hallucinated lists typed words that were never shown, in typed order, once each', () => {
  expect(hallucinated(['bridge', 'candle'], 'Dark candle, dark; ocean 42')).toEqual(['dark', 'ocean']);
  expect(hallucinated(['bridge'], 'bridge')).toEqual([]);
});

test('thirds splits like v0', () => {
  const hit = Array.from({ length: 15 }, (_, i) => i < 5);
  expect(thirds(hit)).toEqual({ beginning: 100, middle: 0, end: 0 });
});
