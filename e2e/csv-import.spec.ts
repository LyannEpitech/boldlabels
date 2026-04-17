import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CSV Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generate');
  });

  test('should upload and parse CSV file', async ({ page }) => {
    const csvPath = path.join(__dirname, '../docs/assets/test-data.csv');
    
    // Upload CSV
    await page.setInputFiles('[data-testid="csv-upload"]', csvPath);
    
    // Wait for parsing
    await page.waitForSelector('[data-testid="csv-preview"]');
    
    // Verify data is parsed
    const rowCount = await page.locator('[data-testid="csv-row"]').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should detect column mappings', async ({ page }) => {
    const csvPath = path.join(__dirname, '../docs/assets/test-data.csv');
    
    await page.setInputFiles('[data-testid="csv-upload"]', csvPath);
    await page.waitForSelector('[data-testid="mapping-panel"]');
    
    // Verify auto-detected mappings
    await expect(page.locator('[data-testid="mapping-nom"]')).toHaveValue('nom');
    await expect(page.locator('[data-testid="mapping-ean"]')).toHaveValue('ean');
  });

  test('should show correct row count', async ({ page }) => {
    const csvPath = path.join(__dirname, '../docs/assets/test-data.csv');
    
    await page.setInputFiles('[data-testid="csv-upload"]', csvPath);
    await page.waitForSelector('[data-testid="row-count"]');
    
    const countText = await page.locator('[data-testid="row-count"]').textContent();
    expect(countText).toMatch(/\d+ produits? détectés/);
  });
});
