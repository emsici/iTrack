@echo off
echo ================================
echo    iTrack - BUILD AND RUN
echo ================================
echo.
echo Incepem procesul de build...
echo.

REM Build the web application first
echo 1/4 - Building web application...
call npm run build
if errorlevel 1 (
    echo EROARE: Build-ul web a esuat!
    pause
    exit /b 1
)

REM Sync with Capacitor
echo 2/4 - Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo EROARE: Capacitor sync a esuat!
    pause
    exit /b 1
)

REM Copy assets to Android
echo 3/4 - Copying assets to Android...
call npx cap copy android

REM Build Android APK
echo 4/4 - Building Android APK...
echo.
echo Deschid Android Studio pentru build final...
echo.
call npx cap open android

echo.
echo ================================
echo     BUILD PROCESS COMPLETED!
echo ================================
echo.
echo Android Studio s-a deschis pentru build-ul final.
echo.
echo Pentru a finaliza:
echo 1. In Android Studio, apasa pe "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)"
echo 2. APK-ul va fi generat in: android/app/build/outputs/apk/debug/
echo 3. Instaleaza APK-ul pe telefon pentru testare
echo.
echo ATENTIE: Asigura-te ca ai setat corect PROD/TEST in configuratii!
echo.
pause