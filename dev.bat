@echo off
echo ================================
echo      iTrack - Quick Dev Mode
echo ================================
echo.
echo Starting DEVELOPMENT server...
echo API: etsm3
echo.

REM Set development environment
set VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
set NODE_ENV=development

REM Start development server without build
npx vite --host 0.0.0.0 --port 5000

pause