import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Full User Journey (Smoke Test)', () => {
  test('complete workflow: template → CSV → PDF', async ({ page }) => {
    // Step 1: Create template
    await page.goto('/');
    await page.click('text=Créer un template');
    
    // Add elements
    await page.click('[data-testid="add-text"]');
    await page.fill('[data-testid="text-content"]', '{{nom}}');
    
    await page.click('[data-testid="add-barcode"]');
    await page.selectOption('[data-testid="barcode-format"]', 'EAN13');
    await page.fill('[data-testid="barcode-value"]', '{{ean}}');
    
    // Save template
    await page.click('[data-testid="save-template"]');
    await page.fill('[data-testid="template-name"]', 'E2E Test Template');
    await page.click('[data-testid="confirm-save"]');
    await expect(page.locator('text=Template sauvegardé')).toBeVisible();
    
    // Step 2: Go to generation
    await page.click('text=Générer');
    
    // Select our template
    await page.click('[data-testid="template-select"]');
    await page.click('text=E2E Test Template');
    
    // Step 3: Upload CSV
    const csvPath = path.join(__dirname, '../docs/assets/test-data.csv');
    await page.setInputFiles('[data-testid="csv-upload"]', csvPath);
    await page.waitForSelector('[data-testid="csv-ready"]');
    
    // Step 4: Generate PDF
    await page.click('[data-testid="generate-pdf"]');
    await page.waitForSelector('[data-testid="pdf-ready"]', { timeout: 30000 });
    
    // Verify final result
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-pdf"]')).toHaveAttribute('href', /.pdf$/);
    
    console.log('✅ Full journey test passed!');
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/generate');
    
    // Try to generate without selecting template
    await page.click('[data-testid="generate-pdf"]');
    
    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Veuillez sélectionner un template');
  });
});
