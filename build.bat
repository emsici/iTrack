@echo off
echo ========================================
echo     iTrack - Build si Deschidere Android
echo ========================================
echo.

echo [1/4] Instalare dependinte...
call npm install
if %errorlevel% neq 0 (
    echo EROARE: npm install esuat
    pause
    exit /b 1
)
echo ✓ Dependinte instalate

echo.
echo [2/4] Build proiect...
call npx vite build
if %errorlevel% neq 0 (
    echo EROARE: vite build esuat
    pause
    exit /b 1
)
echo ✓ Proiect compilat

echo.
echo [3/4] Sincronizare cu Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo EROARE: capacitor sync esuat
    pause
    exit /b 1
)
echo ✓ Android sincronizat

echo.
echo [4/4] Deschidere Android Studio...
call npx cap open android
if %errorlevel% neq 0 (
    echo EROARE: deschiderea Android Studio esuata
    pause
    exit /b 1
)
echo ✓ Android Studio deschis

echo.
echo ========================================
echo           Build Finalizat!
echo ========================================
echo Proiect gata pentru testare in Android Studio
pause