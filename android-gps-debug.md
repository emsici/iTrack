# Android GPS Debug - Transmisie Garantată După Phone Lock

## Problema Identificată (15/08/2025)
- **Android GPS transmite o singură coordonată** după lock telefon 
- **PriorityGPS se bazează doar pe Android Native** care nu continuă în background
- **Lipsă backup garantat** când Android GPS eșuează

## Soluția Implementată

### 1. Priority GPS cu Backup Garantat
```typescript
// CRITICAL FIX: Android + GuaranteedGPS parallel
if (course.activeMethod === 'android') {
  logGPS(`🔒 PHONE LOCK PROTECTION: Starting GuaranteedGPS backup`);
  await guaranteedGPSService.startGuaranteedGPS(courseId, vehicleNumber, uit, token, status);
}
```

### 2. Guaranteed GPS - JavaScript Only
```typescript  
// CRITICAL FIX: Skip AndroidGPS în guaranteed service
// Evită duplicate transmissions
logGPS(`⚠️ GUARANTEED GPS: Skipping AndroidGPS - pure JavaScript backup`);
```

### 3. Phone Lock Detection
```typescript
const isPhoneLocked = document.hidden || document.visibilityState === 'hidden';
if (isPhoneLocked) {
  logGPS(`🔒 PHONE LOCKED - Guaranteed GPS taking over`);
}
```

## Fluxul Complet

### Start Course:
1. **PriorityGPS** încearcă Android Native GPS (prioritate 1)
2. **Dacă Android funcționează**: Start și GuaranteedGPS ca backup 
3. **Dacă Android eșuează**: Fallback la GuaranteedGPS direct
4. **GuaranteedGPS** = JavaScript/Capacitor interval la 5 secunde

### Phone Lock:
1. **Android GPS** se oprește sau transmite inconsistent
2. **GuaranteedGPS** continuă transmisia garantat (interval JavaScript)
3. **Capacitor Geolocation** funcționează în background/foreground  

### Stop Course:
1. **Stop PriorityGPS** (oprește Android GPS)
2. **Stop GuaranteedGPS** backup
3. **Cleanup complet** al ambelor servicii

## Testare 
1. Start cursă → Verifică ambele servicii active
2. Lock telefon → GuaranteedGPS continuă transmisia
3. Unlock telefon → Android GPS se reconectează  
4. Stop cursă → Ambele servicii se opresc

## Rezultat Așteptat
✅ **Transmisie continuă** chiar și după phone lock
✅ **Backup garantat** dacă Android GPS eșuează  
✅ **Fără duplicate** - prioritate clară pentru fiecare serviciu
✅ **Recovery automat** când Android GPS revine