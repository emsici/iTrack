@echo off
REM 🎯 Script pentru Sincronizarea Configurarii API iTrack
REM Acest script asigura ca TypeScript si Java folosesc acelasi mediu API
REM Utilizare: sync-api-config.bat PROD|TEST|DEV

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=PROD

echo 🚀 Sincronizez configuratia API la mediul: %ENVIRONMENT%

REM Actualizez configuratia TypeScript
echo 📝 Actualizez fisierul src/services/api.ts...
powershell -Command "(Get-Content 'src/services/api.ts') -replace 'export const API_BASE_URL = API_CONFIG\.[A-Z]*', 'export const API_BASE_URL = API_CONFIG.%ENVIRONMENT%' | Set-Content 'src/services/api.ts'"
powershell -Command "(Get-Content 'src/services/api.ts') -replace 'export const CURRENT_ENVIRONMENT = ''[A-Z]*''', 'export const CURRENT_ENVIRONMENT = ''%ENVIRONMENT%''' | Set-Content 'src/services/api.ts'"

REM Actualizez configuratia Java
echo 📝 Actualizez fisierul OptimalGPSService.java...
powershell -Command "(Get-Content 'android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java') -replace 'private static final String API_BASE_URL = API_BASE_URL_[A-Z]*', 'private static final String API_BASE_URL = API_BASE_URL_%ENVIRONMENT%' | Set-Content 'android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java'"

REM Actualizez configuratia JSON
echo 📝 Actualizez fisierul api-config.json...
powershell -Command "(Get-Content 'android/app/src/main/assets/api-config.json') -replace '\"environment\": \"[A-Z]*\"', '\"environment\": \"%ENVIRONMENT%\"' | Set-Content 'android/app/src/main/assets/api-config.json'"

echo ✅ Configuratia API a fost sincronizata cu succes pe mediul %ENVIRONMENT%!
echo 📋 Fisiere actualizate:
echo   - src/services/api.ts
echo   - android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java
echo   - android/app/src/main/assets/api-config.json
echo.
echo 🔧 Exemple de utilizare:
echo   sync-api-config.bat PROD    (trece la productie)
echo   sync-api-config.bat TEST    (trece la mediul de test)
echo   sync-api-config.bat DEV     (trece la mediul de dezvoltare)
echo.
echo Apasa orice tasta pentru a continua...
pause