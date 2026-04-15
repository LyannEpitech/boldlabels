# Electron Build Configuration

This document explains how to build the Electron desktop version of BoldLabels.

## Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) ImageMagick for icon generation

## Quick Start

```bash
# Install dependencies
npm install

# Build for current platform
npm run build:all

# Or use the build script
./scripts/build-electron.sh
```

## Platform-Specific Builds

### Windows
```bash
npm run build:win
```
Outputs:
- `release/BoldLabels Setup.exe` - Installer
- `release/BoldLabels.exe` - Portable

### macOS
```bash
npm run build:mac
```
Outputs:
- `release/BoldLabels.dmg` - Disk image
- `release/BoldLabels.zip` - Portable

### Linux
```bash
npm run build:linux
```
Outputs:
- `release/BoldLabels.AppImage` - Universal package
- `release/boldlabels.deb` - Debian package

## Development Mode

```bash
# Run in development mode (hot reload)
npm run dev

# This starts:
# 1. Vite dev server (frontend)
# 2. Electron with hot reload
```

## Project Structure

```
boldlabels/
├── electron/              # Electron main process
│   ├── main.ts           # Main entry point
│   ├── preload.ts        # Preload script (security bridge)
│   └── tsconfig.json     # TypeScript config
├── frontend/             # React frontend (shared with web)
│   ├── src/
│   │   └── services/
│   │       └── dbService.ts  # Adaptive database service
│   └── dist/             # Built frontend
├── build/                # App icons
│   ├── icon.png          # 512x512 Linux
│   ├── icon.ico          # Windows
│   └── icon.icns         # macOS
├── dist-electron/        # Built Electron code
└── release/              # Final packaged apps
```

## Architecture

### Adaptive Database Service

The frontend uses an adaptive database service (`dbService.ts`) that automatically detects if running in Electron or web mode:

- **Electron Mode**: Uses SQLite via IPC calls to main process
- **Web Mode**: Uses HTTP API calls to backend server

### IPC Communication

```
Renderer (React)  <--preload-->  Main (Electron)  <--better-sqlite3-->  SQLite DB
```

Security:
- Context isolation enabled
- Preload script exposes only necessary APIs
- No `nodeIntegration` in renderer

## Troubleshooting

### better-sqlite3 build errors

If you encounter native module build errors:

```bash
# Rebuild for Electron
npm run postinstall

# Or manually
npx electron-rebuild
```

### Icons not showing

Ensure you have the icon files in `build/`:
- `icon.png` (512x512) - Required for all platforms
- `icon.ico` - Windows
- `icon.icns` - macOS

### Build fails on macOS

You may need to install Xcode command line tools:
```bash
xcode-select --install
```

## Distribution

### GitHub Releases (Auto-updater)

The app is configured to use GitHub releases for auto-updates. To publish:

1. Create a new GitHub release
2. Upload the built artifacts
3. The app will automatically check for updates

### Manual Distribution

Simply share the built files from the `release/` directory.

## Environment Variables

- `NODE_ENV=development` - Enables dev tools and hot reload
- `NODE_ENV=production` - Optimized build

## License

MIT - See LICENSE file
