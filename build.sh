#!/bin/bash
# Set default environment
ENV="prod"

if [ "$1" != "" ]; then
    ENV=$1
fi

echo "========================================"
echo "         iTrack - Build Script"
echo "========================================"
echo ""
echo "DEFAULT: Production build (etsm_prod)"
echo "Pentru development foloseste: ./build.sh dev"
echo ""

echo "========================================"
echo "         iTrack - Build $ENV"
echo "========================================"
echo ""

if [ "$ENV" = "dev" ]; then
    echo "Building for DEVELOPMENT environment..."
    echo "API: www.euscagency.com/etsm3/"
    export VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    export NODE_ENV=development
elif [ "$ENV" = "prod" ]; then
    echo "Building for PRODUCTION environment..."
    echo "API: www.euscagency.com/etsm_prod/"
    export VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    export NODE_ENV=production
else
    echo "EROARE: Environment invalid '$ENV'"
    echo "Foloseste: dev sau prod"
    exit 1
fi

echo ""
echo "[1/4] Instalare dependinte..."
npm install
if [ $? -ne 0 ]; then
    echo "EROARE: npm install esuat"
    exit 1
fi
echo "✓ Dependinte instalate"

echo ""
echo "[2/4] Build proiect pentru $ENV..."
npx vite build
if [ $? -ne 0 ]; then
    echo "EROARE: vite build esuat"
    exit 1
fi
echo "✓ Proiect compilat pentru $ENV"

echo ""
echo "[3/4] Sincronizare cu Android..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "EROARE: capacitor sync esuat"
    exit 1
fi
echo "✓ Android sincronizat"

echo ""
echo "[4/4] Deschidere Android Studio..."
npx cap open android
if [ $? -ne 0 ]; then
    echo "EROARE: deschiderea Android Studio esuata"
    exit 1
fi
echo "✓ Android Studio deschis"

echo ""
echo "========================================"
echo "           Build $ENV Finalizat!"
echo "========================================"
echo "Proiect gata pentru $ENV in Android Studio"
echo "Environment: $ENV"