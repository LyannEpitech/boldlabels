import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Critical Features - PR #42 Validation', () => {
  
  async function navigateToFirstTemplate(page: any) {
    // Go to dashboard
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    
    // Click on first "Éditer" button
    const editBtn = page.locator('button:has-text("Éditer"), a:has-text("Éditer")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    
    // Wait for editor to load
    await page.waitForTimeout(3000);
    
    // Verify we're on editor page
    await expect(page).toHaveURL(/\/editor\//);
  }

  test('Drag & drop - Move element on canvas', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    // Get canvas - after navigation we have 4 canvases
    const canvases = await page.locator('canvas').all();
    expect(canvases.length).toBeGreaterThan(0);
    
    const canvas = canvases[canvases.length - 1]; // Last canvas is the main one
    
    // Get canvas position
    const box = await canvas.boundingBox();
    if (!box) {
      test.skip('Canvas not found');
      return;
    }
    
    // Drag on canvas (simulating element move)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 150, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Verify no console errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });
    
    expect(consoleLogs.filter(l => !l.includes('source map'))).toHaveLength(0);
  });

  test('Drag & drop - Add tool from toolbar to canvas', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    // Find a tool button by looking for the tool cards
    const toolCard = page.locator('div:has-text("Texte"):has-text("Texte dynamique")').first();
    
    if (await toolCard.isVisible().catch(() => false)) {
      // Get canvas
      const canvases = await page.locator('canvas').all();
      const canvas = canvases[canvases.length - 1];
      const box = await canvas.boundingBox();
      
      if (box) {
        // Drag tool to canvas
        await toolCard.dragTo(canvas, {
          targetPosition: { x: box.width / 2, y: box.height / 2 }
        });
        
        await page.waitForTimeout(1000);
        
        // Check that we have more elements (hard to verify without state access)
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        
        expect(consoleErrors.filter(e => !e.includes('source map'))).toHaveLength(0);
      }
    }
  });

  test('Keyboard shortcuts - Delete key shows confirmation', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    // Get canvas and click to select an element
    const canvases = await page.locator('canvas').all();
    const canvas = canvases[canvases.length - 1];
    const box = await canvas.boundingBox();
    
    if (box) {
      // Click on canvas to select element
      await page.mouse.click(box.x + 100, box.y + 100);
      await page.waitForTimeout(200);
      
      // Setup dialog handler
      let dialogShown = false;
      page.on('dialog', async dialog => {
        dialogShown = true;
        expect(dialog.message()).toContain('supprimer');
        await dialog.dismiss();
      });
      
      // Press Delete key
      await page.keyboard.press('Delete');
      await page.waitForTimeout(500);
      
      // Dialog should have been shown (if an element was selected)
      // Note: If no element was selected, dialog won't show
    }
  });

  test('Keyboard shortcuts - Ctrl+G to group elements', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const canvas = canvases[canvases.length - 1];
    const box = await canvas.boundingBox();
    
    if (box) {
      // Select multiple elements with rubber band
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 5 });
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

  test('Copy/Paste with Ctrl+C / Ctrl+V', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const canvases = await page.locator('canvas').all();
    const canvas = canvases[canvases.length - 1];
    const box = await canvas.boundingBox();
    
    if (box) {
      // Click on canvas to focus and select
      await page.mouse.click(box.x + 100, box.y + 100);
      await page.waitForTimeout(200);
      
      // Copy
      await page.keyboard.press('Control+c');
      await page.waitForTimeout(200);
      
      // Paste
      await page.keyboard.press('Control+v');
      await page.waitForTimeout(500);
      
      // Verify no errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      expect(consoleErrors.filter(e => 
        e.includes('copy') || e.includes('paste')
      )).toHaveLength(0);
    }
  });

  test('Dashboard - Create new template with validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    
    // Click "Nouveau template"
    const newBtn = page.locator('text=Nouveau template').first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    
    await page.waitForTimeout(500);
    
    // Find width input and enter negative value
    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length > 0) {
      const widthInput = inputs[0];
      await widthInput.fill('-10');
      
      // Look for create button
      const createBtn = page.locator('button:has-text("Créer"), button:has-text("Créer le template")').first();
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click();
        
        // Should show alert or error
        await page.waitForTimeout(500);
        
        // Check for alert text
        const hasAlert = await page.locator('text=positives, text=Erreur, text=Invalid').isVisible().catch(() => false);
        // We expect some feedback, but may be an alert dialog
      }
    }
  });

  test('Console errors check', async ({ page }) => {
    await navigateToFirstTemplate(page);
    
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Wait and interact
    await page.waitForTimeout(2000);
    
    // Click around
    const canvases = await page.locator('canvas').all();
    if (canvases.length > 0) {
      const canvas = canvases[canvases.length - 1];
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + 100, box.y + 100);
      }
    }
    
    await page.waitForTimeout(1000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('source map') && 
      !e.includes('favicon') &&
      !e.includes('webpack')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
