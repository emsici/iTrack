#!/bin/bash

echo "================================"
echo "   iTrack - SWITCH TO PRODUCTION"
echo "================================"
echo ""
echo "Comutare la serverul PRODUCTION..."
echo ""

# Backup current files
echo "Creez backup-uri..."
cp "src/services/api.ts" "src/services/api.ts.backup"
cp "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java" "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java.backup"

# Switch API.ts to PROD
echo "Actualizez src/services/api.ts..."
sed -i 's/const currentConfig = API_CONFIG\.TEST;/const currentConfig = API_CONFIG.PROD;/g' "src/services/api.ts"

# Switch OptimalGPSService.java to PROD
echo "Actualizez OptimalGPSService.java..."
sed -i 's/API_BASE_URL_TEST/API_BASE_URL_PROD/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"

echo ""
echo "================================"
echo "  SUCCES! Comutat la PRODUCTION"
echo "================================"
echo ""
echo "API-ul acum foloseste:"
echo "- Frontend: API_CONFIG.PROD"
echo "- Android: API_BASE_URL_PROD"
echo "- Server: www.euscagency.com/etsm_prod/"
echo ""
echo "ATENTIE: Rebuild aplicatia Android dupa aceasta schimbare!"
echo ""