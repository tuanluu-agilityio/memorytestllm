import { expect, test } from '@playwright/test';
import { deleteTestUsers, testEmail, TEST_PASSWORD } from '../helpers/admin';
import { playFastGame } from './play';

test.afterAll(deleteTestUsers);

test('leaderboard is public', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
});

test('guest opening /history is sent home with the auth modal', async ({ page }) => {
  await page.goto('/history');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('history lists a fast game but excludes it from the curve', async ({ page }) => {
  await page.goto('/?fast=1');
  await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Sign up' }).click();
  await dialog.getByLabel('Email').fill(testEmail());
  await dialog.getByLabel('Password').fill(TEST_PASSWORD);
  await dialog.getByRole('button', { name: 'Sign up' }).click();
  await expect(dialog).toBeHidden();
  await playFastGame(page);

  await page.goto('/history'); // direct load: session must be restored before the guard decides
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await expect(page.getByText('Based on 0 games')).toBeVisible();
  await expect(page.getByText('1/15')).toBeVisible();
});
