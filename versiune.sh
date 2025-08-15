#!/bin/bash

if [ "$1" = "" ]; then
    ENV="TEST"
    echo "================================"
    echo "    iTrack - DEFAULT TEST BUILD"
    echo "================================"
    echo ""
    echo "Folosesc mediul default TEST"
    echo "Pentru PRODUCTION foloseste: ./versiune.sh PROD"
    echo ""
else
    ENV=$1
fi

echo "================================"
echo "    iTrack - BUILD $ENV"
echo "================================"
echo ""

# Step 1: Switch environment
echo "PASUL 1/4 - Comutare la $ENV..."

if [ "$ENV" = "PROD" ] || [ "$ENV" = "prod" ]; then
    echo "Setez PRODUCTION environment..."
    sed -i 's/const currentConfig = API_CONFIG\.TEST;/const currentConfig = API_CONFIG.PROD;/g' "src/services/api.ts"
    sed -i 's/API_BASE_URL_TEST/API_BASE_URL_PROD/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
    echo "✓ Configurat pentru PRODUCTION (www.euscagency.com/etsm_prod/)"
else
    echo "Setez TEST environment..."
    sed -i 's/const currentConfig = API_CONFIG\.PROD;/const currentConfig = API_CONFIG.TEST;/g' "src/services/api.ts"
    sed -i 's/API_BASE_URL_PROD/API_BASE_URL_TEST/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
    echo "✓ Configurat pentru TEST (www.euscagency.com/etsm_test/)"
fi

echo ""
echo "PASUL 2/4 - Building web application..."
npm run build
if [ $? -ne 0 ]; then
    echo "EROARE: Build-ul web a esuat!"
    exit 1
fi

echo "PASUL 3/4 - Syncing with Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "EROARE: Capacitor sync a esuat!"
    exit 1
fi

echo "PASUL 4/4 - Opening Android Studio..."
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