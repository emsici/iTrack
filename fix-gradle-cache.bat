@echo off
echo === FIXING GRADLE CACHE CORRUPTION ===

echo 1. Stopping Gradle daemons...
cd /d "%~dp0android"
gradlew --stop

echo 2. Cleaning local build cache...
rmdir /s /q build 2>nul
rmdir /s /q .gradle 2>nul
rmdir /s /q app\build 2>nul

echo 3. Cleaning global Gradle cache...
rmdir /s /q "%USERPROFILE%\.gradle\caches\8.11.1" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\wrapper\dists\gradle-8.11.1-all" 2>nul

echo 4. Deleting corrupted transforms...
rmdir /s /q "%USERPROFILE%\.gradle\caches\transforms-3" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\caches\modules-2" 2>nul

echo 5. Re-syncing Capacitor...
cd /d "%~dp0"
call npx cap sync android

echo 6. Building with clean cache...
cd /d "%~dp0android"
gradlew clean --refresh-dependencies
gradlew assembleDebug

echo === GRADLE CACHE FIXED ===
pause