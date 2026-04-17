import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Demo Screenshots', () => {
  test('capture template and PDF workflow', async ({ page }) => {
    // 1. Dashboard
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/lyann/agents/grosrenzo/01_dashboard.png', fullPage: true });
    
    // 2. Create template
    await page.click('text=Nouveau template');
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder*="Nom"]', 'Demo Template');
    await page.fill('input[placeholder*="Largeur"]', '60');
    await page.fill('input[placeholder*="Hauteur"]', '40');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(2000);
    
    // 3. Editor with template
    await page.screenshot({ path: '/home/lyann/agents/grosrenzo/02_editor.png', fullPage: true });
    
    // 4. Add text element
    await page.click('text=Texte');
    await page.fill('[placeholder*="Contenu"]', '{{nom}}');
    await page.click('text=Ajouter');
    await page.waitForTimeout(500);
    
    // 5. Add barcode
    await page.click('text=Code-barres');
    await page.selectOption('select', 'EAN13');
    await page.fill('[placeholder*="Valeur"]', '{{ean}}');
    await page.click('text=Ajouter');
    await page.waitForTimeout(500);
    
    // 6. Template with elements
    await page.screenshot({ path: '/home/lyann/agents/grosrenzo/03_template_complete.png', fullPage: true });
    
    // Save template
    await page.click('text=Sauvegarder');
    await page.waitForTimeout(1000);
    
    // 7. Go to generation
    await page.goto('http://localhost:5173/generate');
    await page.waitForTimeout(2000);
    
    // Select template
    await page.click('text=Demo Template');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/lyann/agents/grosrenzo/04_generation.png', fullPage: true });
    
    // 8. Upload CSV
    const csvContent = 'nom,ean,prix\nProduit Demo,3666154117284,19.99\nTest Product,8712563742158,29.99\n';
    fs.writeFileSync('/tmp/demo_products.csv', csvContent);
    await page.setInputFiles('input[type="file"]', '/tmp/demo_products.csv');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/lyann/agents/grosrenzo/05_csv_loaded.png', fullPage: true });
    
    // 9. Generate PDF
    await page.click('button:has-text("Générer")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/lyann/agents/grosrenzo/06_pdf_generated.png', fullPage: true });
    
    console.log('✅ All screenshots captured!');
  });
});
