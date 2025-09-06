@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ================================================
echo            iTrack GPS - Build Tool
echo ================================================
echo.

rem Interactive selections if no parameters provided
if "%1"=="" (
    echo Selecteaza platforma pentru build:
    echo.
    echo 1. ANDROID
    echo 2. iOS
    echo 3. AMBELE ^(Android + iOS^)
    echo.
    set /p platform_choice="Introdu optiunea (1, 2 sau 3): "
    
    if "!platform_choice!"=="1" (
        set PLATFORM=android
    ) else if "!platform_choice!"=="2" (
        set PLATFORM=ios
    ) else if "!platform_choice!"=="3" (
        set PLATFORM=both
    ) else (
        echo.
        echo Optiune invalida. Folosesc ANDROID ca default.
        set PLATFORM=android
        timeout /t 2 >nul
    )
    
    echo.
    echo Selecteaza environment-ul pentru build:
    echo.
    echo 1. DEVELOPMENT ^(API: etsm3^)
    echo 2. PRODUCTION  ^(API: etsm_prod^)
    echo.
    set /p choice="Introdu optiunea (1 sau 2): "
    
    if "!choice!"=="1" (
        set ENV=dev
    ) else if "!choice!"=="2" (
        set ENV=prod
    ) else (
        echo.
        echo Optiune invalida. Folosesc PRODUCTION ca default.
        set ENV=prod
        timeout /t 2 >nul
    )
) else (
    set ENV=%1
    if "%2"=="" (
        set PLATFORM=android
    ) else (
        set PLATFORM=%2
    )
)

echo.
echo ================================================

if /i "%ENV%"=="dev" (
    echo Environment: DEVELOPMENT
    echo API Endpoint: www.euscagency.com/etsm3/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    set NODE_ENV=development
) else if /i "%ENV%"=="prod" (
    echo Environment: PRODUCTION
    echo API Endpoint: www.euscagency.com/etsm_prod/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    set NODE_ENV=production
) else (
    echo.
    echo EROARE: Environment invalid '%ENV%'
    echo Foloseste: dev sau prod
    echo.
    pause
    exit /b 1
)

echo Platforma: %PLATFORM%
echo ================================================

echo.
echo Pornesc procesul de build...
echo.

echo [ETAPA 1/4] Instalare dependinte Node.js...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: npm install esuat
    echo Verificati conexiunea internet si package.json
    echo.
    pause
    exit /b 1
)
echo Done.

echo [ETAPA 2/4] Build aplicatie pentru %ENV%...
call npx vite build >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo EROARE: vite build esuat
    echo Verificati codul TypeScript si dependintele
    echo.
    pause
    exit /b 1
)
echo Done.

rem Configurare PATH pentru CocoaPods (iOS)
set PATH=%PATH%;%USERPROFILE%\.local\share\gem\ruby\3.1.0\bin

if /i "%PLATFORM%"=="android" (
    echo [ETAPA 3] Sincronizare cu Android...
    call npx cap sync android >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: capacitor sync android esuat
        echo Verificati configuratia Capacitor
        echo.
        pause
        exit /b 1
    )
    echo Done.
) else if /i "%PLATFORM%"=="ios" (
    echo [ETAPA 3a] Configurare dependinte iOS ^(CocoaPods^)...
    cd ios\App
    call pod install >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: pod install esuat
        echo Verificati CocoaPods si Podfile
        cd ..\..
        echo.
        pause
        exit /b 1
    )
    cd ..\..
    echo Done.
    
    echo [ETAPA 3b] Sincronizare cu iOS...
    call npx cap sync ios >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: capacitor sync ios esuat
        echo Verificati configuratia Capacitor iOS
        echo.
        pause
        exit /b 1
    )
    echo Done.
) else if /i "%PLATFORM%"=="both" (
    echo [ETAPA 3a] Sincronizare cu Android...
    call npx cap sync android >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: capacitor sync android esuat
        echo Verificati configuratia Capacitor
        echo.
        pause
        exit /b 1
    )
    echo Done.
    
    echo [ETAPA 3b] Configurare dependinte iOS ^(CocoaPods^)...
    cd ios\App
    call pod install >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: pod install esuat
        echo Verificati CocoaPods si Podfile
        cd ..\..
        echo.
        pause
        exit /b 1
    )
    cd ..\..
    echo Done.
    
    echo [ETAPA 3c] Sincronizare cu iOS...
    call npx cap sync ios >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: capacitor sync ios esuat
        echo Verificati configuratia Capacitor iOS
        echo.
        pause
        exit /b 1
    )
    echo Done.
)

if /i "%PLATFORM%"=="android" (
    echo [ETAPA 4] Lansare Android Studio...
    call npx cap open android >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: deschiderea Android Studio esuata
        echo Instalati Android Studio si configurati PATH
        echo.
        pause
        exit /b 1
    )
    echo Done.
) else if /i "%PLATFORM%"=="ios" (
    echo [ETAPA 4] Lansare Xcode...
    call npx cap open ios >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo EROARE: deschiderea Xcode esuata
        echo Instalati Xcode pe macOS
        echo.
        pause
        exit /b 1
    )
    echo Done.
) else if /i "%PLATFORM%"=="both" (
    echo [ETAPA 4] Lansare IDE-uri...
    echo Lansez Android Studio...
    start /b npx cap open android >nul 2>&1
    echo Lansez Xcode...
    start /b npx cap open ios >nul 2>&1
    echo Done.
)

echo.
echo ================================================
echo              BUILD FINALIZAT CU SUCCES!
echo ================================================
echo.
echo Toate etapele au fost finalizate cu succes.
if /i "%PLATFORM%"=="android" (
    echo Proiectul Android este gata in Android Studio.
) else if /i "%PLATFORM%"=="ios" (
    echo Proiectul iOS este gata in Xcode.
) else (
    echo Proiectele Android si iOS sunt gata.
)
echo Environment: %ENV%
echo Platforma: %PLATFORM%
echo.
echo INSTRUCTIUNI URMATOARE:
if /i "%PLATFORM%"=="android" (
    echo ANDROID:
    echo 1. Android Studio este deschis
    echo 2. Selectati device/emulator Android
    echo 3. Apasati 'Run' pentru testare
    echo 4. Pentru APK: Build -^> Generate Signed Bundle/APK
    echo.
) else if /i "%PLATFORM%"=="ios" (
    echo iOS:
    echo 1. Xcode este deschis ^(necesita macOS^)
    echo 2. Selectati device/simulator iOS
    echo 3. Apasati 'Run' pentru testare
    echo 4. Pentru IPA: Product -^> Archive
    echo.
) else (
    echo ANDROID:
    echo 1. Android Studio este deschis
    echo 2. Selectati device/emulator Android
    echo 3. Apasati 'Run' pentru testare
    echo 4. Pentru APK: Build -^> Generate Signed Bundle/APK
    echo.
    echo iOS:
    echo 1. Xcode este deschis ^(necesita macOS^)
    echo 2. Selectati device/simulator iOS
    echo 3. Apasati 'Run' pentru testare
    echo 4. Pentru IPA: Product -^> Archive
    echo.
)
echo ================================================
echo.

echo Continui cu alte operatiuni?
echo.
echo 1. Restart build cu alt environment
echo 2. Deschide director proiect
echo 3. Iesire
echo.
set /p choice="Alege optiunea (1, 2 sau 3): "

if "!choice!"=="1" (
    echo.
    echo Restarting build tool...
    timeout /t 1 >nul
    "%~f0"
) else if "!choice!"=="2" (
    echo.
    echo Deschid directorul proiectului...
    start .
) else (
    echo.
    echo Build tool terminat.
    timeout /t 2 >nul
)