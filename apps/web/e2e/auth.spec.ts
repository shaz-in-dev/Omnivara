import { test, expect } from '@playwright/test';
import { signIn, signOut, TEST_EMAIL, TEST_PASSWORD } from './helpers';

test.describe('Authentication', () => {
  // ── Sign up ──────────────────────────────────────────────────────────────────

  test('signup form submits and redirects away from /register', async ({ page }) => {
    const unique = `test_${Date.now()}@e2e.omnivara.dev`;

    await page.goto('/auth/register');
    // The register form has separate firstName / lastName fields
    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email/i).fill(unique);
    await page.getByLabel(/company/i).fill('E2E Corp');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /create account|sign up|get started/i }).click();

    // After signup the user lands on dashboard or onboarding — NOT still on /register
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
  });

  // ── Login ────────────────────────────────────────────────────────────────────

  test('login with valid credentials → lands on dashboard', async ({ page }) => {
    await signIn(page);

    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10_000 });
    // Page should render without crashing (at minimum the root layout renders)
    await expect(page.locator('body')).toBeVisible();
  });

  test('login with invalid password → shows error message', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill('WrongPassword999!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await expect(page.getByText(/invalid|incorrect|wrong|credentials/i)).toBeVisible({ timeout: 8_000 });
  });

  // ── Forgot / reset password ──────────────────────────────────────────────────

  test('forgot password page renders and accepts email', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send|reset|submit/i }).click();

    // Should show a success/confirmation message
    await expect(page.getByText(/check your email|sent|link/i)).toBeVisible({ timeout: 8_000 });
  });

  // ── Logout ───────────────────────────────────────────────────────────────────

  test('logout clears session and redirects to login', async ({ page }) => {
    await signIn(page);

    // Open user menu and click logout
    await page.getByRole('button', { name: /account|profile|user|sign out|logout/i }).first().click();
    const logoutBtn = page.getByRole('menuitem', { name: /sign out|logout/i });
    if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await logoutBtn.click();
    } else {
      await signOut(page);
    }

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8_000 });
  });

  // ── Auth guard ───────────────────────────────────────────────────────────────

  test('unauthenticated access to /crm redirects to login', async ({ page }) => {
    await signOut(page);
    await page.goto('/crm/leads');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8_000 });
  });
});
