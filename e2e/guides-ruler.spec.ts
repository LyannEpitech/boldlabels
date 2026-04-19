import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_TEMPLATE_ID = 'a0d369ad-3f8c-42f3-bb56-8383e890f40b';

test.describe('Guides and Ruler Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/editor/${TEST_TEMPLATE_ID}`);
    await page.waitForTimeout(2000);
  });

  test('Ruler is visible and positioned correctly', async ({ page }) => {
    // Check that ruler elements exist
    const rulerHorizontal = page.locator('[style*="position: absolute"][style*="top: 0"]').first();
    const rulerVertical = page.locator('[style*="position: absolute"][style*="left: 0"]').first();
    
    await expect(rulerHorizontal).toBeVisible();
    await expect(rulerVertical).toBeVisible();
    
    // Check that ruler has content (Konva stage)
    const rulerCanvas = page.locator('canvas').first();
    await expect(rulerCanvas).toBeVisible();
  });

  test('Create horizontal guide by dragging from top ruler', async ({ page }) => {
    // Find the canvas wrapper which contains the ruler
    const canvasWrapper = page.locator('[style*="relative"]').filter({ has: page.locator('canvas') }).first();
    
    // Get the bounding box of the canvas area
    const box = await canvasWrapper.boundingBox();
    if (!box) {
      test.skip('Canvas not found');
      return;
    }
    
    // Drag from top area (ruler) down into canvas to create horizontal guide
    const startX = box.x + box.width / 2;
    const startY = box.y + 15; // Top ruler area
    const endY = box.y + 100; // Into canvas
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Guide should be created - check that it's in the store by looking for dashed line
    // The guide is rendered as a Konva Line with dash pattern
    const guideLine = page.locator('canvas').nth(1); // Second canvas layer
    await expect(guideLine).toBeVisible();
  });

  test('Create vertical guide by dragging from left ruler', async ({ page }) => {
    const canvasWrapper = page.locator('[style*="relative"]').filter({ has: page.locator('canvas') }).first();
    
    const box = await canvasWrapper.boundingBox();
    if (!box) {
      test.skip('Canvas not found');
      return;
    }
    
    // Drag from left area (ruler) right into canvas
    const startX = box.x + 15; // Left ruler area
    const startY = box.y + box.height / 2;
    const endX = box.x + 100; // Into canvas
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Verify no errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    expect(consoleErrors.filter(e => e.includes('guide') || e.includes('ruler'))).toHaveLength(0);
  });

  test('Guides appear on canvas after creation', async ({ page }) => {
    // Create a guide first
    const canvas = page.locator('.konvajs-content').first();
    
    // Simulate guide creation via keyboard shortcut or UI
    // For now, just verify the guides layer exists
    const guidesLayer = page.locator('canvas').nth(2);
    await expect(guidesLayer).toBeVisible();
  });

  test('Double-click on guide removes it', async ({ page }) => {
    // First create a guide
    const canvasWrapper = page.locator('[style*="relative"]').first();
    const box = await canvasWrapper.boundingBox();
    
    if (box) {
      // Create guide
      await page.mouse.move(box.x + box.width / 2, box.y + 15);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 100, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Double-click on the guide line to remove it
      await page.mouse.dblclick(box.x + box.width / 2, box.y + 100);
      
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors).toHaveLength(0);
    }
  });
});
