# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capture_demo.spec.ts >> Demo Screenshots >> capture template and PDF workflow
- Location: e2e/capture_demo.spec.ts:5:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="Nom"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "🏷️ BoldLabels" [level=1] [ref=e7]
        - paragraph [ref=e8]: Gérez vos templates et mappings
      - button "Nouveau template" [active] [ref=e9]:
        - img [ref=e10]
        - text: Nouveau template
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "Templates" [level=2] [ref=e13]:
          - img [ref=e14]
          - text: Templates
        - generic [ref=e17]:
          - img [ref=e18]
          - paragraph [ref=e21]: Aucun template
      - generic [ref=e22]:
        - heading "Mes Mappings" [level=2] [ref=e23]:
          - img [ref=e24]
          - text: Mes Mappings
        - generic [ref=e27]:
          - img [ref=e28]
          - heading "Aucun mapping" [level=3] [ref=e31]
          - paragraph [ref=e32]: Créez un mapping depuis un template pour générer des PDF rapidement
  - generic [ref=e35]:
    - generic [ref=e36]:
      - heading "Nouveau template" [level=2] [ref=e37]
      - button [ref=e38]:
        - img [ref=e39]
    - generic [ref=e43]:
      - generic [ref=e44]:
        - generic [ref=e45]: Nom du template
        - textbox "Mon template" [ref=e46]
      - generic [ref=e47]:
        - generic [ref=e48]: Format prédéfini
        - generic [ref=e49]:
          - button "Avery 5160 63.5×25.4mm" [ref=e50]:
            - generic [ref=e51]: Avery 5160
            - generic [ref=e52]: 63.5×25.4mm
          - button "Avery 5163 101.6×50.8mm" [ref=e53]:
            - generic [ref=e54]: Avery 5163
            - generic [ref=e55]: 101.6×50.8mm
          - button "Avery 5164 101.6×139.7mm" [ref=e56]:
            - generic [ref=e57]: Avery 5164
            - generic [ref=e58]: 101.6×139.7mm
          - button "Avery 5167 38.1×21.2mm" [ref=e59]:
            - generic [ref=e60]: Avery 5167
            - generic [ref=e61]: 38.1×21.2mm
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e64]: Largeur (mm)
          - spinbutton [ref=e65]: "50"
        - generic [ref=e66]:
          - generic [ref=e67]: Hauteur (mm)
          - spinbutton [ref=e68]: "25"
      - generic [ref=e69]:
        - button "Annuler" [ref=e70]
        - button "Créer" [ref=e71]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | 
  4  | test.describe('Demo Screenshots', () => {
  5  |   test('capture template and PDF workflow', async ({ page }) => {
  6  |     // 1. Dashboard
  7  |     await page.goto('http://localhost:5173');
  8  |     await page.waitForTimeout(2000);
  9  |     await page.screenshot({ path: '/home/lyann/agents/grosrenzo/01_dashboard.png', fullPage: true });
  10 |     
  11 |     // 2. Create template
  12 |     await page.click('text=Nouveau template');
  13 |     await page.waitForTimeout(1000);
> 14 |     await page.fill('input[placeholder*="Nom"]', 'Demo Template');
     |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
  15 |     await page.fill('input[placeholder*="Largeur"]', '60');
  16 |     await page.fill('input[placeholder*="Hauteur"]', '40');
  17 |     await page.click('button:has-text("Créer")');
  18 |     await page.waitForTimeout(2000);
  19 |     
  20 |     // 3. Editor with template
  21 |     await page.screenshot({ path: '/home/lyann/agents/grosrenzo/02_editor.png', fullPage: true });
  22 |     
  23 |     // 4. Add text element
  24 |     await page.click('text=Texte');
  25 |     await page.fill('[placeholder*="Contenu"]', '{{nom}}');
  26 |     await page.click('text=Ajouter');
  27 |     await page.waitForTimeout(500);
  28 |     
  29 |     // 5. Add barcode
  30 |     await page.click('text=Code-barres');
  31 |     await page.selectOption('select', 'EAN13');
  32 |     await page.fill('[placeholder*="Valeur"]', '{{ean}}');
  33 |     await page.click('text=Ajouter');
  34 |     await page.waitForTimeout(500);
  35 |     
  36 |     // 6. Template with elements
  37 |     await page.screenshot({ path: '/home/lyann/agents/grosrenzo/03_template_complete.png', fullPage: true });
  38 |     
  39 |     // Save template
  40 |     await page.click('text=Sauvegarder');
  41 |     await page.waitForTimeout(1000);
  42 |     
  43 |     // 7. Go to generation
  44 |     await page.goto('http://localhost:5173/generate');
  45 |     await page.waitForTimeout(2000);
  46 |     
  47 |     // Select template
  48 |     await page.click('text=Demo Template');
  49 |     await page.waitForTimeout(500);
  50 |     await page.screenshot({ path: '/home/lyann/agents/grosrenzo/04_generation.png', fullPage: true });
  51 |     
  52 |     // 8. Upload CSV
  53 |     const csvContent = 'nom,ean,prix\nProduit Demo,3666154117284,19.99\nTest Product,8712563742158,29.99\n';
  54 |     fs.writeFileSync('/tmp/demo_products.csv', csvContent);
  55 |     await page.setInputFiles('input[type="file"]', '/tmp/demo_products.csv');
  56 |     await page.waitForTimeout(2000);
  57 |     await page.screenshot({ path: '/home/lyann/agents/grosrenzo/05_csv_loaded.png', fullPage: true });
  58 |     
  59 |     // 9. Generate PDF
  60 |     await page.click('button:has-text("Générer")');
  61 |     await page.waitForTimeout(5000);
  62 |     await page.screenshot({ path: '/home/lyann/agents/grosrenzo/06_pdf_generated.png', fullPage: true });
  63 |     
  64 |     console.log('✅ All screenshots captured!');
  65 |   });
  66 | });
  67 | 
```