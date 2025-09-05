#!/bin/bash

# iTrack GPS - Master Build Script
# Unified build tool pentru Android, iOS sau ambele

clear
echo "================================================"
echo "        iTrack GPS - Master Build Tool"
echo "================================================"
echo

# Platform selection
echo "Selecteaza platforma pentru build:"
echo
echo "1. ANDROID (APK)"
echo "2. iOS (IPA)"
echo
read -p "Introdu optiunea (1 sau 2): " platform_choice

echo
echo "================================================"

# Environment selection
echo "Selecteaza environment-ul:"
echo
echo "1. DEVELOPMENT (API: etsm3)"
echo "2. PRODUCTION  (API: etsm_prod)"
echo
read -p "Introdu optiunea (1 sau 2): " env_choice

case $env_choice in
    1)
        ENV="dev"
        ENV_NAME="DEVELOPMENT"
        API_URL="https://www.euscagency.com/etsm3/platforme/transport/apk/"
        ;;
    2)
        ENV="prod"
        ENV_NAME="PRODUCTION"
        API_URL="https://www.euscagency.com/etsm_prod/platforme/transport/apk/"
        ;;
    *)
        echo
        echo "Optiune invalida. Folosesc PRODUCTION ca default."
        ENV="prod"
        ENV_NAME="PRODUCTION"
        API_URL="https://www.euscagency.com/etsm_prod/platforme/transport/apk/"
        sleep 2
        ;;
esac

echo
echo "================================================"
echo "Environment: $ENV_NAME"
echo "API Endpoint: $API_URL"
echo "================================================"
echo

# Set environment variables
export VITE_API_BASE_URL="$API_URL"
export NODE_ENV="$ENV"

# Execute based on platform choice
case $platform_choice in
    1)
        echo "🤖 Building pentru ANDROID..."
        build_android
        ;;
    2)
        echo "🍎 Building pentru iOS..."
        build_ios
        ;;
    *)
        echo
        echo "Optiune invalida. Folosesc ANDROID ca default."
        build_android
        ;;
esac

# Function: Build Android
build_android() {
    echo
    echo "[ANDROID] [ETAPA 1/4] Instalare dependinte..."
    npm install > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ npm install esuat"
        exit 1
    fi
    echo "✅ Done."
    
    echo "[ANDROID] [ETAPA 1.5/4] Configure Android environment..."
    mkdir -p android/app/src/main/assets
    cat > android/app/src/main/assets/environment.properties << EOF
API_BASE_URL=$API_URL
ENVIRONMENT=$ENV_NAME
EOF
    echo "✅ Android Environment configured."

    echo "[ANDROID] [ETAPA 2/4] Build aplicatie pentru $ENV..."
    npx vite build > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ vite build esuat"
        exit 1
    fi
    echo "✅ Done."

    echo "[ANDROID] [ETAPA 3/4] Sincronizare cu Android..."
    npx cap sync android > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ capacitor sync android esuat"
        exit 1
    fi
    echo "✅ Done."

    echo "[ANDROID] [ETAPA 4/4] Lansare Android Studio..."
    npx cap open android > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ deschiderea Android Studio esuata"
        echo "Android project ready in android/ folder"
    fi
    echo "✅ Done."

    echo
    echo "🤖 ================================================"
    echo "        ANDROID BUILD FINALIZAT CU SUCCES!"
    echo "================================================"
    echo "Environment: $ENV_NAME"
    echo "Proiectul Android este gata."
    echo

    show_final_options
}

# Function: Build iOS
build_ios() {
    echo
    echo "[iOS] [ETAPA 1/4] Instalare dependinte..."
    npm install > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ npm install esuat"
        exit 1
    fi
    echo "✅ Done."
    
    echo "[iOS] [ETAPA 1.5/4] Configure iOS environment..."
    cat > ios/App/App/environment.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>API_BASE_URL</key>
    <string>$API_URL</string>
    <key>ENVIRONMENT</key>
    <string>$ENV_NAME</string>
</dict>
</plist>
EOF
    echo "✅ iOS Environment configured."

    echo "[iOS] [ETAPA 2/4] Build aplicatie pentru $ENV..."
    npx vite build > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ vite build esuat"
        exit 1
    fi
    echo "✅ Done."

    echo "[iOS] [ETAPA 3/4] Sincronizare cu iOS..."
    npx cap sync ios > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ capacitor sync ios esuat"
        exit 1
    fi
    echo "✅ Done."

    echo "[iOS] [ETAPA 4/4] Lansare Xcode..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        npx cap open ios > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "⚠️ deschiderea Xcode esuata"
        fi
        echo "✅ Done."
    else
        echo "⚠️ Skip (not macOS) - iOS project ready in ios/ folder"
    fi

    echo
    echo "🍎 ================================================"
    echo "          iOS BUILD FINALIZAT CU SUCCES!"
    echo "================================================"
    echo "Environment: $ENV_NAME"
    echo "Proiectul iOS este gata in ios/ folder."
    echo

    show_final_options
}


# Function: Show final options
show_final_options() {
    echo "================================================"
    echo
    echo "Continui cu alte operatiuni?"
    echo
    echo "1. Restart build cu alte optiuni"
    echo "2. Deschide director proiect"
    echo "3. Iesire"
    echo
    read -p "Alege optiunea (1, 2 sau 3): " choice

    case $choice in
        1)
            echo
            echo "Restarting master build tool..."
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
            echo "Master build tool terminat."
            sleep 2
            ;;
    esac
}