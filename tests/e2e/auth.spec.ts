import { expect, test, type Page } from '@playwright/test';
import { deleteTestUsers, runSql, testEmail, TEST_PASSWORD } from '../helpers/admin';
import { playFastGame } from './play';

test.afterAll(deleteTestUsers);

const SAVE_TITLE = 'Save this result — log in or sign up';

async function savedGames(email: string): Promise<number> {
  const rows = (await runSql(
    `select count(*)::int n from sessions s join auth.users u on u.id = s.user_id where u.email = '${email}'`,
  )) as { n: number }[];
  return rows[0].n;
}

async function fillAuth(page: Page, tab: 'Log in' | 'Sign up', email: string, password = TEST_PASSWORD) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: tab }).click();
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByLabel('Password').fill(password);
  await dialog.getByRole('button', { name: tab }).click();
}

async function signUpFromHeader(page: Page, email: string) {
  await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click();
  await fillAuth(page, 'Sign up', email);
  await expect(page.getByRole('dialog')).toBeHidden();
}

test('guest saves the result via the modal', async ({ page }) => {
  const email = testEmail();
  await playFastGame(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 3000 });
  await expect(dialog).toContainText(SAVE_TITLE);
  await fillAuth(page, 'Sign up', email);
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Saved to your history')).toBeVisible();
  const banner = page.getByRole('banner');
  await expect(banner).toContainText(email);
  await expect(banner.getByRole('link', { name: 'History' })).toBeVisible();
  expect(await savedGames(email)).toBe(1);
});

test('guest closes the modal and saves later via the link', async ({ page }) => {
  const email = testEmail();
  await playFastGame(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Log in to save this result' }).click();
  await expect(page.getByRole('dialog')).toContainText(SAVE_TITLE);
  await fillAuth(page, 'Sign up', email);
  await expect(page.getByText('Saved to your history')).toBeVisible();
  expect(await savedGames(email)).toBe(1);
});

test('logged-in user auto-saves without a modal', async ({ page }) => {
  const email = testEmail();
  await page.goto('/?fast=1');
  await signUpFromHeader(page, email);
  await playFastGame(page);
  await page.waitForTimeout(2000);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Log in to save this result' })).toBeHidden();
  expect(await savedGames(email)).toBe(1);
});

test('auth errors are shown inside the modal', async ({ page }) => {
  const email = testEmail();
  await page.goto('/?fast=1');
  await signUpFromHeader(page, email);
  await page.getByRole('banner').getByRole('button', { name: 'Log out' }).click();

  await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click();
  await fillAuth(page, 'Sign up', email);
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();

  await fillAuth(page, 'Log in', email, 'wrong-password');
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('log out returns the header to guest state', async ({ page }) => {
  await page.goto('/?fast=1');
  await signUpFromHeader(page, testEmail());
  const banner = page.getByRole('banner');
  await banner.getByRole('button', { name: 'Log out' }).click();
  await expect(banner.getByRole('button', { name: 'Log in' })).toBeVisible();
  await expect(banner.getByRole('link', { name: 'History' })).toBeHidden();
});
