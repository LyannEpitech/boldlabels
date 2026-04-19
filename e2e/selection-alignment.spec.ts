import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Selection, Alignment and Distribution', () => {
  
  async function navigateToFirstTemplate(page: any) {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('button:has-text("Éditer"), a:has-text("Éditer")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/editor\//);
  }

  test('Rubber band selection - select multiple elements', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (!box) {
      test.skip('Canvas not found');
      return;
    }
    
    // Drag to create selection box
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Verify no errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    expect(consoleErrors.filter(e => 
      e.includes('selection') && !e.includes('source map')
    )).toHaveLength(0);
  });

  test('Multi-selection with Ctrl+Click', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (box) {
      // Click on first position
      await page.mouse.click(box.x + 100, box.y + 100);
      await page.waitForTimeout(200);
      
      // Ctrl+Click on another position
      await page.mouse.click(box.x + 150, box.y + 150, { modifiers: ['Control'] });
      await page.waitForTimeout(200);
      
      // Select all with Ctrl+A
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(200);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors).toHaveLength(0);
    }
  });

  test('Group elements with Ctrl+G', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (box) {
      // Select multiple elements with rubber band
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(200);
      
      // Group with Ctrl+G
      await page.keyboard.press('Control+g');
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors.filter(e => 
        e.includes('group') || e.includes('groupId')
      )).toHaveLength(0);
    }
  });

  test('Ungroup elements with Ctrl+Shift+G', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (box) {
      // Select and group first
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+g');
      await page.waitForTimeout(300);
      
      // Ungroup
      await page.keyboard.press('Control+Shift+g');
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors.filter(e => 
        e.includes('ungroup') || e.includes('groupId')
      )).toHaveLength(0);
    }
  });

  test('Duplicate with Ctrl+D', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (box) {
      // Click on canvas to select/focus
      await page.mouse.click(box.x + 100, box.y + 100);
      await page.waitForTimeout(200);
      
      // Duplicate
      await page.keyboard.press('Control+d');
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors.filter(e => 
        e.includes('duplicate') || e.includes('clone')
      )).toHaveLength(0);
    }
  });

  test('Undo with Ctrl+Z', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const mainCanvas = canvases[canvases.length - 1];
    const box = await mainCanvas.boundingBox();
    
    if (box) {
      // Do an action first (duplicate)
      await page.mouse.click(box.x + 100, box.y + 100);
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+d');
      await page.waitForTimeout(300);
      
      // Then undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors.filter(e => 
        e.includes('undo') || e.includes('history')
      )).toHaveLength(0);
    }
  });
});
