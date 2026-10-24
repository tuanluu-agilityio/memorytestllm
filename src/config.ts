/* v0 timings: 15 words, 1.5s per word, ~1.8s cadence, "Done!" ~0.6s. `?fast=1` shrinks them in dev builds only (e2e). */
export type Config = { count: 15; showMs: number; gapMs: number; doneMs: number; fast: boolean };

export function getConfig(search = '', isDev: boolean = import.meta.env.DEV): Config {
  const fast = isDev && new URLSearchParams(search).get('fast') === '1';
  return fast
    ? { count: 15, showMs: 50, gapMs: 10, doneMs: 50, fast }
    : { count: 15, showMs: 1500, gapMs: 300, doneMs: 600, fast };
}

export const CFG = getConfig(typeof location === 'undefined' ? '' : location.search);
