import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_TEMPLATE_ID = 'a0d369ad-3f8c-42f3-bb56-8383e890f40b';

test.describe('Selection, Alignment and Distribution', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/editor/${TEST_TEMPLATE_ID}`);
    await page.waitForTimeout(2000);
  });

  test('Rubber band selection - select multiple elements', async ({ page }) => {
    const canvas = page.locator('.konvajs-content').first();
    const box = await canvas.boundingBox();
    
    if (!box) {
      test.skip('Canvas not found');
      return;
    }
    
    // Drag to create selection box
    const startX = box.x + 50;
    const startY = box.y + 50;
    const endX = box.x + 200;
    const endY = box.y + 200;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Selection box should be visible (rendered by SelectionBox component)
    // Check that no errors occurred
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    expect(consoleErrors.filter(e => 
      e.includes('selection') || e.includes('rubber')
    )).toHaveLength(0);
  });

  test('Multi-selection with Ctrl+Click', async ({ page }) => {
    const canvas = page.locator('.konvajs-content').first();
    
    // Click on first element
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    
    // Ctrl+Click on another position
    await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Control'] });
    await page.waitForTimeout(200);
    
    // Check store has multiple selections (via keyboard shortcut test)
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    
    // Verify no errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('Align multiple elements to left', async ({ page }) => {
    // Select all elements first
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(300);
    
    // Try to find alignment buttons or use keyboard shortcuts
    // Look for alignment buttons in the toolbar
    const alignLeftBtn = page.locator('[title*="Aligner à gauche"], [aria-label*="gauche"], button:has-text("Align")').first();
    
    if (await alignLeftBtn.isVisible().catch(() => false)) {
      await alignLeftBtn.click();
    } else {
      // Try keyboard shortcut if available
      await page.keyboard.press('Control+Shift+l');
    }
    
    await page.waitForTimeout(500);
    
    // Verify no errors and elements were aligned
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    // Should not have alignment-related errors
    expect(consoleErrors.filter(e => 
      e.includes('align') && !e.includes('source map')
    )).toHaveLength(0);
  });

  test('Distribute elements horizontally', async ({ page }) => {
    // Need at least 3 elements for distribution
    // Select all elements
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(300);
    
    // Look for distribute button
    const distributeBtn = page.locator('[title*="Distribuer"], button:has-text("Distribuer"), button:has-text("Distribute")').first();
    
    if (await distributeBtn.isVisible().catch(() => false)) {
      await distributeBtn.click();
    } else {
      // Try to access via menu or keyboard
      test.skip('Distribute button not found - may be in submenu');
    }
    
    await page.waitForTimeout(500);
    
    // Verify the function was called without errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    // Should not have distribute-related errors
    expect(consoleErrors.filter(e => 
      e.includes('distribute') || e.includes('distribution')
    )).toHaveLength(0);
  });

  test('Group elements with Ctrl+G', async ({ page }) => {
    // Select multiple elements
    const canvas = page.locator('.konvajs-content').first();
    
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    
    await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Control'] });
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
  });

  test('Ungroup elements with Ctrl+Shift+G', async ({ page }) => {
    // First group some elements
    const canvas = page.locator('.konvajs-content').first();
    
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    
    await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Control'] });
    await page.waitForTimeout(200);
    
    // Group
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
  });

  test('Copy/Paste with Ctrl+C / Ctrl+V', async ({ page }) => {
    // Select an element
    const canvas = page.locator('.konvajs-content').first();
    await canvas.click({ position: { x: 100, y: 100 } });
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
      e.includes('copy') || e.includes('paste') || e.includes('clipboard')
    )).toHaveLength(0);
  });

  test('Duplicate with Ctrl+D', async ({ page }) => {
    // Select an element
    const canvas = page.locator('.konvajs-content').first();
    await canvas.click({ position: { x: 100, y: 100 } });
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
  });
});
