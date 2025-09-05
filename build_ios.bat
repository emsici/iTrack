@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ================================================
echo        iTrack GPS - iOS Build Tool
echo ================================================
echo.

rem Interactive environment selection if no parameter provided
if "%1"=="" (
    echo Selecteaza environment-ul pentru build iOS:
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
echo Pornesc procesul de build iOS...
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

echo [ETAPA 3/4] Sincronizare cu iOS...
call npx cap sync ios >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: capacitor sync ios esuat
    echo Verificati configuratia Capacitor
    echo.
    pause
    exit /b 1
)
echo Done.

echo [ETAPA 4/4] Lansare Xcode...
call npx cap open ios >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: deschiderea Xcode esuata
    echo Instalati Xcode si configurati PATH (macOS only)
    echo.
    pause
    exit /b 1
)
echo Done.

echo.
echo ================================================
echo            iOS BUILD FINALIZAT CU SUCCES!
echo ================================================
echo.
echo Toate etapele au fost finalizate cu succes.
echo Proiectul iOS este gata in Xcode.
echo Environment: %ENV%
echo.
echo INSTRUCTIUNI URMATOARE:
echo 1. Xcode este deschis (macOS only)
echo 2. Selectati device/simulator iOS
echo 3. Apasati 'Run' pentru testare
echo 4. Pentru IPA: Product -^> Archive -^> Distribute App
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
    echo Restarting iOS build tool...
    timeout /t 1 >nul
    "%~f0"
) else if "!choice!"=="2" (
    echo.
    echo Deschid directorul proiectului...
    start .
) else (
    echo.
    echo iOS build tool terminat.
    timeout /t 2 >nul
)