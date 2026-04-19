# Rapport de Test QA - BoldLabels

**Date:** 2026-04-20  
**Testeur:** GrosRenzo  
**Version testée:** master (post PR #41)

---

## 🎯 Résumé Exécutif

| Catégorie | Nombre | Priorité |
|-----------|--------|----------|
| Bugs Critiques (P0) | 3 | 🔴 Haute |
| Bugs Majeurs (P1) | 7 | 🟡 Moyenne |
| Bugs Mineurs (P2) | 12 | 🟢 Basse |
| Améliorations UX | 8 | 🔵 Future |

---

## 🔴 Bugs Critiques (P0)

### 1. distributeElements() non implémenté
**Fichier:** `frontend/src/stores/editorStore.ts:647`
**Description:** La fonction de distribution d'éléments (alignement espacé) est vide - juste un console.log
**Impact:** L'utilisateur ne peut pas distribuer des éléments équitablement
**Code problématique:**
```typescript
distributeElements: (axis) => {
  // TODO: Implement multi-selection distribution
  console.log('Distribute', axis);
},
```
**Correction suggérée:** Implémenter la logique de distribution calculant l'espacement égal entre éléments

---

### 2. alignElements() ne fonctionne qu'avec sélection simple
**Fichier:** `frontend/src/stores/editorStore.ts:604`
**Description:** La fonction d'alignement utilise `selectedElementId` au lieu de `selectedElementIds[]`
**Impact:** L'alignement ne fonctionne pas en multi-sélection
**Code problématique:**
```typescript
alignElements: (alignment) => {
  const { template, selectedElementId } = get(); // ← Devrait utiliser selectedElementIds
  if (!template || !selectedElementId) return;
  // ...
}
```

---

### 3. Rubber band selection ne sélectionne pas correctement
**Fichier:** `frontend/src/stores/editorStore.ts:438`
**Description:** La collision detection utilise des coordonnées mm mais la sélection box est en px
**Impact:** La sélection par glissement ne fonctionne pas correctement
**Code problématique:**
```typescript
endSelectionBox: () => {
  // ...
  const boxRight = selectionBox.x + selectionBox.width; // en px?
  // ...
  const elRight = el.x + el.width; // en mm!
  // Comparaison incohérente
}
```

---

## 🟡 Bugs Majeurs (P1)

### 4. Les guides du ruler ne sont pas visibles sur le canvas
**Fichier:** `frontend/src/components/canvas/Ruler.tsx`
**Description:** Les guides créés via le ruler n'apparaissent pas sur le canvas
**Impact:** L'utilisateur ne voit pas où il place ses guides
**Étapes repro:**
1. Ouvrir l'éditeur
2. Dragger depuis le ruler
3. Le guide n'apparaît pas

---

### 5. PositionIndicator affiche des valeurs erronées
**Fichier:** `frontend/src/components/canvas/LabelCanvas.tsx`
**Description:** L'indicateur de position affiche parfois des valeurs négatives ou hors limites
**Impact:** Feedback utilisateur incorrect

---

### 6. La suppression d'élément ne demande pas de confirmation
**Fichier:** `frontend/src/stores/editorStore.ts`
**Description:** La touche Supprime supprime immédiatement sans confirmation
**Impact:** Risque de perte de données accidentelle

---

### 7. Pas de feedback visuel pour les éléments groupés
**Fichier:** `frontend/src/components/canvas/LabelCanvas.tsx`
**Description:** Quand des éléments sont groupés (Ctrl+G), aucune indication visuelle ne le montre
**Impact:** L'utilisateur ne sait pas qu'un groupe existe
**Correction suggérée:** Ajouter un contour ou une bordure autour des éléments groupés

---

### 8. Les barres de défilement apparaissent systématiquement
**Fichier:** `frontend/src/pages/EditorPage.tsx`
**Description:** Même quand le contenu tient dans la fenêtre, les scrollbars sont visibles
**Impact:** Visuel pas propre
**Correction:** `overflow-auto` → `overflow-hidden` quand pas nécessaire

---

### 9. Le zoom n'est pas persistant
**Fichier:** `frontend/src/stores/editorStore.ts`
**Description:** Le niveau de zoom n'est pas sauvegardé dans le store ni le localStorage
**Impact:** L'utilisateur doit re-zoomer à chaque session

---

### 10. Pas d'indicateur de chargement lors de la génération PDF
**Fichier:** `frontend/src/components/PDFExporter.tsx`
**Description:** Pendant la génération PDF, aucun feedback visuel n'indique que ça charge
**Impact:** L'utilisateur ne sait pas si l'action a été prise en compte

---

## 🟢 Bugs Mineurs (P2)

### 11. Console.log laissés dans le code production
**Fichiers:**
- `frontend/src/stores/editorStore.ts` (lignes 295, 311, 325, etc.)
**Description:** Plusieurs console.log de debug sont présents
**Correction:** Les remplacer par un système de logging conditionnel ou les supprimer

---

### 12. Types any utilisés sans justification
**Fichiers:**
- `frontend/src/services/dbService.ts` - `data: any`
- `frontend/src/stores/editorStore.ts` - plusieurs `as any`
**Description:** Utilisation de `any` qui casse la type safety

---

### 13. Commentaires TODO/FIXME non résolus
**Fichiers:**
- `frontend/src/components/canvas/Ruler.tsx` - plusieurs TODO
- `frontend/src/components/canvas/SmartGuides.tsx` - TODO

---

### 14. Magic numbers non constantisés
**Fichier:** `frontend/src/components/canvas/Ruler.tsx`
**Description:** `RULER_SIZE = 30`, `MM_TO_PX = 3.7795275591` - certains sont dupliqués

---

### 15. Pas de gestion d'erreur réseau
**Fichier:** `frontend/src/services/dbService.ts`
**Description:** Si le backend est down, l'app crash sans message clair

---

### 16. Les tooltips manquent sur les boutons de la toolbar
**Fichier:** `frontend/src/components/Toolbar.tsx`
**Description:** Les boutons n'ont pas de tooltips explicatifs
**Impact:** UX dégradée pour les nouveaux utilisateurs

---

### 17. La validation de formulaire est minimale
**Fichier:** `frontend/src/pages/DashboardPage.tsx`
**Description:** Création de template sans validation de dimensions négatives

---

### 18. Pas d'annulation (Ctrl+Z) après suppression
**Fichier:** `frontend/src/stores/editorStore.ts`
**Description:** L'historique ne capture pas toutes les actions (suppression multiple)

---

### 19. Les noms de variables ne sont pas validés
**Fichier:** `frontend/src/components/canvas/PropertiesPanel.tsx`
**Description:** On peut créer des variables avec espaces ou caractères spéciaux

---

### 20. Le responsive design est cassé sur écran moyen
**Fichier:** `frontend/src/pages/EditorPage.tsx`
**Description:** Sur écran 13", la sidebar cache partie du canvas

---

### 21. Les erreurs de validation Zod ne sont pas traduites
**Fichier:** `backend/src/schemas.ts`
**Description:** Messages d'erreur en anglais uniquement

---

### 22. Pas de limites sur le nombre d'éléments
**Fichier:** `frontend/src/stores/editorStore.ts`
**Description:** On peut ajouter autant d'éléments que voulu → risque de perf

---

## 🔵 Améliorations UX (Future)

### 23. Ajouter des animations de transition
**Description:** Les changements d'état sont instantanés, brutaux

---

### 24. Mode sombre
**Description:** Le design system supporte le dark mode mais il n'est pas implémenté

---

### 25. Raccourcis clavier manquants
- Pas de raccourci pour créer un nouveau template (Ctrl+N)
- Pas de raccourci pour sauvegarder (Ctrl+S fonctionne mais pas de feedback)

---

### 26. Pas de preview au survol des templates
**Fichier:** `frontend/src/pages/DashboardPage.tsx`
**Description:** Survoler un template ne montre pas de preview agrandie

---

### 27. Impossible de renommer un template
**Fichier:** `frontend/src/pages/DashboardPage.tsx`
**Description:** Pas d'option "Renommer" dans les actions

---

### 28. Pas de recherche dans les templates
**Fichier:** `frontend/src/pages/DashboardPage.tsx`
**Description:** Si 50+ templates, difficile de trouver le bon

---

### 29. Pas d'export/import batch
**Description:** Impossible d'exporter tous ses templates d'un coup

---

### 30. Pas de statistiques d'utilisation
**Description:** Pas de visibilité sur les templates les plus utilisés

---

## 📸 Captures d'écran

Les screenshots de référence sont disponibles dans:
`/home/lyann/agents/grosrenzo/qa-test/`

- `dashboard.png` - Page d'accueil
- `editor-a0d369ad-test.png` - Éditeur avec template de test

---

## ✅ Recommandations Prioritaires

### À faire immédiatement (P0)
1. [ ] Implémenter `distributeElements()`
2. [ ] Corriger `alignElements()` pour multi-sélection
3. [ ] Corriger les unités dans `endSelectionBox()`

### Cette semaine (P1)
4. [ ] Afficher les guides sur le canvas
5. [ ] Ajouter confirmation avant suppression
6. [ ] Feedback visuel pour groupes
7. [ ] Spinner sur génération PDF

### Prochain sprint (P2)
8. [ ] Nettoyer les console.log
9. [ ] Ajouter tooltips
10. [ ] Valider les dimensions négatives

---

## 🛠️ Notes techniques

### Tests recommandés
```bash
# Test E2E à ajouter
e2e/tests/critical-path.spec.ts:
- Création template → Ajout éléments → Génération PDF
e2e/tests/keyboard-shortcuts.spec.ts:
- Tous les raccourcis clavier
e2e/tests/undo-redo.spec.ts:
- Historique complet
```

### Métriques de qualité
- Couverture de tests actuelle: ~30%
- Objectif: 70%
- Bugs connus: 22
- Dette technique estimée: 3 jours-homme

---

*Rapport généré automatiquement par GrosRenzo - BoldLabels QA*
