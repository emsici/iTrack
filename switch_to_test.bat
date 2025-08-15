@echo off
echo ================================
echo      iTrack - SWITCH TO TEST
echo ================================
echo.
echo Comutare la serverul TEST...
echo.

REM Backup current files
echo Creez backup-uri...
copy "src\services\api.ts" "src\services\api.ts.backup" >nul
copy "android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java" "android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java.backup" >nul

REM Switch API.ts to TEST
echo Actualizez src\services\api.ts...
powershell -Command "(Get-Content 'src\services\api.ts') -replace 'const currentConfig = API_CONFIG\.PROD;', 'const currentConfig = API_CONFIG.TEST;' | Set-Content 'src\services\api.ts'"

REM Switch OptimalGPSService.java to TEST
echo Actualizez OptimalGPSService.java...
powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_PROD', 'API_BASE_URL_TEST' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"

echo.
echo ================================
echo     SUCCES! Comutat la TEST
echo ================================
echo.
echo API-ul acum foloseste:
echo - Frontend: API_CONFIG.TEST
echo - Android: API_BASE_URL_TEST
echo - Server: www.euscagency.com/etsm_test/
echo.
echo ATENTIE: Rebuild aplicatia Android dupa aceasta schimbare!
echo.
pause