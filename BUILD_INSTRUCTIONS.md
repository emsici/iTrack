# iTrack - Instrucțiuni Build APK cu GPS Nativ

## Serviciu GPS Nativ Android Implementat

### Funcționalități:
- **Foreground Service** real Android pentru GPS background
- **Transmisie la 60 secunde** chiar și cu telefonul blocat
- **Wake Lock** pentru menținerea activă a dispozitivului
- **Notificare permanentă** pentru serviciul activ
- **Baterie reală** citită din dispozitiv Android
- **GPS precis** cu viteză și direcție reale
- **Transmisie directă** către API fără proxy

### Build APK:

```bash
# 1. Construiește aplicația web
npm run build

# 2. Sincronizează cu Android
npx cap sync android

# 3. Construiește APK-ul
cd android && ./gradlew assembleDebug
```

### Locația APK-ului final:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Implementare Tehnică

### Fișiere Cheie:
- `android/app/src/main/java/com/itrack/gps/GpsBackgroundService.java` - Serviciu GPS nativ
- `android/app/src/main/java/com/itrack/gps/GpsTrackingPlugin.java` - Plugin Capacitor
- `client/src/lib/nativeGpsPlugin.ts` - Control TypeScript
- `android/app/src/main/AndroidManifest.xml` - Permisiuni și servicii

### Funcționare:
1. Aplicația pornește serviciul GPS nativ prin plugin
2. Serviciul Android rulează independent cu Foreground Service
3. Timer nativ Java transmite GPS la 60 secunde
4. Wake Lock menține dispozitivul activ
5. Notificare persistentă afișează starea

### Avantaje față de JavaScript:
- **Nu se oprește** cu telefonul blocat
- **Nu depinde** de lifecycle-ul aplicației
- **Transmisie garantată** prin timer nativ Java
- **Eficiență energetică** optimizată pentru Android
- **Conformitate** cu sistemul de operare Android

APK-ul final va avea serviciul GPS background complet funcțional pentru transmisia coordonatelor continue.