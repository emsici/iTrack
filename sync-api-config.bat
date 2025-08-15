@echo off
REM 🎯 API Configuration Synchronization Script for Windows
REM This script ensures both TypeScript and Java use the same API environment
REM Usage: sync-api-config.bat PROD|TEST|DEV

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=PROD

echo 🚀 Synchronizing API configuration to: %ENVIRONMENT%

REM Update TypeScript configuration
echo 📝 Updating src/services/api.ts...
powershell -Command "(Get-Content 'src/services/api.ts') -replace 'export const API_BASE_URL = API_CONFIG\.[A-Z]*', 'export const API_BASE_URL = API_CONFIG.%ENVIRONMENT%' | Set-Content 'src/services/api.ts'"
powershell -Command "(Get-Content 'src/services/api.ts') -replace 'export const CURRENT_ENVIRONMENT = ''[A-Z]*''', 'export const CURRENT_ENVIRONMENT = ''%ENVIRONMENT%''' | Set-Content 'src/services/api.ts'"

REM Update Java configuration
echo 📝 Updating OptimalGPSService.java...
powershell -Command "(Get-Content 'android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java') -replace 'private static final String API_BASE_URL = API_BASE_URL_[A-Z]*', 'private static final String API_BASE_URL = API_BASE_URL_%ENVIRONMENT%' | Set-Content 'android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java'"

REM Update JSON config
echo 📝 Updating api-config.json...
powershell -Command "(Get-Content 'android/app/src/main/assets/api-config.json') -replace '\"environment\": \"[A-Z]*\"', '\"environment\": \"%ENVIRONMENT%\"' | Set-Content 'android/app/src/main/assets/api-config.json'"

echo ✅ API configuration synchronized to %ENVIRONMENT% environment!
echo 📋 Updated files:
echo   - src/services/api.ts
echo   - android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java
echo   - android/app/src/main/assets/api-config.json
echo.
echo 🔧 Usage examples:
echo   sync-api-config.bat PROD    (switches to production)
echo   sync-api-config.bat TEST    (switches to test)
echo   sync-api-config.bat DEV     (switches to development)
pause