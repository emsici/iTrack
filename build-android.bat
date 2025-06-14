@echo off
title iTrack Android Build Script
color 0A

echo ============================================
echo     iTrack - Android Build Script
echo ============================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)

echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [2/5] Building web application...
call npx vite build
if errorlevel 1 (
    echo ERROR: Failed to build web application
    pause
    exit /b 1
)

echo [3/5] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Failed to sync with Capacitor
    pause
    exit /b 1
)

echo [4/5] Opening Android Studio...
call npx cap open android

echo [5/5] Build completed successfully!
echo.
echo Next steps:
echo 1. Android Studio should now be open
echo 2. Connect your Android device or start an emulator
echo 3. Click "Run" in Android Studio to install the app
echo 4. Or go to Build ^> Generate Signed Bundle/APK for release
echo.
echo Build completed at: %date% %time%
echo ============================================

pause