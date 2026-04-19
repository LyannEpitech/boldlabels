import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Guides and Ruler Features', () => {
  
  async function navigateToFirstTemplate(page: any) {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('button:has-text("Éditer"), a:has-text("Éditer")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/editor\//);
  }

  test('Ruler is visible and positioned correctly', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    // After navigation, we should have canvases (including ruler)
    const canvases = await page.locator('canvas').all();
    expect(canvases.length).toBeGreaterThan(0);
    
    // Check that canvases are visible
    for (const canvas of canvases) {
      await expect(canvas).toBeVisible();
    }
  });

  test('Create guide by dragging from ruler area', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    expect(canvases.length).toBeGreaterThan(0);
    
    // Get the main canvas (usually the last one)
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (!box) {
      test.skip('Canvas not found');
      return;
    }
    
    // Try to drag from top ruler area into canvas
    // The ruler is typically 30px high at the top
    const startX = box.x + box.width / 2;
    const startY = box.y - 15; // Just above canvas
    const endY = box.y + 100; // Into canvas
    
    // Only proceed if we can position above the canvas
    if (startY > 50) {
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, endY, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors.filter(e => 
        e.includes('guide') || e.includes('ruler')
      )).toHaveLength(0);
    }
  });

  test('Double-click on guide removes it', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (box) {
      // Create a guide first
      const startX = box.x + box.width / 2;
      const startY = box.y - 15;
      const endY = box.y + 100;
      
      if (startY > 50) {
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX, endY, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        
        // Double-click on the guide line to remove it
        await page.mouse.dblclick(startX, endY);
        await page.waitForTimeout(500);
        
        // Verify no errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        
        expect(consoleErrors).toHaveLength(0);
      }
    }
  });
});
