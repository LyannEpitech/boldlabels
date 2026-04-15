# BoldLabels Desktop

Version desktop de BoldLabels - Application de génération d'étiquettes professionnelles.

## 🎯 Fonctionnalités

- ✅ **100% Offline** - Fonctionne sans connexion internet
- ✅ **Données locales** - Toutes vos données restent sur votre machine
- ✅ **Multi-plateforme** - Windows, macOS, Linux
- ✅ **Performance native** - Réactivité instantanée
- ✅ **Mises à jour automatiques** - Restez à jour sans effort

## 📥 Installation

### Windows

1. Téléchargez `BoldLabels-Setup.exe` depuis la [page Releases](https://github.com/LyannEpitech/boldlabels/releases)
2. Exécutez l'installateur
3. Suivez les instructions

### macOS

1. Téléchargez `BoldLabels.dmg` depuis la [page Releases](https://github.com/LyannEpitech/boldlabels/releases)
2. Ouvrez le fichier DMG
3. Glissez BoldLabels dans Applications

### Linux

**AppImage (recommandé):**
```bash
# Téléchargez BoldLabels.AppImage
chmod +x BoldLabels.AppImage
./BoldLabels.AppImage
```

**Debian/Ubuntu:**
```bash
sudo dpkg -i boldlabels.deb
sudo apt-get install -f  # Si dépendances manquantes
```

## 🚀 Utilisation

### Premier lancement

1. Lancez BoldLabels
2. Créez votre premier template d'étiquette
3. Importez vos données CSV
4. Générez vos étiquettes PDF

### Différences avec la version Web

| Fonctionnalité | Desktop | Web |
|---------------|---------|-----|
| Données stockées | Localement (SQLite) | Sur serveur |
| Connexion requise | ❌ Non | ✅ Oui |
| Multi-appareils | ❌ Non | ✅ Oui |
| Partage facile | ❌ Non | ✅ Oui |

## 🛠️ Développement

### Prérequis

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/LyannEpitech/boldlabels.git
cd boldlabels
npm install
```

### Mode développement

```bash
npm run dev
```

### Build

```bash
# Toutes les plateformes
npm run build:all

# Windows uniquement
npm run build:win

# macOS uniquement
npm run build:mac

# Linux uniquement
npm run build:linux
```

## 📁 Structure des données

Les données sont stockées dans le dossier utilisateur de votre OS :

- **Windows**: `%APPDATA%/BoldLabels/boldlabels.db`
- **macOS**: `~/Library/Application Support/BoldLabels/boldlabels.db`
- **Linux**: `~/.config/BoldLabels/boldlabels.db`

### Backup

Pour sauvegarder vos données, copiez simplement le fichier `boldlabels.db`.

## 🐛 Troubleshooting

### L'application ne démarre pas

1. Vérifiez que vous avez les droits d'administrateur (Windows)
2. Sur macOS, autorisez l'application dans Préférences Système > Sécurité
3. Sur Linux, vérifiez les permissions du fichier AppImage

### Données perdues

Les données sont stockées localement. Si vous réinstallez l'application :
- **Windows/macOS**: Les données sont conservées
- **Linux**: Le dossier `.config/BoldLabels/` peut être supprimé lors de la désinstallation

### Mises à jour

L'application vérifie automatiquement les mises à jour au démarrage. Vous pouvez aussi vérifier manuellement dans le menu Aide > Vérifier les mises à jour.

## 📄 License

MIT - Voir [LICENSE](../LICENSE)

## 🤝 Support

- 🐛 [Signaler un bug](https://github.com/LyannEpitech/boldlabels/issues)
- 💡 [Proposer une fonctionnalité](https://github.com/LyannEpitech/boldlabels/issues)
- 📧 Contact: [Votre email]
