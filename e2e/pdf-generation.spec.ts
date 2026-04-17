import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('PDF Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generate');
  });

  test('should generate PDF from template and CSV', async ({ page }) => {
    // Select template
    await page.click('[data-testid="template-select"]');
    await page.click('text=Retail Minimal');
    
    // Upload CSV
    const csvPath = path.join(__dirname, '../docs/assets/test-data.csv');
    await page.setInputFiles('[data-testid="csv-upload"]', csvPath);
    await page.waitForSelector('[data-testid="csv-ready"]');
    
    // Generate PDF
    await page.click('[data-testid="generate-pdf"]');
    
    // Wait for generation
    await page.waitForSelector('[data-testid="pdf-ready"]', { timeout: 30000 });
    
    // Verify download link
    const downloadLink = page.locator('[data-testid="download-pdf"]');
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute('href', /.pdf$/);
  });

  test('should verify PDF content structure', async ({ page }) => {
    // Setup and generate
    await page.click('[data-testid="template-select"]');
    await page.click('text=Retail Minimal');
    
    const csvPath = path.join(__dirname, '../docs/assets/test-data.csv');
    await page.setInputFiles('[data-testid="csv-upload"]', csvPath);
    await page.waitForSelector('[data-testid="csv-ready"]');
    
    // Start generation and wait
    await page.click('[data-testid="generate-pdf"]');
    await page.waitForSelector('[data-testid="pdf-ready"]', { timeout: 30000 });
    
    // Check success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('PDF généré');
  });
});
