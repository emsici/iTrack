#!/bin/bash
echo "Building iTrack with GPS Plugin..."
npx vite build
npx cap sync android
cd android
echo "Compiling Android APK with GPS plugin..."
./gradlew clean assembleDebug --quiet
echo "Build complete! APK location:"
find . -name "*.apk" -type f