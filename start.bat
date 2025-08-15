@echo off
if "%1"=="" (
    set ENV=TEST
    echo ================================
    echo    iTrack - DEFAULT TEST BUILD
    echo ================================
    echo.
    echo Folosesc mediul default TEST
    echo Pentru PRODUCTION foloseste: start.bat PROD
    echo.
) else (
    set ENV=%1
)

echo ================================
echo    iTrack - BUILD %ENV%
echo ================================
echo.

REM Step 1: Switch environment
echo PASUL 1/4 - Comutare la %ENV%...

if /i "%ENV%"=="PROD" (
    echo Setez PRODUCTION environment...
    powershell -Command "(Get-Content 'src\services\api.ts') -replace 'const currentConfig = API_CONFIG\.TEST;', 'const currentConfig = API_CONFIG.PROD;' | Set-Content 'src\services\api.ts'"
    powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_TEST', 'API_BASE_URL_PROD' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"
    echo ✓ Configurat pentru PRODUCTION (www.euscagency.com/etsm_prod/)
) else (
    echo Setez TEST environment...
    powershell -Command "(Get-Content 'src\services\api.ts') -replace 'const currentConfig = API_CONFIG\.PROD;', 'const currentConfig = API_CONFIG.TEST;' | Set-Content 'src\services\api.ts'"
    powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_PROD', 'API_BASE_URL_TEST' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"
    echo ✓ Configurat pentru TEST (www.euscagency.com/etsm_test/)
)

echo.
echo PASUL 2/4 - Building web application...
call npm run build
if errorlevel 1 (
    echo EROARE: Build-ul web a esuat!
    pause
    exit /b 1
)

echo PASUL 3/4 - Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo EROARE: Capacitor sync a esuat!
    pause
    exit /b 1
)

echo PASUL 4/4 - Opening Android Studio...
echo.
call npx cap open android

echo.
echo ================================
echo   BUILD %ENV% PROCESS COMPLETED!
echo ================================
echo.
echo Environment: %ENV%
echo Android Studio s-a deschis pentru build-ul final.
echo.
echo Pentru a finaliza:
echo 1. In Android Studio, apasa pe "Build" ^> "Build Bundle(s) / APK(s)" ^> "Build APK(s)"
echo 2. APK-ul va fi generat in: android/app/build/outputs/apk/debug/
echo 3. Instaleaza APK-ul pe telefon pentru testare
echo.
pause