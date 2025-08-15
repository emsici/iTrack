#!/bin/bash

if [ "$1" = "" ]; then
    echo "================================"
    echo "    iTrack - BUILD SYSTEM"
    echo "================================"
    echo ""
    echo "FOLOSIRE: ./build_and_run.sh [PROD|TEST]"
    echo ""
    echo "Exemple:"
    echo "  ./build_and_run.sh PROD  - Comuta la PRODUCTION si face build"
    echo "  ./build_and_run.sh TEST  - Comuta la TEST si face build"
    echo ""
    exit 1
fi

ENV=$1
echo "================================"
echo "    iTrack - BUILD $ENV"
echo "================================"
echo ""

# Step 1: Switch environment
echo "PASUL 1/5 - Comutare la $ENV..."
echo ""

# Backup current files
echo "Creez backup-uri..."
cp "src/services/api.ts" "src/services/api.ts.backup" 2>/dev/null
cp "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java" "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java.backup" 2>/dev/null

if [ "$ENV" = "PROD" ] || [ "$ENV" = "prod" ]; then
    echo "Setez PRODUCTION environment..."
    sed -i 's/const currentConfig = API_CONFIG\.TEST;/const currentConfig = API_CONFIG.PROD;/g' "src/services/api.ts"
    sed -i 's/API_BASE_URL_TEST/API_BASE_URL_PROD/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
    echo "✓ Configurat pentru PRODUCTION (www.euscagency.com/etsm_prod/)"
elif [ "$ENV" = "TEST" ] || [ "$ENV" = "test" ]; then
    echo "Setez TEST environment..."
    sed -i 's/const currentConfig = API_CONFIG\.PROD;/const currentConfig = API_CONFIG.TEST;/g' "src/services/api.ts"
    sed -i 's/API_BASE_URL_PROD/API_BASE_URL_TEST/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
    echo "✓ Configurat pentru TEST (www.euscagency.com/etsm_test/)"
else
    echo "EROARE: Environment nevalid! Foloseste PROD sau TEST"
    exit 1
fi

echo ""
echo "PASUL 2/5 - Building web application..."
npm run build
if [ $? -ne 0 ]; then
    echo "EROARE: Build-ul web a esuat!"
    exit 1
fi

echo "PASUL 3/5 - Syncing with Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "EROARE: Capacitor sync a esuat!"
    exit 1
fi

echo "PASUL 4/5 - Copying assets to Android..."
npx cap copy android

echo "PASUL 5/5 - Opening Android Studio..."
echo ""
npx cap open android

echo ""
echo "================================"
echo "   BUILD $ENV PROCESS COMPLETED!"
echo "================================"
echo ""
echo "Environment: $ENV"
echo "Android Studio s-a deschis pentru build-ul final."
echo ""
echo "Pentru a finaliza:"
echo "1. In Android Studio, apasa pe 'Build' > 'Build Bundle(s) / APK(s)' > 'Build APK(s)'"
echo "2. APK-ul va fi generat in: android/app/build/outputs/apk/debug/"
echo "3. Instaleaza APK-ul pe telefon pentru testare"
echo ""