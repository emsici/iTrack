@echo off
echo ================================
echo      iTrack - Development Server
echo ================================
echo.
echo Starting DEVELOPMENT environment...
echo API: www.euscagency.com/etsm3/
echo.

REM Set development environment variables
set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
set NODE_ENV=development

REM Start development server
echo Starting Vite development server on port 5000...
npm run dev

if errorlevel 1 (
    echo EROARE: Development server failed to start!
    pause
    exit /b 1
)

pause