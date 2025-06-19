#!/bin/bash

echo "🚀 Building iTrack APK with GPS native functionality..."

# Build web assets
echo "📦 Building web application..."
npm run build

# Sync Capacitor
echo "🔄 Syncing Capacitor Android project..."
npx cap sync android

# Build APK
echo "🔨 Building Android APK..."
cd android
./gradlew assembleDebug --no-daemon --parallel

# Check if APK was created
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📱 Location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "📊 File size: $(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)"
    echo ""
    echo "📋 GPS Features included:"
    echo "   ✓ Native Android GPS service (EnhancedGPSService)"
    echo "   ✓ Background location tracking"
    echo "   ✓ GPS coordinate transmission every 60 seconds"
    echo "   ✓ Location permissions handling"
    echo "   ✓ Battery optimization exemption requests"
    echo "   ✓ Wake locks for reliable background operation"
    echo ""
    echo "🔧 To install on device: adb install app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ APK build failed!"
    exit 1
fi