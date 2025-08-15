@echo off
echo ================================
echo    iTrack - SWITCH TO PRODUCTION
echo ================================
echo.
echo Comutare la serverul PRODUCTION...
echo.

REM Backup current files
echo Creez backup-uri...
copy "src\services\api.ts" "src\services\api.ts.backup" >nul
copy "android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java" "android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java.backup" >nul

REM Switch API.ts to PROD
echo Actualizez src\services\api.ts...
powershell -Command "(Get-Content 'src\services\api.ts') -replace 'const currentConfig = API_CONFIG\.TEST;', 'const currentConfig = API_CONFIG.PROD;' | Set-Content 'src\services\api.ts'"

REM Switch OptimalGPSService.java to PROD
echo Actualizez OptimalGPSService.java...
powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_TEST', 'API_BASE_URL_PROD' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"

echo.
echo ================================
echo   SUCCES! Comutat la PRODUCTION
echo ================================
echo.
echo API-ul acum foloseste:
echo - Frontend: API_CONFIG.PROD
echo - Android: API_BASE_URL_PROD
echo - Server: www.euscagency.com/etsm_prod/
echo.
echo ATENTIE: Rebuild aplicatia Android dupa aceasta schimbare!
echo.
pause