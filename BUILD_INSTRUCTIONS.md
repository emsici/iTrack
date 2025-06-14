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

## Rezolvarea Erorilor Gradle

### Dacă primești eroare "Could not find method include() for arguments [:capacitor-android]":

1. Rulează din nou sincronizarea:
```bash
npx cap sync android
```

2. Dacă persistă, șterge cache-ul Gradle:
```bash
cd android
rm -rf .gradle build */build
./gradlew clean
```

3. Verifică că toate modulele Capacitor sunt instalate:
```bash
npm ls @capacitor/android @capacitor/core
```

## Notă Importantă
- Pe web, autentificarea nu funcționează din cauza restricțiilor CORS
- Pe Android, API-ul va funcționa normal cu autentificare reală
- Aplicația include GPS tracking în fundal cu permisiuni Android complete
- Toate fișierele de configurare Android sunt create și configurate automat