/** v0 rule: lowercase, split on whitespace/commas/semicolons, keep a-z only. */
export const parseTyped = (raw: string): Set<string> =>
  new Set(raw.toLowerCase().split(/[\s,;]+/).map((s) => s.replace(/[^a-z]/g, '')).filter(Boolean));

export const scoreLocal = (words: string[], raw: string): boolean[] => {
  const typed = parseTyped(raw);
  return words.map((w) => typed.has(w));
};

export function thirds(hit: boolean[]) {
  const n = hit.length;
  const third = Math.floor(n / 3);
  const avg = (a: number, b: number) => {
    const s = hit.slice(a, b);
    return s.length ? Math.round((100 * s.filter(Boolean).length) / s.length) : 0;
  };
  return { beginning: avg(0, third), middle: avg(third, n - third), end: avg(n - third, n) };
}
