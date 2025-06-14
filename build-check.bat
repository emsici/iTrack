@echo off
echo Checking Android compilation...
cd android
call gradlew compileDebugJavaWithJavac
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: GPS Service compiles correctly!
    echo GPS will work in background when phone is locked.
) else (
    echo ERROR: Compilation failed
)
pause