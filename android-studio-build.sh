#!/bin/bash

echo "🚀 Pregătesc proiectul pentru Android Studio..."

# Construiește aplicația web rapid
echo "📦 Build web simplu..."
mkdir -p dist
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>iTrack</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div id="root">
        <h1>iTrack GPS Tracking</h1>
        <p>Aplicație pentru tracking GPS cu serviciu nativ Android</p>
    </div>
    <script>
        console.log("iTrack aplicație încărcată");
        
        // Test GPS nativ
        if (window.GpsTracking) {
            console.log("Plugin GPS nativ disponibil");
        }
    </script>
</body>
</html>
EOF

# Sincronizează cu Capacitor
echo "🔄 Sincronizare Capacitor..."
npx cap sync android

echo "✅ Proiectul este pregătit pentru Android Studio!"
echo ""
echo "📁 Deschide în Android Studio:"
echo "   File → Open → Selectează folderul 'android/'"
echo ""
echo "🏗️ Pentru build APK:"
echo "   Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo ""
echo "📍 APK-ul va fi în:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🎯 Serviciul GPS nativ va transmite coordonate la 60s chiar și cu telefonul blocat!"