@echo off
if "%1"=="" (
    set ENV=prod
    echo ========================================
    echo         iTrack - Build Script
    echo ========================================
    echo.
    echo DEFAULT: Production build (etsm_prod)
    echo Pentru development foloseste: build.bat dev
    echo.
) else (
    set ENV=%1
)

echo ========================================
echo         iTrack - Build %ENV%
echo ========================================
echo.

if /i "%ENV%"=="dev" (
    echo Building for DEVELOPMENT environment...
    echo API: www.euscagency.com/etsm3/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    set NODE_ENV=development
) else if /i "%ENV%"=="prod" (
    echo Building for PRODUCTION environment...
    echo API: www.euscagency.com/etsm_prod/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    set NODE_ENV=production
) else (
    echo EROARE: Environment invalid '%ENV%'
    echo Foloseste: dev sau prod
    echo.
echo press any key to exit
pause > nul
    exit /b 1
)

echo.
echo [1/4] Instalare dependinte...
call npm install
if %errorlevel% neq 0 (
    echo EROARE: npm install esuat
    echo.
echo press any key to exit
pause > nul
    exit /b 1
)
echo - Dependinte instalate

echo.
echo [2/4] Build proiect pentru %ENV%...
call npx vite build
if %errorlevel% neq 0 (
    echo EROARE: vite build esuat
    echo.
echo press any key to exit
pause > nul
    exit /b 1
)
echo - Proiect compilat pentru %ENV%

echo.
echo [3/4] Sincronizare cu Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo EROARE: capacitor sync esuat
    echo.
echo press any key to exit
pause > nul
    exit /b 1
)
echo - Android sincronizat

echo.
echo [4/4] Deschidere Android Studio...
call npx cap open android
if %errorlevel% neq 0 (
    echo EROARE: deschiderea Android Studio esuata
    echo.
echo press any key to exit
pause > nul
    exit /b 1
)
echo - Android Studio deschis

echo.
echo ========================================
echo           Build %ENV% Finalizat!
echo ========================================
echo Proiect gata pentru %ENV% in Android Studio
echo Environment: %ENV%
echo.
echo press any key to exit
pause > nul