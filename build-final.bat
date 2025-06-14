@echo off
echo Building iTrack APK with Multiple Course Tracking...
echo.
echo Features:
echo - Multiple simultaneous course tracking
echo - Background GPS when phone is locked
echo - "Allow all the time" location permission
echo - Status 2=active, 3=pause, 4=stop
echo - 60-second coordinate transmission per active course
echo.

cd android
echo Starting Android build...
call gradlew assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! APK built with multiple course tracking
    echo Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo TESTING INSTRUCTIONS:
    echo 1. Install APK on phone
    echo 2. Start multiple courses - select "Allow all the time" for location
    echo 3. Lock phone and minimize app
    echo 4. Each active course sends coordinates every 60 seconds
    echo 5. Pause/resume individual courses - GPS continues for active ones
) else (
    echo ERROR: Build failed
)
pause