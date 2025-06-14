@echo off
echo Building final iTrack APK with background GPS...
echo.
echo Features:
echo - GPS works when phone is locked
echo - Automatic permission requests  
echo - Fixed mobile UI overlap
echo - 60 second transmission interval
echo.

cd android
echo Starting Android build...
call gradlew assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! APK built with background GPS tracking
    echo Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Install on phone and test:
    echo 1. Start a course - permissions requested automatically
    echo 2. Lock phone and minimize app
    echo 3. GPS sends coordinates every 60 seconds
) else (
    echo ERROR: Build failed
)
pause