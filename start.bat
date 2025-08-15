@echo off
if "%1"=="" (
    set ENV=PROD
    echo ================================
    echo    iTrack - DEFAULT PROD BUILD
    echo ================================
    echo.
    echo Folosesc mediul default PROD (etsm_prod)
    echo Pentru DEVELOPMENT foloseste: start.bat DEV
    echo.
) else (
    set ENV=%1
)

echo ================================
echo    iTrack - START %ENV%
echo ================================
echo.

REM Step 1: Switch environment
echo PASUL 1/2 - Comutare environment la %ENV%...

if /i "%ENV%"=="DEV" (
    echo Setez DEVELOPMENT environment...
    powershell -Command "(Get-Content 'src\services\api.ts') -replace 'API_BASE_URL = API_CONFIG\.PROD;', 'API_BASE_URL = API_CONFIG.DEV;' | Set-Content 'src\services\api.ts'"
    powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_PROD', 'API_BASE_URL_DEV' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"
    echo - Configurat pentru DEV (www.euscagency.com/etsm3/)
) else (
    echo Setez PRODUCTION environment...
    powershell -Command "(Get-Content 'src\services\api.ts') -replace 'API_BASE_URL = API_CONFIG\.DEV;', 'API_BASE_URL = API_CONFIG.PROD;' | Set-Content 'src\services\api.ts'"
    powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_DEV', 'API_BASE_URL_PROD' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"
    echo - Configurat pentru PRODUCTION (www.euscagency.com/etsm_prod/)
)

echo.
echo PASUL 2/2 - Rulare build.bat pentru compilare completa...
call build.bat
if errorlevel 1 (
    echo EROARE: Build-ul complet a esuat!
    pause
    exit /b 1
)

echo.
echo ================================
echo   START %ENV% PROCESS COMPLETED!
echo ================================
echo.
echo Environment: %ENV%
echo Build-ul complet finalizat prin build.bat
echo Android Studio s-a deschis automat pentru build-ul final.
pause