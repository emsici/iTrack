#!/bin/bash

echo "=== SIMPLE APK BUILD SCRIPT ==="
echo "Building iTrack APK with GPS functionality"

# Sync Capacitor first
echo "1. Syncing Capacitor..."
npx cap sync android

# Navigate to Android directory
cd android

# Clean previous builds
echo "2. Cleaning previous builds..."
rm -rf app/build/outputs/apk/

# Build debug APK with minimal options
echo "3. Building debug APK..."
./gradlew app:assembleDebug --no-daemon --no-build-cache

# Check if APK was created
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📁 Location: android/app/build/outputs/apk/debug/app-debug.apk"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
else
    echo "❌ APK build failed"
    exit 1
fi

echo "=== BUILD COMPLETE ==="