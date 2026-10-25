import { expect, test } from '@playwright/test';
import { playFastGame } from './play';

test('guest plays a full game', async ({ page }) => {
  await page.goto('/?fast=1');
  await expect(page.getByRole('heading', { name: 'Memory Test' })).toBeVisible();
  await playFastGame(page);
  await expect(page.locator('.score')).toHaveText('You recalled 1 of 15');
  await expect(page.locator('.chip')).toHaveCount(15);
  await expect(page.locator('.chip.hit')).toHaveCount(1);
  await expect(page.getByText('primacy–recency effect')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Replay words (defeats the exercise)' })).toBeVisible();
  await page.screenshot({ path: 'test-results/v1-results.png', fullPage: true });
});
