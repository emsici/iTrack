@echo off
if "%1"=="" (
    echo ================================
    echo      iTrack - Start Server
    echo ================================
    echo.
    echo Foloseste: start.bat [dev/prod]
    echo   start.bat dev  - Development (etsm3)
    echo   start.bat prod - Production (etsm_prod)
    echo.
    pause
    exit /b 1
)

set ENV=%1
echo ================================
echo      iTrack - Start %ENV%
echo ================================
echo.

if /i "%ENV%"=="dev" (
    echo Starting DEVELOPMENT environment...
    echo API: www.euscagency.com/etsm3/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    set NODE_ENV=development
) else if /i "%ENV%"=="prod" (
    echo Starting PRODUCTION environment...
    echo API: www.euscagency.com/etsm_prod/
    set VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    set NODE_ENV=production
) else (
    echo EROARE: Environment invalid '%ENV%'
    echo Foloseste: dev sau prod
    pause
    exit /b 1
)

echo.
echo Starting Vite development server on port 5000...
npm run dev

if errorlevel 1 (
    echo EROARE: Server failed to start!
    pause
    exit /b 1
)

pause