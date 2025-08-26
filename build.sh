#!/bin/bash
echo "========================================"
echo "     iTrack - Production Build"
echo "========================================"
echo ""
echo "Building for PRODUCTION environment..."
echo "API: www.euscagency.com/etsm_prod/"
echo ""

# Set production environment variables
export VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
export NODE_ENV=production

echo "[1/4] Instalare dependinte..."
npm install
if [ $? -ne 0 ]; then
    echo "EROARE: npm install esuat"
    exit 1
fi
echo "✓ Dependinte instalate"

echo ""
echo "[2/4] Build proiect pentru PRODUCTION..."
npx vite build
if [ $? -ne 0 ]; then
    echo "EROARE: vite build esuat"
    exit 1
fi
echo "✓ Proiect compilat pentru PRODUCTION"

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
echo "           Build PRODUCTION Finalizat!"
echo "========================================"
echo "Proiect gata pentru release in Android Studio"
echo "Environment: PRODUCTION (etsm_prod)"