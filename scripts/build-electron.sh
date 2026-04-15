#!/bin/bash

# BoldLabels Electron Build Script
# Usage: ./scripts/build-electron.sh [win|mac|linux|all]

set -e

echo "🔨 BoldLabels Electron Build Script"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Build renderer (frontend)
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm run build
cd ..

# Build electron main process
echo -e "${YELLOW}Building Electron main process...${NC}"
npm run build:electron

# Build icons if they don't exist
if [ ! -f "build/icon.png" ]; then
    echo -e "${YELLOW}Creating placeholder icons...${NC}"
    mkdir -p build
    # Create a simple placeholder icon using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 512x512 xc: '#4F46E5' -pointsize 30 -fill white -gravity center -annotate +0+0 "BoldLabels" build/icon.png
        convert build/icon.png build/icon.ico 2>/dev/null || true
        convert build/icon.png build/icon.icns 2>/dev/null || true
    else
        echo -e "${YELLOW}ImageMagick not found. Please add icons manually to build/ folder:${NC}"
        echo "  - build/icon.png (512x512)"
        echo "  - build/icon.ico (Windows)"
        echo "  - build/icon.icns (macOS)"
    fi
fi

# Determine target platform
TARGET=${1:-all}

case $TARGET in
    win|windows)
        echo -e "${YELLOW}Building for Windows...${NC}"
        npm run build:win
        ;;
    mac|macos|darwin)
        echo -e "${YELLOW}Building for macOS...${NC}"
        npm run build:mac
        ;;
    linux)
        echo -e "${YELLOW}Building for Linux...${NC}"
        npm run build:linux
        ;;
    all)
        echo -e "${YELLOW}Building for all platforms...${NC}"
        npm run build:all
        ;;
    *)
        echo -e "${RED}Unknown target: $TARGET${NC}"
        echo "Usage: $0 [win|mac|linux|all]"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "📦 Output location: release/"
ls -la release/ 2>/dev/null || echo "Check the release/ directory for built artifacts"
