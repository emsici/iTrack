@echo off
echo Testing TransistorSoft Background Geolocation build...

echo.
echo [1/4] Building web application...
call npx vite build
if errorlevel 1 goto error

echo.
echo [2/4] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 goto error

echo.
echo [3/4] Testing Android build (DEBUG mode - FREE)...
cd android
call gradlew assembleDebug --warning-mode all
if errorlevel 1 goto error
cd ..

echo.
echo [4/4] Build completed successfully!
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Background GPS is configured with:
echo - stopOnTerminate: false (continues when app closed)
echo - startOnBoot: true (auto-start after reboot)
echo - foregroundService: true (high priority Android service)
echo - enableHeadless: true (true background operation)
echo.
echo This DEBUG build is FREE to use for testing!
echo For Google Play RELEASE, you need TransistorSoft license.
goto end

:error
echo.
echo ERROR: Build failed! Check the error messages above.
exit /b 1

:end
echo Test build completed.
pause