# Instrucțiuni pentru construirea aplicației mobile

Această aplicație a fost configurată pentru a putea fi rulată ca aplicație mobilă pe platformele Android și iOS folosind Capacitor.

## Pași pentru construirea aplicației mobile

### Pasul 1: Construiți aplicația web
```bash
npm run build
```

### Pasul 2: Sincronizați proiectul cu Capacitor
```bash
npx cap sync
```

### Pasul 3: Adăugați platforma Android
```bash
npx cap add android
```

### Pasul 4: Deschideți proiectul în Android Studio
```bash
npx cap open android
```

### Pasul 5: Construiți și rulați aplicația pe un dispozitiv sau emulator
Din Android Studio:
1. Selectați un dispozitiv sau emulator din lista de dispozitive
2. Apăsați butonul "Run" (triunghiul verde)

## Modificări aduse pentru compatibilitate mobilă

Am implementat următoarele modificări pentru a asigura funcționarea corectă a aplicației pe dispozitive mobile:

1. **Integrare Capacitor**: Am adăugat Capacitor pentru a putea converti aplicația web într-o aplicație nativă.
2. **Acces la Geolocation**: Am implementat un serviciu compatibil cross-platform pentru accesul la GPS.
3. **Background tracking**: Aplicația poate continua să trimită coordonate GPS chiar și când rulează în fundal.
4. **UI Adaptat**: Interfața a fost optimizată pentru experiența mobilă.

## Permisiuni necesare

Pe Android, aplicația va cere următoarele permisiuni:
- Acces la locație precisă
- Acces la locație în fundal
- Acces la rețea

## Notă pentru iOS

Pentru a construi aplicația pentru iOS, urmați pași similari, doar că la pasul 3 și 4, înlocuiți "android" cu "ios":

```bash
npx cap add ios
npx cap open ios
```

Veți avea nevoie de un Mac cu Xcode instalat pentru a construi versiunea iOS.

## Troubleshooting

Dacă întâmpinați probleme:

1. Asigurați-vă că aveți Java JDK și Android SDK instalate
2. Verificați că toate dependențele sunt instalate: `npm install`
3. Curățați cache-ul: `npx cap clean`
4. Reîncercați sincronizarea: `npx cap sync`