import { expect, test } from '@playwright/test';

test('counter stays put while words change', async ({ page }) => {
  await page.goto('/?fast=1');
  await page.evaluate(() => {
    const w = window as unknown as { __tops: number[] };
    w.__tops = [];
    const tick = () => {
      const c = document.querySelector('.counter');
      if (c) w.__tops.push(Math.round(c.getBoundingClientRect().top));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.getByRole('button', { name: 'Show the Words' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  const tops = await page.evaluate(() => (window as unknown as { __tops: number[] }).__tops);
  expect(tops.length).toBeGreaterThan(10);
  expect(new Set(tops).size).toBe(1);
});
