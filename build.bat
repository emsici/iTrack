@echo off
echo ========================================
echo     iTrack - Production Build
echo ========================================
echo.
echo Building for PRODUCTION environment...
echo API: www.euscagency.com/etsm_prod/
echo.

REM Set production environment variables
set VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
set NODE_ENV=production

echo [1/4] Instalare dependinte...
call npm install
if %errorlevel% neq 0 (
    echo EROARE: npm install esuat
    pause
    exit /b 1
)
echo - Dependinte instalate

echo.
echo [2/4] Build proiect pentru PRODUCTION...
call npx vite build
if %errorlevel% neq 0 (
    echo EROARE: vite build esuat
    pause
    exit /b 1
)
echo - Proiect compilat pentru PRODUCTION

echo.
echo [3/4] Sincronizare cu Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo EROARE: capacitor sync esuat
    pause
    exit /b 1
)
echo - Android sincronizat

echo.
echo [4/4] Deschidere Android Studio...
call npx cap open android
if %errorlevel% neq 0 (
    echo EROARE: deschiderea Android Studio esuata
    pause
    exit /b 1
)
echo - Android Studio deschis

echo.
echo ========================================
echo           Build PRODUCTION Finalizat!
echo ========================================
echo Proiect gata pentru release in Android Studio
echo Environment: PRODUCTION (etsm_prod)
pause