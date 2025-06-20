@echo off
echo === BUILDING APK WITHOUT CACHE ===

echo Stopping all Gradle processes...
taskkill /f /im java.exe >nul 2>&1

echo Cleaning project completely...
cd /d "%~dp0android"
if exist build rmdir /s /q build
if exist .gradle rmdir /s /q .gradle
if exist app\build rmdir /s /q app\build

echo Using Gradle with no cache and offline mode disabled...
gradlew --no-daemon --no-build-cache --refresh-dependencies clean
gradlew --no-daemon --no-build-cache assembleDebug

if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo SUCCESS: APK built successfully!
    echo Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    dir "app\build\outputs\apk\debug\app-debug.apk"
) else (
    echo.
    echo FAILED: APK was not created
    echo Try using Android Studio instead
)

pause