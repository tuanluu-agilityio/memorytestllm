import { afterEach, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Presenter } from '../../src/game/screens';
import { CFG } from '../../src/config';

afterEach(() => vi.useRealTimers());

const words = Array.from({ length: 15 }, (_, i) => `word${i}`);
const step = CFG.showMs + CFG.gapMs;

test('dot line fills one dot per word shown, between the word and the counter', async () => {
  vi.useFakeTimers();
  const { container } = render(<Presenter words={words} onDone={() => {}} />);
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });

  const kids = [...container.children].map((el) => el.className);
  expect(kids).toEqual(['word', 'dots', 'counter']);
  expect(container.querySelectorAll('.dot')).toHaveLength(15);
  expect(container.querySelectorAll('.dot.on')).toHaveLength(1);
  expect(container.querySelectorAll('.dot')[0]).toHaveClass('now');

  await act(async () => { await vi.advanceTimersByTimeAsync(step * 8); });
  expect(container.querySelector('.counter')).toHaveTextContent('9 of 15');
  expect(container.querySelectorAll('.dot.on')).toHaveLength(9);
  expect(container.querySelectorAll('.dot.now')).toHaveLength(1);
  expect(container.querySelectorAll('.dot')[8]).toHaveClass('now');

  await act(async () => { await vi.advanceTimersByTimeAsync(step * 7); });
  expect(container.querySelector('.word')).toHaveTextContent('Done!');
  expect(container.querySelectorAll('.dot.on')).toHaveLength(15);
  expect(container.querySelectorAll('.dot.now')).toHaveLength(0);
});
