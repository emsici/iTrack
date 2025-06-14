@echo off
title iTrack Quick Build
color 0B

echo ============================
echo   iTrack - Quick Build
echo ============================
echo.

echo [1/3] Building app...
call npx vite build

echo [2/3] Syncing Android...
call npx cap sync android

echo [3/3] Opening Android Studio...
call npx cap open android

echo.
echo Quick build completed!
echo Android Studio is now opening...
echo.
pause