#!/bin/bash

clear
echo ""
echo "================================================"
echo "            iTrack GPS - Build Tool"
echo "================================================"
echo ""

# Interactive environment selection if no parameter provided
if [ "$1" = "" ]; then
    echo "Selecteaza environment-ul pentru build:"
    echo ""
    echo "1. DEVELOPMENT (API: etsm3)"
    echo "2. PRODUCTION  (API: etsm_prod)"
    echo ""
    read -p "Introdu optiunea (1 sau 2): " choice
    
    if [ "$choice" = "1" ]; then
        ENV="dev"
    elif [ "$choice" = "2" ]; then
        ENV="prod"
    else
        echo ""
        echo "Optiune invalida. Folosesc PRODUCTION ca default."
        ENV="prod"
        sleep 2
    fi
else
    ENV=$1
fi

echo ""
echo "================================================"

if [ "$ENV" = "dev" ]; then
    echo "Environment: DEVELOPMENT"
    echo "API Endpoint: www.euscagency.com/etsm3/"
    export VITE_API_BASE_URL="https://www.euscagency.com/etsm3/platforme/transport/apk/"
    export NODE_ENV="development"
elif [ "$ENV" = "prod" ]; then
    echo "Environment: PRODUCTION"
    echo "API Endpoint: www.euscagency.com/etsm_prod/"
    export VITE_API_BASE_URL="https://www.euscagency.com/etsm_prod/platforme/transport/apk/"
    export NODE_ENV="production"
else
    echo ""
    echo "EROARE: Environment invalid '$ENV'"
    echo "Foloseste: dev sau prod"
    echo ""
    read -p "Apasa Enter pentru a iesi..."
    exit 1
fi

echo "================================================"

echo ""
echo "Pornesc procesul de build..."
echo ""

echo "[ETAPA 1/4] Instalare dependinte Node.js..."
if ! npm install >/dev/null 2>&1; then
    echo ""
    echo "EROARE: npm install esuat"
    echo "Verificati conexiunea internet si package.json"
    echo ""
    read -p "Apasa Enter pentru a iesi..."
    exit 1
fi
echo "Done."

echo "[ETAPA 2/4] Build aplicatie pentru $ENV..."
if ! npx vite build >/dev/null 2>&1; then
    echo ""
    echo "EROARE: vite build esuat"
    echo "Verificati codul TypeScript si dependintele"
    echo ""
    read -p "Apasa Enter pentru a iesi..."
    exit 1
fi
echo "Done."

echo "[ETAPA 3/4] Sincronizare cu Android..."
if ! npx cap sync android >/dev/null 2>&1; then
    echo ""
    echo "EROARE: capacitor sync esuat"
    echo "Verificati configuratia Capacitor"
    echo ""
    read -p "Apasa Enter pentru a iesi..."
    exit 1
fi
echo "Done."

echo "[ETAPA 4/4] Lansare Android Studio..."
if ! npx cap open android >/dev/null 2>&1; then
    echo ""
    echo "EROARE: deschiderea Android Studio esuata"
    echo "Instalati Android Studio si configurati PATH"
    echo ""
    read -p "Apasa Enter pentru a iesi..."
    exit 1
fi
echo "Done."

echo ""
echo "================================================"
echo "              BUILD FINALIZAT CU SUCCES!"
echo "================================================"
echo ""
echo "Toate etapele au fost finalizate cu succes."
echo "Proiectul este gata in Android Studio."
echo "Environment: $ENV"
echo ""
echo "INSTRUCTIUNI URMATOARE:"
echo "1. Android Studio este deschis"
echo "2. Selectati device/emulator"
echo "3. Apasati 'Run' pentru testare"
echo "4. Pentru APK: Build -> Generate Signed Bundle/APK"
echo ""
echo "================================================"
echo ""

echo "Continui cu alte operatiuni?"
echo ""
echo "1. Restart build cu alt environment"
echo "2. Deschide director proiect"
echo "3. Iesire"
echo ""
read -p "Alege optiunea (1, 2 sau 3): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Restarting build tool..."
    sleep 1
    exec "$0"
elif [ "$choice" = "2" ]; then
    echo ""
    echo "Deschid directorul proiectului..."
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open .
    elif command -v open >/dev/null 2>&1; then
        open .
    else
        echo "Nu pot deschide directorul automat."
    fi
else
    echo ""
    echo "Build tool terminat."
    sleep 2
fi