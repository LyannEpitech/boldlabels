# 🏷️ BoldLabels

[![Tests](https://github.com/LyannEpitech/boldlabels/actions/workflows/test.yml/badge.svg)](https://github.com/LyannEpitech/boldlabels/actions/workflows/test.yml)

Application web professionnelle pour générer des étiquettes imprimables à partir de données CSV.

## 🚀 Fonctionnalités

- **Éditeur visuel** : Créez vos templates d'étiquettes avec drag & drop
- **Import CSV** : Mappez vos colonnes aux variables du template
- **Génération PDF** : Exportez vos étiquettes en PDF prêt à imprimer
- **Formats supportés** : Texte, code-barres (EAN, CODE128), QR codes, images
- **Presets** : Templates prédéfinis (Avery 5160, 5163, etc.)

## 🛠️ Stack Technique

### Frontend
- React 18 + TypeScript
- Vite
- React-Konva (canvas vectoriel)
- Zustand (state management)
- Tailwind CSS
- jsPDF (génération PDF)

### Backend
- Node.js 20 + Express
- Prisma ORM
- PostgreSQL
- Zod (validation)

## 📦 Installation

### Prérequis
- Node.js 20+
- PostgreSQL 15+

### Backend
```bash
cd backend
cp .env.example .env
# Éditez .env avec vos credentials DB
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Tests

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

## 📝 Usage

1. **Créer un template** : Dashboard → Nouveau template → Choisir un preset ou dimensions custom
2. **Éditer le template** : Ajouter des éléments (texte, barcode, QR code, image, rectangle)
3. **Configurer le mapping** : Importer un CSV → Associer les colonnes aux variables
4. **Générer** : Choisir les options de mise en page → Télécharger le PDF

## 🏗️ Architecture

```
boldlabels/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/         # Éditeur Konva
│   │   │   ├── ui/             # Composants UI
│   │   │   └── ...
│   │   ├── pages/              # Pages (Dashboard, Editor, Mapping, Generate)
│   │   ├── stores/             # Zustand stores
│   │   ├── utils/              # Utilitaires (PDF generator)
│   │   └── types/              # Types TypeScript
│   └── ...
├── backend/
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── schemas.ts          # Validation Zod
│   │   └── index.ts            # Server entry
│   └── prisma/
│       └── schema.prisma       # Database schema
└── ...
```

## 📄 License

MIT
