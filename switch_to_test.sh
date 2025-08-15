#!/bin/bash

echo "================================"
echo "     iTrack - SWITCH TO TEST"
echo "================================"
echo ""
echo "Comutare la serverul TEST..."
echo ""

# Backup current files
echo "Creez backup-uri..."
cp "src/services/api.ts" "src/services/api.ts.backup"
cp "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java" "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java.backup"

# Switch API.ts to TEST
echo "Actualizez src/services/api.ts..."
sed -i 's/const currentConfig = API_CONFIG\.PROD;/const currentConfig = API_CONFIG.TEST;/g' "src/services/api.ts"

# Switch OptimalGPSService.java to TEST
echo "Actualizez OptimalGPSService.java..."
sed -i 's/API_BASE_URL_PROD/API_BASE_URL_TEST/g' "android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"

echo ""
echo "================================"
echo "    SUCCES! Comutat la TEST"
echo "================================"
echo ""
echo "API-ul acum foloseste:"
echo "- Frontend: API_CONFIG.TEST"
echo "- Android: API_BASE_URL_TEST"
echo "- Server: www.euscagency.com/etsm_test/"
echo ""
echo "ATENTIE: Rebuild aplicatia Android dupa aceasta schimbare!"
echo ""