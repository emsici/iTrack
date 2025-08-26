@echo off
setlocal enabledelayedexpansion

rem Set default environment
set ENV=prod

if not "%1"=="" (
    set ENV=%1
)

rem Setează culoarea: fundal negru, text alb
color 0F

cls
echo.
echo.
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo                 ███████████ ITRACK GPS ROMANIA ████████████
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo.
echo                 ████████ STEAGUL ROMANIEI ████████
echo                 ██████                            ██████
echo                 ████   ■■■■■■  ■■■■■■  ■■■■■■   ████
echo                 ██     ■ BLU ■ ■GALB■ ■ROSU■     ██
echo                 ████   ■■■■■■  ■■■■■■  ■■■■■■   ████
echo                 ██████                            ██████
echo                 ████████████████████████████████████████
echo.
echo                 ═══════════════════════════════════════════
echo                    🇷🇴 SISTEM BUILD PROFESIONAL 🇷🇴
echo                 ═══════════════════════════════════════════
echo.
echo                 ░░░░ Environment-uri disponibile: ░░░░
echo                 ▶ PRODUCTION (etsm_prod) - [DEFAULT]
echo                 ▶ DEVELOPMENT (etsm3) - build.bat dev
echo.

if /i "%ENV%"=="dev" (
    color 0E
    echo                 ╔═══════════════════════════════════════╗
    echo                 ║     🔧 DEVELOPMENT ENVIRONMENT      ║
    echo                 ║      API: www.euscagency.com/etsm3/   ║
    echo                 ╚═══════════════════════════════════════╝
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    set NODE_ENV=development
) else if /i "%ENV%"=="prod" (
    color 0A
    echo                 ╔═══════════════════════════════════════╗
    echo                 ║      🚀 PRODUCTION ENVIRONMENT      ║
    echo                 ║   API: www.euscagency.com/etsm_prod/  ║
    echo                 ╚═══════════════════════════════════════╝
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    set NODE_ENV=production
) else (
    color 0C
    echo                 ╔═══════════════════════════════════════╗
    echo                 ║           ❌ EROARE FATALA ❌         ║
    echo                 ║      Environment invalid '%ENV%'       ║
    echo                 ║        Foloseste: dev sau prod        ║
    echo                 ╚═══════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

echo.
echo                 ┌─────────────────────────────────────────┐
echo                 │          🔄 PROCES DE BUILD            │
echo                 └─────────────────────────────────────────┘
echo.

echo ░░░ [ETAPA 1/4] Instalare dependințe Node.js...
echo ╠══ Verificând package.json și npm...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ╠══ ❌ EROARE: npm install eșuat
    echo ╚══ Verificați conexiunea internet și package.json
    echo.
    pause
    exit /b 1
)
echo ╠══ ✅ Dependințe instalate cu succes
echo.

echo ░░░ [ETAPA 2/4] Build aplicație pentru %ENV%...
echo ╠══ Compilând cu Vite bundler...
call npx vite build >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ╠══ ❌ EROARE: vite build eșuat
    echo ╚══ Verificați codul TypeScript și dependințele
    echo.
    pause
    exit /b 1
)
echo ╠══ ✅ Aplicație compilată pentru environment %ENV%
echo.

echo ░░░ [ETAPA 3/4] Sincronizare cu Android...
echo ╠══ Copiind assets în proiectul Android...
call npx cap sync android >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ╠══ ❌ EROARE: capacitor sync eșuat
    echo ╚══ Verificați configurația Capacitor
    echo.
    pause
    exit /b 1
)
echo ╠══ ✅ Proiect Android sincronizat
echo.

echo ░░░ [ETAPA 4/4] Lansare Android Studio...
echo ╠══ Deschizând IDE-ul pentru development...
call npx cap open android >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ╠══ ❌ EROARE: deschiderea Android Studio eșuată
    echo ╚══ Instalați Android Studio și configurați PATH
    echo.
    pause
    exit /b 1
)
echo ╠══ ✅ Android Studio lansat cu succes
echo.

rem Culoare verde pentru succes
color 0A
cls
echo.
echo.
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo                 ███████████ BUILD FINALIZAT! ███████████████
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo                 ████████████████████████████████████████████
echo.
echo                 ██████ STEAGUL ROMANIEI - SUCCES ██████
echo                 ████                                ████
echo                 ██   🟦🟦🟦  🟨🟨🟨  🟥🟥🟥   ██
echo                 ██   🟦🟦🟦  🟨🟨🟨  🟥🟥🟥   ██
echo                 ██   🟦🟦🟦  🟨🟨🟨  🟥🟥🟥   ██
echo                 ████                                ████
echo                 ████████████████████████████████████████
echo.
echo                 ╔═══════════════════════════════════════════╗
echo                 ║        🇷🇴 BUILD %ENV% REUȘIT! 🇷🇴        ║
echo                 ║                                           ║
echo                 ║  ✅ Toate etapele finalizate cu succes   ║
echo                 ║  📱 Proiect gata în Android Studio       ║
echo                 ║  🌐 Environment: %ENV%                    ║
echo                 ║  🚀 Gata pentru deployment!              ║
echo                 ╚═══════════════════════════════════════════╝
echo.
echo                 ████ INSTRUCTIUNI URMATOARE ████
echo                 ▶ Android Studio este deschis
echo                 ▶ Selectați device/emulator
echo                 ▶ Apăsați 'Run' pentru testare
echo                 ▶ Pentru APK: Build → Generate Signed Bundle/APK
echo.
echo                 ┌─────────────────────────────────────────┐
echo                 │    🔧 iTrack GPS Romania - Build Tool   │
echo                 │       Dezvoltat pentru excelență       │
echo                 └─────────────────────────────────────────┘
echo.

rem Resetează culoarea
color