import { test, expect } from '@playwright/test';

test.describe('Nouvelle Interface UX/UI', () => {
  test('capture dashboard avec bouton template', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: '/home/lyann/agents/grosrenzo/new_01_dashboard.png',
      fullPage: false 
    });
    console.log('Dashboard avec boutons Nouveau/Depuis template');
  });

  test('capture TemplateGallery modal', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Ouvrir la gallery
    const galleryBtn = page.locator('button:has-text("Depuis un template")');
    await galleryBtn.waitFor({ state: 'visible', timeout: 10000 });
    await galleryBtn.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: '/home/lyann/agents/grosrenzo/new_02_gallery.png',
      fullPage: false 
    });
    console.log('TemplateGallery avec 3 templates');
    
    // Sélectionner Retail Minimal
    await page.click('text=Retail Minimal');
    await page.waitForTimeout(3000);
  });

  test('capture éditeur avec bouton Aperçu', async ({ page }) => {
    // Aller directement à l'éditeur
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Cliquer sur un template existant ou créer
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible().catch(() => false)) {
      await firstTemplate.click();
    } else {
      // Créer depuis preset
      await page.click('text=Depuis un template');
      await page.waitForTimeout(1000);
      await page.click('text=Retail Minimal');
      await page.waitForTimeout(2000);
    }
    
    await page.waitForTimeout(3000);
    
    // Capture avec bouton Aperçu visible
    await page.screenshot({ 
      path: '/home/lyann/agents/grosrenzo/new_03_editor.png',
      fullPage: false 
    });
    console.log('Éditeur avec bouton Aperçu');
  });

  test('capture LivePreview panel', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Ouvrir un template
    const galleryBtn = page.locator('button:has-text("Depuis un template")');
    if (await galleryBtn.isVisible().catch(() => false)) {
      await galleryBtn.click();
      await page.waitForTimeout(1000);
      await page.click('text=Retail Minimal');
      await page.waitForTimeout(2000);
    }
    
    // Cliquer sur Aperçu
    const apercuBtn = page.locator('button:has-text("Aperçu")');
    await apercuBtn.waitFor({ state: 'visible', timeout: 10000 });
    await apercuBtn.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: '/home/lyann/agents/grosrenzo/new_04_preview.png',
      fullPage: false 
    });
    console.log('Éditeur avec panneau LivePreview ouvert');
  });
});
