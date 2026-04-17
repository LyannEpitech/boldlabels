# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: new_interface.spec.ts >> Nouvelle Interface UX/UI >> capture LivePreview panel
- Location: e2e/new_interface.spec.ts:63:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Aperçu")') to be visible

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - heading "🏷️ BoldLabels" [level=1] [ref=e7]
      - paragraph [ref=e8]: Gérez vos templates et mappings
    - generic [ref=e9]:
      - button "Depuis un template" [ref=e10]:
        - img [ref=e11]
        - text: Depuis un template
      - button "Nouveau template" [ref=e16]:
        - img [ref=e17]
        - text: Nouveau template
  - generic [ref=e18]:
    - generic [ref=e19]:
      - heading "Templates" [level=2] [ref=e20]:
        - img [ref=e21]
        - text: Templates
      - generic [ref=e24]:
        - img [ref=e25]
        - paragraph [ref=e28]: Aucun template
    - generic [ref=e29]:
      - heading "Mes Mappings" [level=2] [ref=e30]:
        - img [ref=e31]
        - text: Mes Mappings
      - generic [ref=e34]:
        - img [ref=e35]
        - heading "Aucun mapping" [level=3] [ref=e38]
        - paragraph [ref=e39]: Créez un mapping depuis un template pour générer des PDF rapidement
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Nouvelle Interface UX/UI', () => {
  4  |   test('capture dashboard avec bouton template', async ({ page }) => {
  5  |     await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  6  |     await page.waitForTimeout(3000);
  7  |     
  8  |     await page.screenshot({ 
  9  |       path: '/home/lyann/agents/grosrenzo/new_01_dashboard.png',
  10 |       fullPage: false 
  11 |     });
  12 |     console.log('Dashboard avec boutons Nouveau/Depuis template');
  13 |   });
  14 | 
  15 |   test('capture TemplateGallery modal', async ({ page }) => {
  16 |     await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  17 |     await page.waitForTimeout(2000);
  18 |     
  19 |     // Ouvrir la gallery
  20 |     const galleryBtn = page.locator('button:has-text("Depuis un template")');
  21 |     await galleryBtn.waitFor({ state: 'visible', timeout: 10000 });
  22 |     await galleryBtn.click();
  23 |     await page.waitForTimeout(2000);
  24 |     
  25 |     await page.screenshot({ 
  26 |       path: '/home/lyann/agents/grosrenzo/new_02_gallery.png',
  27 |       fullPage: false 
  28 |     });
  29 |     console.log('TemplateGallery avec 3 templates');
  30 |     
  31 |     // Sélectionner Retail Minimal
  32 |     await page.click('text=Retail Minimal');
  33 |     await page.waitForTimeout(3000);
  34 |   });
  35 | 
  36 |   test('capture éditeur avec bouton Aperçu', async ({ page }) => {
  37 |     // Aller directement à l'éditeur
  38 |     await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  39 |     await page.waitForTimeout(2000);
  40 |     
  41 |     // Cliquer sur un template existant ou créer
  42 |     const firstTemplate = page.locator('[data-testid="template-card"]').first();
  43 |     if (await firstTemplate.isVisible().catch(() => false)) {
  44 |       await firstTemplate.click();
  45 |     } else {
  46 |       // Créer depuis preset
  47 |       await page.click('text=Depuis un template');
  48 |       await page.waitForTimeout(1000);
  49 |       await page.click('text=Retail Minimal');
  50 |       await page.waitForTimeout(2000);
  51 |     }
  52 |     
  53 |     await page.waitForTimeout(3000);
  54 |     
  55 |     // Capture avec bouton Aperçu visible
  56 |     await page.screenshot({ 
  57 |       path: '/home/lyann/agents/grosrenzo/new_03_editor.png',
  58 |       fullPage: false 
  59 |     });
  60 |     console.log('Éditeur avec bouton Aperçu');
  61 |   });
  62 | 
  63 |   test('capture LivePreview panel', async ({ page }) => {
  64 |     await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  65 |     await page.waitForTimeout(2000);
  66 |     
  67 |     // Ouvrir un template
  68 |     const galleryBtn = page.locator('button:has-text("Depuis un template")');
  69 |     if (await galleryBtn.isVisible().catch(() => false)) {
  70 |       await galleryBtn.click();
  71 |       await page.waitForTimeout(1000);
  72 |       await page.click('text=Retail Minimal');
  73 |       await page.waitForTimeout(2000);
  74 |     }
  75 |     
  76 |     // Cliquer sur Aperçu
  77 |     const apercuBtn = page.locator('button:has-text("Aperçu")');
> 78 |     await apercuBtn.waitFor({ state: 'visible', timeout: 10000 });
     |                     ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  79 |     await apercuBtn.click();
  80 |     await page.waitForTimeout(2000);
  81 |     
  82 |     await page.screenshot({ 
  83 |       path: '/home/lyann/agents/grosrenzo/new_04_preview.png',
  84 |       fullPage: false 
  85 |     });
  86 |     console.log('Éditeur avec panneau LivePreview ouvert');
  87 |   });
  88 | });
  89 | 
```