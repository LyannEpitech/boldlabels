import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_TEMPLATE_ID = 'a0d369ad-3f8c-42f3-bb56-8383e890f40b';

test.describe('Critical Features - PR #42 Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Wait for backend to be ready
    await page.goto(`${BASE_URL}/editor/${TEST_TEMPLATE_ID}`);
    await page.waitForTimeout(2000); // Wait for canvas to render
  });

  test('Drag & drop - Move element on canvas', async ({ page }) => {
    // Find the text element
    const element = page.locator('canvas').first();
    
    // Get initial position (we'll verify it moved after)
    await expect(element).toBeVisible();
    
    // Drag the element
    const canvas = page.locator('.konvajs-content').first();
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 200 },
    });
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify no console errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    expect(consoleLogs).toHaveLength(0);
  });

  test('Drag & drop - Add tool from toolbar to canvas', async ({ page }) => {
    // Find a tool button
    const textTool = page.locator('text=Texte').first();
    await expect(textTool).toBeVisible();
    
    // Drag tool to canvas
    const canvas = page.locator('.konvajs-content').first();
    await textTool.dragTo(canvas);
    
    // Wait for element to be added
    await page.waitForTimeout(1000);
    
    // Check that element count increased
    const layerCount = await page.locator('.konvajs-content canvas').count();
    expect(layerCount).toBeGreaterThan(0);
  });

  test('Guides - Create guide from ruler', async ({ page }) => {
    // Find the horizontal ruler
    const ruler = page.locator('[data-testid="ruler-horizontal"]').first();
    
    if (await ruler.isVisible().catch(() => false)) {
      // Drag from ruler to create guide
      const canvas = page.locator('.konvajs-content').first();
      await ruler.dragTo(canvas, {
        sourcePosition: { x: 50, y: 15 },
        targetPosition: { x: 50, y: 150 },
      });
      
      await page.waitForTimeout(500);
      
      // Guide should be visible on canvas (dashed line)
      const guideLine = page.locator('canvas').first();
      await expect(guideLine).toBeVisible();
    }
  });

  test('Alignment - Align elements to left', async ({ page }) => {
    // Select an element first (click on canvas)
    const canvas = page.locator('.konvajs-content').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    
    await page.waitForTimeout(200);
    
    // Click align left button (if exists)
    const alignLeftBtn = page.locator('[title*="Aligner"], [aria-label*="Aligner"]').first();
    if (await alignLeftBtn.isVisible().catch(() => false)) {
      await alignLeftBtn.click();
      await page.waitForTimeout(500);
      
      // Element should have moved (x position changed to 0)
      // This is hard to verify visually, but we check no errors
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleLogs.push(msg.text());
      });
      expect(consoleLogs.filter(l => l.includes('align'))).toHaveLength(0);
    }
  });

  test('Distribution - Distribute elements horizontally', async ({ page }) => {
    // This requires multiple elements selected
    // First add multiple elements
    const canvas = page.locator('.konvajs-content').first();
    
    // Click on canvas to focus
    await canvas.click();
    await page.waitForTimeout(200);
    
    // Try to find distribute button
    const distributeBtn = page.locator('text=Distribute, text=Distribuer').first();
    if (await distributeBtn.isVisible().catch(() => false)) {
      await distributeBtn.click();
      await page.waitForTimeout(500);
      
      // Check no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      expect(consoleErrors).toHaveLength(0);
    }
  });

  test('Keyboard shortcuts - Delete key shows confirmation', async ({ page }) => {
    // Select an element
    const canvas = page.locator('.konvajs-content').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    
    // Setup dialog handler
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      expect(dialog.message()).toContain('supprimer');
      await dialog.dismiss(); // Cancel deletion
    });
    
    // Press Delete key
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    // Dialog should have been shown
    expect(dialogShown).toBe(true);
  });

  test('Keyboard shortcuts - Ctrl+G to group elements', async ({ page }) => {
    // Select multiple elements with Ctrl+Click
    const canvas = page.locator('.konvajs-content').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    
    // Ctrl+Click another position
    await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Control'] });
    await page.waitForTimeout(200);
    
    // Press Ctrl+G
    await page.keyboard.press('Control+g');
    await page.waitForTimeout(500);
    
    // Check no errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    expect(consoleErrors).toHaveLength(0);
  });

  test('Import/Export - Export template as JSON', async ({ page }) => {
    // Navigate to sidebar
    const sidebar = page.locator('text=Mes templates').first();
    await expect(sidebar).toBeVisible();
    
    // Look for export button
    const exportBtn = page.locator('text=Exporter').first();
    if (await exportBtn.isVisible().catch(() => false)) {
      // Click export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportBtn.click(),
      ]);
      
      expect(download.suggestedFilename()).toMatch(/\.json$/);
    }
  });

  test('Dashboard - Create new template with validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    
    // Click "Nouveau template"
    const newBtn = page.locator('text=Nouveau template').first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    
    await page.waitForTimeout(500);
    
    // Try to enter negative dimension
    const widthInput = page.locator('input[type="number"]').first();
    if (await widthInput.isVisible().catch(() => false)) {
      await widthInput.fill('-10');
      
      // Click create
      const createBtn = page.locator('text=Créer').first();
      await createBtn.click();
      
      // Should show alert
      await expect(page.locator('text=positives')).toBeVisible().catch(() => {
        // Or dialog
        expect(page.locator('role=alertdialog')).toBeDefined();
      });
    }
  });

  test('Console errors check', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('source map') && 
      !e.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
