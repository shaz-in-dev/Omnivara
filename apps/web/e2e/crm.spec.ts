import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.describe('CRM — Leads', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  // ── Leads list ───────────────────────────────────────────────────────────────

  test('leads page loads and shows the list or empty state', async ({ page }) => {
    await page.goto('/crm/leads');
    await expect(page.getByRole('heading', { name: /leads/i })).toBeVisible();

    // Either there are rows or the empty state is shown
    const hasRows = await page.locator('table tbody tr').count() > 0;
    const hasEmpty = await page.getByText(/no leads yet|add your first/i).isVisible().catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);
  });

  // ── Create lead ──────────────────────────────────────────────────────────────

  test('can create a new lead', async ({ page }) => {
    await page.goto('/crm/leads');

    await page.getByRole('button', { name: /add lead/i }).click();
    await page.waitForSelector('[role="dialog"], form', { timeout: 5_000 });

    const name = `E2E Lead ${Date.now()}`;
    await page.getByPlaceholder(/name/i).fill(name);
    await page.getByPlaceholder(/email/i).fill('e2elead@example.com').catch(() => {});
    await page.getByPlaceholder(/company/i).fill('E2E Corp').catch(() => {});

    await page.getByRole('button', { name: /create|save|add/i }).last().click();

    // Lead should appear in the table
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });

  // ── Status filter ────────────────────────────────────────────────────────────

  test('status filter narrows the leads list', async ({ page }) => {
    await page.goto('/crm/leads');

    // Click "new" status filter
    const filterBtn = page.getByRole('button', { name: /^new$/i });
    if (await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filterBtn.click();
      // URL or UI should update — just wait a bit for re-render
      await page.waitForTimeout(500);
      // Verify no leads with other statuses are shown (basic smoke)
      const qualifiedBadges = page.getByText(/^qualified$/i);
      const count = await qualifiedBadges.count();
      expect(count).toBe(0);
    }
  });

  // ── Search ───────────────────────────────────────────────────────────────────

  test('search box filters leads by name', async ({ page }) => {
    await page.goto('/crm/leads');

    const searchInput = page.getByPlaceholder(/search leads/i);
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('zzz_nonexistent_xyz_9999');
      await page.waitForTimeout(600);
      // Should show "no leads" message or empty table
      const hasNoResults = await page.getByText(/no leads match|no leads/i).isVisible().catch(() => false);
      const hasEmptyRows = (await page.locator('table tbody tr').count()) === 0;
      expect(hasNoResults || hasEmptyRows).toBe(true);
    }
  });

  // ── View lead detail ─────────────────────────────────────────────────────────

  test('clicking a lead row opens the detail drawer', async ({ page }) => {
    await page.goto('/crm/leads');

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstRow.click();
      // Drawer or detail panel should be visible
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('CRM — Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('contacts page loads', async ({ page }) => {
    await page.goto('/crm/contacts');
    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();
  });

  test('can create a new contact', async ({ page }) => {
    await page.goto('/crm/contacts');

    await page.getByRole('button', { name: /add contact/i }).click();
    await page.waitForSelector('[role="dialog"], form', { timeout: 5_000 });

    const name = `E2E Contact ${Date.now()}`;
    await page.getByPlaceholder(/name/i).fill(name);

    await page.getByRole('button', { name: /create|save|add/i }).last().click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });
});
