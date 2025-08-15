@echo off
if "%1"=="" (
    echo ================================
    echo    iTrack - VERSIUNE SYSTEM
    echo ================================
    echo.
    echo FOLOSIRE: versiune.bat [DEV^|TEST^|PROD]
    echo.
    echo Exemple:
    echo   versiune.bat DEV   - Porneste server pentru dezvoltare
    echo   versiune.bat TEST  - Comuta la TEST si face build
    echo   versiune.bat PROD  - Comuta la PRODUCTION si face build
    echo.
    pause
    exit /b 1
)

set ENV=%1

if /i "%ENV%"=="DEV" (
    echo ================================
    echo    iTrack - DEVELOPMENT SERVER
    echo ================================
    echo.
    echo Pornesc serverul de dezvoltare...
    echo Server web va fi disponibil la: http://localhost:5000
    echo.
    call npm run dev
    echo.
    echo Server-ul de dezvoltare s-a oprit.
    pause
    exit /b 0
)

echo ================================
echo    iTrack - BUILD %ENV%
echo ================================
echo.

REM Step 1: Switch environment
echo PASUL 1/5 - Comutare la %ENV%...
echo.

REM Backup current files
echo Creez backup-uri...
copy "src\services\api.ts" "src\services\api.ts.backup" >nul 2>&1
copy "android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java" "android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java.backup" >nul 2>&1

if /i "%ENV%"=="PROD" (
    echo Setez PRODUCTION environment...
    powershell -Command "(Get-Content 'src\services\api.ts') -replace 'const currentConfig = API_CONFIG\.TEST;', 'const currentConfig = API_CONFIG.PROD;' | Set-Content 'src\services\api.ts'"
    powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_TEST', 'API_BASE_URL_PROD' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"
    echo ✓ Configurat pentru PRODUCTION (www.euscagency.com/etsm_prod/)
) else if /i "%ENV%"=="TEST" (
    echo Setez TEST environment...
    powershell -Command "(Get-Content 'src\services\api.ts') -replace 'const currentConfig = API_CONFIG\.PROD;', 'const currentConfig = API_CONFIG.TEST;' | Set-Content 'src\services\api.ts'"
    powershell -Command "(Get-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java') -replace 'API_BASE_URL_PROD', 'API_BASE_URL_TEST' | Set-Content 'android\app\src\main\java\com\euscagency\itrack\OptimalGPSService.java'"
    echo ✓ Configurat pentru TEST (www.euscagency.com/etsm_test/)
) else (
    echo EROARE: Environment nevalid! Foloseste DEV, TEST sau PROD
    pause
    exit /b 1
)

echo.
echo PASUL 2/5 - Building web application...
call npm run build
if errorlevel 1 (
    echo EROARE: Build-ul web a esuat!
    pause
    exit /b 1
)

echo PASUL 3/5 - Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo EROARE: Capacitor sync a esuat!
    pause
    exit /b 1
)

echo PASUL 4/5 - Copying assets to Android...
call npx cap copy android

echo PASUL 5/5 - Opening Android Studio...
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