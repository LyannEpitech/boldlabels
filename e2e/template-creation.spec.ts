import { test, expect } from '@playwright/test';

test.describe('Template Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Créer un template');
  });

  test('should create template with text element', async ({ page }) => {
    // Add text element
    await page.click('[data-testid="add-text"]');
    await page.fill('[data-testid="text-content"]', 'Nom du produit');
    
    // Verify element is added
    await expect(page.locator('.canvas-text')).toBeVisible();
    await expect(page.locator('.canvas-text')).toContainText('Nom du produit');
  });

  test('should add barcode element', async ({ page }) => {
    await page.click('[data-testid="add-barcode"]');
    await page.selectOption('[data-testid="barcode-format"]', 'EAN13');
    await page.fill('[data-testid="barcode-value"]', '3666154117284');
    
    await expect(page.locator('.canvas-barcode')).toBeVisible();
  });

  test('should add QR code element', async ({ page }) => {
    await page.click('[data-testid="add-qrcode"]');
    await page.fill('[data-testid="qr-content"]', 'https://boldlabels.app');
    
    await expect(page.locator('.canvas-qrcode')).toBeVisible();
  });

  test('should configure colors and save', async ({ page }) => {
    // Set background color
    await page.fill('[data-testid="bg-color"]', '#FFFFFF');
    await page.fill('[data-testid="border-color"]', '#000000');
    await page.fill('[data-testid="border-width"]', '2');
    
    // Save template
    await page.click('[data-testid="save-template"]');
    await page.fill('[data-testid="template-name"]', 'Test Template E2E');
    await page.click('[data-testid="confirm-save"]');
    
    // Verify success
    await expect(page.locator('text=Template sauvegardé')).toBeVisible();
  });
});
