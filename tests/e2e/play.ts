import { expect, type Page } from '@playwright/test';

/** Plays one fast game, typing the first shown word. Returns the words shown. */
export async function playFastGame(page: Page): Promise<string[]> {
  if (!page.url().includes('fast=1')) await page.goto('/?fast=1');
  const started = page.waitForResponse((r) => r.url().includes('/rest/v1/rpc/start_session'));
  await page.getByRole('button', { name: 'Show the Words' }).click();
  const { words } = await (await started).json();
  await page.getByRole('textbox').fill(words[0]);
  await page.getByRole('button', { name: 'Check My Memory' }).click();
  await expect(page.getByText('You recalled')).toBeVisible();
  return words;
}
