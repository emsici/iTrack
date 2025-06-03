# iTrack - Setup pentru Android Studio

## Implementare GPS Nativă Completă

### Fișiere Implementate:

1. **GpsBackgroundService.java** - Serviciu Foreground pentru GPS background
2. **GpsTrackingPlugin.java** - Plugin Capacitor pentru control
3. **MainActivity.java** - Activity principal cu plugin înregistrat
4. **AndroidManifest.xml** - Permisiuni și servicii configurate
5. **build.gradle** - Dependințe OkHttp pentru transmisie

### Funcționalități GPS Native:

- **Foreground Service** cu notificare permanentă
- **Timer Java** pentru transmisie exactă la 60 secunde
- **Wake Lock** pentru menținerea activă a dispozitivului
- **LocationManager** Android nativ pentru GPS precis
- **Transmisie HTTP** directă către API GPS
- **Baterie reală** citită din dispozitiv Android

### Pentru Android Studio:

1. Deschide folderul `android/` în Android Studio
2. Sync project cu Gradle
3. Build APK cu Build → Build Bundle(s) / APK(s) → Build APK(s)

### Serviciul GPS va:

- Rula independent de aplicația JavaScript
- Transmite coordonate la 60 secunde chiar cu telefonul blocat
- Afișa notificare permanentă "iTrack GPS Activ"
- Menține wake lock pentru funcționare continuă
- Citi GPS real cu viteză și direcție precise
- Transmite către https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php

### Control din aplicație:

```typescript
// Pornește serviciul GPS nativ
await startNativeAndroidGpsService(vehicleNumber, uit, token);

// Oprește serviciul GPS nativ  
await stopNativeAndroidGpsService();
```

APK-ul final va avea serviciul GPS background complet funcțional pentru transmisia coordonatelor continue.