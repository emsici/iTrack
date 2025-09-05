@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ================================================
echo        iTrack GPS - Master Build Tool
echo ================================================
echo.

rem Platform selection
echo Selecteaza platforma pentru build:
echo.
echo 1. ANDROID (APK)
echo 2. iOS (IPA)
echo.
set /p platform_choice="Introdu optiunea (1 sau 2): "

echo.
echo ================================================

rem Environment selection
echo Selecteaza environment-ul:
echo.
echo 1. DEVELOPMENT ^(API: etsm3^)
echo 2. PRODUCTION  ^(API: etsm_prod^)
echo.
set /p env_choice="Introdu optiunea (1 sau 2): "

if "!env_choice!"=="1" (
    set ENV=dev
    set ENV_NAME=DEVELOPMENT
    set API_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
) else if "!env_choice!"=="2" (
    set ENV=prod
    set ENV_NAME=PRODUCTION
    set API_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
) else (
    echo.
    echo Optiune invalida. Folosesc PRODUCTION ca default.
    set ENV=prod
    set ENV_NAME=PRODUCTION
    set API_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    timeout /t 2 >nul
)

echo.
echo ================================================
echo Environment: !ENV_NAME!
echo API Endpoint: !API_URL!
echo ================================================
echo.

rem Set environment variables
set VITE_API_BASE_URL=!API_URL!
set NODE_ENV=!ENV!

rem Execute based on platform choice
if "!platform_choice!"=="1" (
    echo 🤖 Building pentru ANDROID...
    call :build_android
) else if "!platform_choice!"=="2" (
    echo 🍎 Building pentru iOS...
    call :build_ios
) else (
    echo.
    echo Optiune invalida. Folosesc ANDROID ca default.
    call :build_android
)

goto :end

:build_android
echo.
echo [ANDROID] [ETAPA 1/4] Instalare dependinte...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm install esuat
    pause
    exit /b 1
)
echo ✅ Done.

echo [ANDROID] [ETAPA 1.5/4] Configure Android environment...
if not exist android\app\src\main\assets mkdir android\app\src\main\assets
echo API_BASE_URL=!API_URL! > android\app\src\main\assets\environment.properties
echo ENVIRONMENT=!ENV_NAME! >> android\app\src\main\assets\environment.properties
echo ✅ Android Environment configured.

echo [ANDROID] [ETAPA 2/4] Build aplicatie pentru %ENV%...
call npx vite build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ vite build esuat
    pause
    exit /b 1
)
echo ✅ Done.

echo [ANDROID] [ETAPA 3/4] Sincronizare cu Android...
call npx cap sync android >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ capacitor sync android esuat
    pause
    exit /b 1
)
echo ✅ Done.

echo [ANDROID] [ETAPA 4/4] Lansare Android Studio...
call npx cap open android >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ deschiderea Android Studio esuata
    pause
    exit /b 1
)
echo ✅ Done.

echo.
echo 🤖 ================================================
echo        ANDROID BUILD FINALIZAT CU SUCCES!
echo ================================================
echo Environment: !ENV_NAME!
echo Proiectul Android este gata in Android Studio.
echo.
goto :end

:build_ios
echo.
echo [iOS] [ETAPA 1/4] Instalare dependinte...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm install esuat
    pause
    exit /b 1
)
echo ✅ Done.

echo [iOS] [ETAPA 1.5/4] Configure iOS environment...
echo ^<?xml version="1.0" encoding="UTF-8"?^> > ios\App\App\environment.plist
echo ^<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"^> >> ios\App\App\environment.plist
echo ^<plist version="1.0"^> >> ios\App\App\environment.plist
echo ^<dict^> >> ios\App\App\environment.plist
echo     ^<key^>API_BASE_URL^</key^> >> ios\App\App\environment.plist
echo     ^<string^>!API_URL!^</string^> >> ios\App\App\environment.plist
echo     ^<key^>ENVIRONMENT^</key^> >> ios\App\App\environment.plist
echo     ^<string^>!ENV_NAME!^</string^> >> ios\App\App\environment.plist
echo ^</dict^> >> ios\App\App\environment.plist
echo ^</plist^> >> ios\App\App\environment.plist
echo ✅ iOS Environment configured.

echo [iOS] [ETAPA 2/4] Build aplicatie pentru %ENV%...
call npx vite build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ vite build esuat
    pause
    exit /b 1
)
echo ✅ Done.

echo [iOS] [ETAPA 3/4] Sincronizare cu iOS...
call npx cap sync ios >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ capacitor sync ios esuat
    pause
    exit /b 1
)
echo ✅ Done.

echo [iOS] [ETAPA 4/4] Lansare Xcode...
call npx cap open ios >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ deschiderea Xcode esuata ^(macOS only^)
    echo iOS project ready in ios/ folder
)
echo ✅ Done.

echo.
echo 🍎 ================================================
echo          iOS BUILD FINALIZAT CU SUCCES!
echo ================================================
echo Environment: !ENV_NAME!
echo Proiectul iOS este gata in ios/ folder.
echo.
goto :end


:end
echo ================================================
echo.
echo Continui cu alte operatiuni?
echo.
echo 1. Restart build cu alte optiuni
echo 2. Deschide director proiect
echo 3. Iesire
echo.
set /p choice="Alege optiunea (1, 2 sau 3): "

if "!choice!"=="1" (
    echo.
    echo Restarting master build tool...
    timeout /t 1 >nul
    "%~f0"
) else if "!choice!"=="2" (
    echo.
    echo Deschid directorul proiectului...
    start .
) else (
    echo.
    echo Master build tool terminat.
    timeout /t 2 >nul
)