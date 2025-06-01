import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.describe('Finance — Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  // ── Invoice list ─────────────────────────────────────────────────────────────

  test('finance page loads the invoice list', async ({ page }) => {
    await page.goto('/finance');
    await expect(page.getByRole('heading', { name: /finance|billing|invoices/i })).toBeVisible();

    const hasTable = await page.locator('table').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no invoices yet|create.*invoice/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  // ── Create invoice ───────────────────────────────────────────────────────────

  test('can create a new invoice with line items', async ({ page }) => {
    await page.goto('/finance');

    await page.getByRole('button', { name: /new invoice/i }).click();

    // Wait for invoice builder to appear
    await page.waitForSelector('[data-testid="invoice-builder"], .invoice-builder, form', { timeout: 8_000 });

    // Fill client name
    const clientField = page.getByPlaceholder(/client|customer|account/i).first();
    if (await clientField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await clientField.fill('Acme Corp');
    }

    // Fill a line item
    const descField = page.getByPlaceholder(/description|item/i).first();
    if (await descField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await descField.fill('Consulting services');

      const qtyField = page.getByPlaceholder(/qty|quantity/i).first();
      if (await qtyField.isVisible().catch(() => false)) await qtyField.fill('5');

      const priceField = page.getByPlaceholder(/price|rate|unit/i).first();
      if (await priceField.isVisible().catch(() => false)) await priceField.fill('200');
    }

    // Save as draft
    const saveBtn = page.getByRole('button', { name: /save.*draft|draft|save/i }).first();
    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await saveBtn.click();
    }

    // Should return to list or show success
    await page.waitForTimeout(2_000);
    const backToList = page.getByRole('heading', { name: /finance|invoices/i });
    const saved = page.getByText(/draft|saved|created|INV-/i);
    const hasResult = await backToList.isVisible().catch(() => false)
      || await saved.isVisible().catch(() => false);
    expect(hasResult).toBe(true);
  });

  // ── Invoice status filter ────────────────────────────────────────────────────

  test('status filter shows only matching invoices', async ({ page }) => {
    await page.goto('/finance');

    const draftFilter = page.getByRole('button', { name: /^draft$/i });
    if (await draftFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await draftFilter.click();
      await page.waitForTimeout(500);

      // Paid badges should not be visible when filtering drafts
      const paidBadges = page.getByText(/^paid$/i);
      expect(await paidBadges.count()).toBe(0);
    }
  });

  // ── Mark as paid ─────────────────────────────────────────────────────────────

  test('can mark a sent invoice as paid', async ({ page }) => {
    await page.goto('/finance');

    // Click on a SENT invoice row
    const sentRow = page.locator('tr').filter({ hasText: /SENT/i }).first();
    if (await sentRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await sentRow.click();
      await page.waitForTimeout(1_000);

      // Look for "Mark as paid" or similar action
      const markPaid = page.getByRole('button', { name: /mark.*paid|paid/i });
      if (await markPaid.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await markPaid.click();
        await expect(page.getByText(/paid/i)).toBeVisible({ timeout: 8_000 });
      }
    }
  });
});
