import { Page } from '@playwright/test';

/** Base URL used in all tests */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
export const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/** Test credentials — match the seed data (admin@acme.com / Password123!) */
export const TEST_EMAIL    = process.env.E2E_EMAIL    ?? 'admin@acme.com';
export const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'Password123!';
export const TEST_ORG_NAME = process.env.E2E_ORG      ?? 'Acme Corp';

/**
 * Logs in via the sign-in page and waits for dashboard redirect.
 * The app redirects to /dashboard after a successful login.
 */
export async function signIn(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/auth/login');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
}

/**
 * Signs out by clearing localStorage/cookies (fast path, no UI interaction).
 */
export async function signOut(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/auth/login');
}
