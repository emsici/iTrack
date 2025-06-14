@echo off
echo ========================================
echo      iTrack - Build and Open Android
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [2/4] Building project...
call npx vite build
if %errorlevel% neq 0 (
    echo ERROR: vite build failed
    pause
    exit /b 1
)
echo ✓ Project built

echo.
echo [3/4] Syncing with Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: capacitor sync failed
    pause
    exit /b 1
)
echo ✓ Android synced

echo.
echo [4/4] Opening Android Studio...
call npx cap open android
if %errorlevel% neq 0 (
    echo ERROR: failed to open Android Studio
    pause
    exit /b 1
)
echo ✓ Android Studio opened

echo.
echo ========================================
echo           Build Complete!
echo ========================================
echo Project ready for testing in Android Studio
pause