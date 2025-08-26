@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ================================================
echo            iTrack GPS - Build Tool
echo ================================================
echo.

rem Interactive environment selection if no parameter provided
if "%1"=="" (
    echo Selecteaza environment-ul pentru build:
    echo.
    echo 1. DEVELOPMENT ^(API: etsm3^)
    echo 2. PRODUCTION  ^(API: etsm_prod^)
    echo.
    set /p choice="Introdu optiunea (1 sau 2): "
    
    if "!choice!"=="1" (
        set ENV=dev
    ) else if "!choice!"=="2" (
        set ENV=prod
    ) else (
        echo.
        echo Optiune invalida. Folosesc PRODUCTION ca default.
        set ENV=prod
        timeout /t 2 >nul
    )
) else (
    set ENV=%1
)

echo.
echo ================================================

if /i "%ENV%"=="dev" (
    echo Environment: DEVELOPMENT
    echo API Endpoint: www.euscagency.com/etsm3/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    set NODE_ENV=development
) else if /i "%ENV%"=="prod" (
    echo Environment: PRODUCTION
    echo API Endpoint: www.euscagency.com/etsm_prod/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    set NODE_ENV=production
) else (
    echo.
    echo EROARE: Environment invalid '%ENV%'
    echo Foloseste: dev sau prod
    echo.
    pause
    exit /b 1
)

echo ================================================

echo.
echo Pornesc procesul de build...
echo.

echo [ETAPA 1/4] Instalare dependinte Node.js...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: npm install esuat
    echo Verificati conexiunea internet si package.json
    echo.
    pause
    exit /b 1
)
echo Done.

echo [ETAPA 2/4] Build aplicatie pentru %ENV%...
call npx vite build >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: vite build esuat
    echo Verificati codul TypeScript si dependintele
    echo.
    pause
    exit /b 1
)
echo Done.

echo [ETAPA 3/4] Sincronizare cu Android...
call npx cap sync android >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: capacitor sync esuat
    echo Verificati configuratia Capacitor
    echo.
    pause
    exit /b 1
)
echo Done.

echo [ETAPA 4/4] Lansare Android Studio...
call npx cap open android >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: deschiderea Android Studio esuata
    echo Instalati Android Studio si configurati PATH
    echo.
    pause
    exit /b 1
)
echo Done.

echo.
echo ================================================
echo              BUILD FINALIZAT CU SUCCES!
echo ================================================
echo.
echo Toate etapele au fost finalizate cu succes.
echo Proiectul este gata in Android Studio.
echo Environment: %ENV%
echo.
echo INSTRUCTIUNI URMATOARE:
echo 1. Android Studio este deschis
echo 2. Selectati device/emulator
echo 3. Apasati 'Run' pentru testare
echo 4. Pentru APK: Build -^> Generate Signed Bundle/APK
echo.
echo ================================================
echo.

echo Continui cu alte operatiuni?
echo.
echo 1. Restart build cu alt environment
echo 2. Deschide director proiect
echo 3. Iesire
echo.
set /p choice="Alege optiunea (1, 2 sau 3): "

if "!choice!"=="1" (
    echo.
    echo Restarting build tool...
    timeout /t 1 >nul
    "%~f0"
) else if "!choice!"=="2" (
    echo.
    echo Deschid directorul proiectului...
    start .
) else (
    echo.
    echo Build tool terminat.
    timeout /t 2 >nul
)