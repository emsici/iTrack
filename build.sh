#!/bin/bash

clear
echo ""
echo "================================================"
echo "            iTrack GPS - Build Tool"
echo "================================================"
echo ""

# Interactive selections if no parameters provided
if [ "$1" = "" ]; then
    echo "Selecteaza platforma pentru build:"
    echo ""
    echo "1. ANDROID"
    echo "2. iOS"
    echo "3. AMBELE (Android + iOS)"
    echo ""
    read -p "Introdu optiunea (1, 2 sau 3): " platform_choice
    
    if [ "$platform_choice" = "1" ]; then
        PLATFORM="android"
    elif [ "$platform_choice" = "2" ]; then
        PLATFORM="ios"
    elif [ "$platform_choice" = "3" ]; then
        PLATFORM="both"
    else
        echo ""
        echo "Optiune invalida. Folosesc ANDROID ca default."
        PLATFORM="android"
        sleep 2
    fi
    
    echo ""
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
    PLATFORM=${2:-android}  # Default la android dacă nu e specificat
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

echo "Platforma: $PLATFORM"
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

# Configurare PATH pentru CocoaPods (iOS)
export PATH="/home/runner/workspace/.local/share/gem/ruby/3.1.0/bin:$PATH"

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
    echo "[ETAPA 3a] Sincronizare cu Android..."
    if ! npx cap sync android >/dev/null 2>&1; then
        echo ""
        echo "EROARE: capacitor sync android esuat"
        echo "Verificati configuratia Capacitor"
        echo ""
        read -p "Apasa Enter pentru a iesi..."
        exit 1
    fi
    echo "Done."
fi

if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
    echo "[ETAPA 3b] Configurare dependinte iOS (CocoaPods)..."
    cd ios/App
    if ! pod install >/dev/null 2>&1; then
        echo ""
        echo "EROARE: pod install esuat"
        echo "Verificati CocoaPods si Podfile"
        cd ../..
        echo ""
        read -p "Apasa Enter pentru a iesi..."
        exit 1
    fi
    cd ../..
    echo "Done."
    
    echo "[ETAPA 3c] Sincronizare cu iOS..."
    if ! npx cap sync ios >/dev/null 2>&1; then
        echo ""
        echo "EROARE: capacitor sync ios esuat"
        echo "Verificati configuratia Capacitor iOS"
        echo ""
        read -p "Apasa Enter pentru a iesi..."
        exit 1
    fi
    echo "Done."
fi

if [ "$PLATFORM" = "android" ]; then
    echo "[ETAPA 4] Lansare Android Studio..."
    if ! npx cap open android >/dev/null 2>&1; then
        echo ""
        echo "EROARE: deschiderea Android Studio esuata"
        echo "Instalati Android Studio si configurati PATH"
        echo ""
        read -p "Apasa Enter pentru a iesi..."
        exit 1
    fi
    echo "Done."
elif [ "$PLATFORM" = "ios" ]; then
    echo "[ETAPA 4] Lansare Xcode..."
    if ! npx cap open ios >/dev/null 2>&1; then
        echo ""
        echo "EROARE: deschiderea Xcode esuata"
        echo "Instalati Xcode pe macOS"
        echo ""
        read -p "Apasa Enter pentru a iesi..."
        exit 1
    fi
    echo "Done."
elif [ "$PLATFORM" = "both" ]; then
    echo "[ETAPA 4] Lansare IDE-uri..."
    echo "Lansez Android Studio..."
    npx cap open android >/dev/null 2>&1 &
    echo "Lansez Xcode..."  
    npx cap open ios >/dev/null 2>&1 &
    echo "Done."
fi

echo ""
echo "================================================"
echo "              BUILD FINALIZAT CU SUCCES!"
echo "================================================"
echo ""
echo "Toate etapele au fost finalizate cu succes."
if [ "$PLATFORM" = "android" ]; then
    echo "Proiectul Android este gata in Android Studio."
elif [ "$PLATFORM" = "ios" ]; then
    echo "Proiectul iOS este gata in Xcode."
else
    echo "Proiectele Android si iOS sunt gata."
fi
echo "Environment: $ENV"
echo "Platforma: $PLATFORM"
echo ""
echo "INSTRUCTIUNI URMATOARE:"
if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
    echo "ANDROID:"
    echo "1. Android Studio este deschis"
    echo "2. Selectati device/emulator Android"
    echo "3. Apasati 'Run' pentru testare"
    echo "4. Pentru APK: Build -> Generate Signed Bundle/APK"
    echo ""
fi
if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
    echo "iOS:"
    echo "1. Xcode este deschis (necesita macOS)"
    echo "2. Selectati device/simulator iOS"
    echo "3. Apasati 'Run' pentru testare"
    echo "4. Pentru IPA: Product -> Archive"
    echo ""
fi
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