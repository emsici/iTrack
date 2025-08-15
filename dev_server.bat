@echo off
echo ================================
echo    iTrack - DEVELOPMENT SERVER
echo ================================
echo.
echo Pornesc serverul de dezvoltare...
echo.

REM Start development server
echo Server web va fi disponibil la: http://localhost:5000
echo.
call npm run dev

echo.
echo Server-ul de dezvoltare s-a oprit.
pause