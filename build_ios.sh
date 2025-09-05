#!/bin/bash

# iTrack GPS - iOS Build Script
# Cross-platform build tool pentru macOS/Linux

clear
echo "================================================"
echo "        iTrack GPS - iOS Build Tool"
echo "================================================"
echo

# Function to display environment options
show_options() {
    echo "Selecteaza environment-ul pentru build iOS:"
    echo
    echo "1. DEVELOPMENT (API: etsm3)"
    echo "2. PRODUCTION  (API: etsm_prod)"
    echo
}

# Environment selection
if [ -z "$1" ]; then
    show_options
    read -p "Introdu optiunea (1 sau 2): " choice
    
    case $choice in
        1)
            ENV="dev"
            ;;
        2)
            ENV="prod"
            ;;
        *)
            echo
            echo "Optiune invalida. Folosesc PRODUCTION ca default."
            ENV="prod"
            sleep 2
            ;;
    esac
else
    ENV="$1"
fi

echo
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
    echo
    echo "EROARE: Environment invalid '$ENV'"
    echo "Foloseste: dev sau prod"
    echo
    exit 1
fi

echo "================================================"

echo
echo "Pornesc procesul de build iOS..."
echo

echo "[ETAPA 1/4] Instalare dependinte Node.js..."
npm install > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo
    echo "EROARE: npm install esuat"
    echo "Verificati conexiunea internet si package.json"
    echo
    exit 1
fi
echo "Done."

echo "[ETAPA 2/4] Build aplicatie pentru $ENV..."
npx vite build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo
    echo "EROARE: vite build esuat"
    echo "Verificati codul TypeScript si dependintele"
    echo
    exit 1
fi
echo "Done."

echo "[ETAPA 3/4] Sincronizare cu iOS..."
npx cap sync ios > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo
    echo "EROARE: capacitor sync ios esuat"
    echo "Verificati configuratia Capacitor"
    echo
    exit 1
fi
echo "Done."

echo "[ETAPA 4/4] Lansare Xcode (macOS only)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npx cap open ios > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo
        echo "EROARE: deschiderea Xcode esuata"
        echo "Verificati instalarea Xcode"
        echo
        exit 1
    fi
    echo "Done."
else
    echo "Skip (not macOS) - iOS project ready in ios/ folder"
fi

echo
echo "================================================"
echo "            iOS BUILD FINALIZAT CU SUCCES!"
echo "================================================"
echo
echo "Toate etapele au fost finalizate cu succes."
echo "Proiectul iOS este gata in ios/ folder."
echo "Environment: $ENV"
echo

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "INSTRUCTIUNI URMATOARE:"
    echo "1. Xcode este deschis"
    echo "2. Selectati device/simulator iOS"
    echo "3. Apasati 'Run' pentru testare"
    echo "4. Pentru IPA: Product -> Archive -> Distribute App"
else
    echo "INSTRUCTIUNI URMATOARE (macOS):"
    echo "1. Deschideti ios/App/App.xcworkspace in Xcode"
    echo "2. Selectati device/simulator iOS"
    echo "3. Apasati 'Run' pentru testare"
fi
echo
echo "================================================"
echo

echo "Continui cu alte operatiuni?"
echo
echo "1. Restart build cu alt environment"
echo "2. Deschide director proiect"
echo "3. Iesire"
echo
read -p "Alege optiunea (1, 2 sau 3): " choice

case $choice in
    1)
        echo
        echo "Restarting iOS build tool..."
        sleep 1
        exec "$0"
        ;;
    2)
        echo
        echo "Deschid directorul proiectului..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open .
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open .
        else
            echo "Directory: $(pwd)"
        fi
        ;;
    *)
        echo
        echo "iOS build tool terminat."
        sleep 2
        ;;
esac