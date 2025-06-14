# Instrucțiuni de Compilare APK Android

## Pași pentru generarea APK-ului:

### 1. Instalează dependențele
```bash
npm install
```

### 2. Construiește aplicația web
```bash
npx vite build
```

### 3. Sincronizează cu proiectul Android
```bash
npx cap sync android
```

### 4. Deschide proiectul în Android Studio
```bash
npx cap open android
```

### 5. Generează APK în Android Studio
- Meniu: Build → Generate Signed Bundle / APK
- Selectează APK
- Urmează pașii pentru semnarea aplicației

### Alternativ - Compilare din linia de comandă:
```bash
cd android
./gradlew assembleDebug
```

APK-ul final va fi generat în: `android/app/build/outputs/apk/debug/`

## Notă Importantă
- Pe web, autentificarea nu funcționează din cauza restricțiilor CORS
- Pe Android, API-ul va funcționa normal cu autentificare reală
- Aplicația include GPS tracking în fundal cu permisiuni Android complete