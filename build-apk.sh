#!/bin/bash
echo "Building iTrack APK with background GPS service..."
echo "This will take 5-10 minutes..."

cd android

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean --quiet

# Build APK with GPS service
echo "Building APK with GPS tracking service..."
./gradlew assembleDebug --quiet

# Find and show APK location
echo "Build complete! APK location:"
find . -name "*.apk" -type f 2>/dev/null | head -1

echo ""
echo "Install this APK on Android device for background GPS tracking."
echo "The native service will work when phone is locked."