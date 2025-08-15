#!/bin/bash

if [ "$1" = "" ]; then
    ENV="DEV"
    echo "================================"
    echo "    iTrack - DEFAULT DEV BUILD"
    echo "================================"
    echo ""
    echo "Folosesc mediul default DEV (etsm3)"
    echo "Pentru PRODUCTION foloseste: ./start.sh PROD"
    echo ""
else
    ENV=$1
fi

echo "================================"
echo "    iTrack - START $ENV"
echo "================================"
echo ""

# Step 1: Switch environment
echo "PASUL 1/2 - Comutare environment la $ENV..."

if [ "$ENV" = "PROD" ] || [ "$ENV" = "prod" ]; then
    echo "Setez PRODUCTION environment..."
    sed -i 's/API_BASE_URL = API_CONFIG\.DEV;/API_BASE_URL = API_CONFIG.PROD;/g' "src/services/api.ts"
    sed -i 's/API_BASE_URL_DEV/API_BASE_URL_PROD/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
    echo "✓ Configurat pentru PRODUCTION (www.euscagency.com/etsm_prod/)"
else
    echo "Setez DEV environment..."
    sed -i 's/API_BASE_URL = API_CONFIG\.PROD;/API_BASE_URL = API_CONFIG.DEV;/g' "src/services/api.ts"
    sed -i 's/API_BASE_URL_PROD/API_BASE_URL_DEV/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
    echo "✓ Configurat pentru DEV (www.euscagency.com/etsm3/)"
fi

echo ""
echo "PASUL 2/2 - Rulare build.sh pentru compilare completa..."

# Create build.sh if it doesn't exist (equivalent to build.bat)
if [ ! -f "build.sh" ]; then
    echo "#!/bin/bash" > build.sh
    echo "echo ========================================"
    echo "echo     iTrack - Build si Deschidere Android"
    echo "echo ========================================"
    echo "echo"
    echo ""
    echo "echo [1/4] Instalare dependinte..."
    echo "npm install"
    echo 'if [ $? -ne 0 ]; then'
    echo '    echo "EROARE: npm install esuat"'
    echo '    exit 1'
    echo 'fi'
    echo "echo - Dependinte instalate"
    echo ""
    echo "echo"
    echo "echo [2/4] Build proiect..."
    echo "npx vite build"
    echo 'if [ $? -ne 0 ]; then'
    echo '    echo "EROARE: vite build esuat"'
    echo '    exit 1'
    echo 'fi'
    echo "echo - Proiect compilat"
    echo ""
    echo "echo"
    echo "echo [3/4] Sincronizare cu Android..."
    echo "npx cap sync android"
    echo 'if [ $? -ne 0 ]; then'
    echo '    echo "EROARE: capacitor sync esuat"'
    echo '    exit 1'
    echo 'fi'
    echo "echo - Android sincronizat"
    echo ""
    echo "echo"
    echo "echo [4/4] Deschidere Android Studio..."
    echo "npx cap open android"
    echo 'if [ $? -ne 0 ]; then'
    echo '    echo "EROARE: deschiderea Android Studio esuata"'
    echo '    exit 1'
    echo 'fi'
    echo "echo - Android Studio deschis"
    echo ""
    echo "echo"
    echo "echo ========================================"
    echo "echo           Build Finalizat!"
    echo "echo ========================================"
    echo "echo Proiect gata pentru testare in Android Studio"
    chmod +x build.sh
fi

# Run build.sh
./build.sh
if [ $? -ne 0 ]; then
    echo "EROARE: Build-ul complet a esuat!"
    exit 1
fi

echo ""
echo "================================"
echo "   START $ENV PROCESS COMPLETED!"
echo "================================"
echo ""
echo "Environment: $ENV"
echo "Build-ul complet finalizat prin build.sh"
echo "Android Studio s-a deschis automat pentru build-ul final."
echo ""
echo "build.sh a facut:"
echo "1. npm install (dependinte)"
echo "2. npx vite build (compilare)"
echo "3. npx cap sync android (sincronizare)"
echo "4. npx cap open android (Android Studio)"
echo ""