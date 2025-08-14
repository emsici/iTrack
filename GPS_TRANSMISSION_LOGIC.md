# 📡 Logica de Transmisie GPS - iTrack

## SCENARIUL: 3 UIT-uri Active (35, 36, 37)

### REALITATEA: NU se transmit prin toate 4 sistemele!

## SISTEM PRINCIPAL ACTIV:

### **Android OptimalGPSService.java** (PRINCIPAL)
```
Interval: La 5 secunde
Citește: GPS coordinates REAL
Timestamp: gpsSharedTimestamp (același pentru toate)
Transmite pentru: UIT 35, 36, 37 (în ordine sortată)
Rezultat: 3 transmisii cu același timestamp
```

## SISTEME BACKUP (Activează doar în anumite condiții):

### **garanteedGPS.ts** (BACKUP JavaScript)
```
SE ACTIVEAZĂ DOAR DACĂ:
- Android service nu funcționează
- Browser nu poate accesa Android GPS
- Fallback pentru siguranță

Dacă se activează:
- Citește GPS coordinates
- sharedTimestamp (același pentru toate)
- Transmite pentru: UIT 35, 36, 37
```

### **directAndroidGPS.ts** (STATUS CHANGES)
```
SE ACTIVEAZĂ DOAR PENTRU:
- Schimbări de status (Start/Pause/Stop)
- NU pentru transmisie regulată GPS
- Timestamp: momentul schimbării status

Nu transmite coordonate la interval!
```

### **offlineGPS.ts** (SYNC OFFLINE)
```
SE ACTIVEAZĂ DOAR CÂND:
- Coordonatele failed să se transmită
- Nu există conexiune internet
- Sync-uiește coordonatele salvate

Timestamp: original din momentul salvării
```

## EXEMPLU PRACTIC:

**Situație normală (Android APK):**
```
10:05:23 → Android service citește GPS
         → Transmite pentru UIT 35, 36, 37
         → Timestamp: 2025-08-14T10:05:23.123Z (pentru toate)
         → Celelalte sisteme: INACTIVE
```

**Situație problemă (Browser):**
```
10:05:23 → Android service: FAILED
         → garanteedGPS.ts: SE ACTIVEAZĂ
         → Citește GPS, transmite pentru UIT 35, 36, 37
         → Timestamp: 2025-08-14T10:05:23.456Z (pentru toate)
```

## CONCLUZIE:
- **1 sistem principal activ** la un moment dat
- **3 sisteme backup** pentru redundanță
- **1 timestamp per ciclu** pentru toate UIT-urile
- **Ordine consistentă**: 35 → 36 → 37