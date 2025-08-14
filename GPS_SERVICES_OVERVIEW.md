# 📡 iTrack GPS Services Overview

## TOTAL: 4 Servicii GPS Active

### 1. **garanteedGPS.ts** - SERVICIUL PRINCIPAL
**ROL**: GPS principal cu redundanță garantată
**TRANSMISIE**: 
- Folosește `new Date().toISOString()` - ACELAȘI timestamp pentru toate cursele
- Timestamp IDENTIC pentru toate cursele dintr-un interval
- `sendGPSData()` din api.ts

**CARACTERISTICI**:
- ✅ Interval 5 secunde
- ✅ Backup pentru DirectAndroidGPS
- ✅ Salvare offline când failează
- ✅ Timestamp sincronizat FIX nou implementat

### 2. **directAndroidGPS.ts** - ANDROID NATIV
**ROL**: Direct cu serviciul Android nativ
**TRANSMISIE**: 
- Folosește `new Date().toISOString()` cu logging timestamp
- `sendGPSData()` din api.ts (același ca garanteedGPS)

**CARACTERISTICI**:
- ✅ GPS Android native service
- ✅ Update status prin WebView bridge
- ✅ Backup cu salvare offline
- ✅ Timestamp logging FIX nou implementat

### 3. **capacitorGPS.ts** - CAPACITOR PLUGIN
**ROL**: Wrapper pentru AndroidGPS Capacitor plugin
**TRANSMISIE**: 
- NU transmite direct GPS - delegă la plugin Android
- Plugin-ul folosește `sendGPSViaCapacitor()` din api.ts

**CARACTERISTICI**:
- ✅ Interface cu Capacitor AndroidGPS plugin
- ✅ Start/Stop/Update status
- ✅ Used ca fallback mechanism

### 4. **offlineGPS.ts** - SINCRONIZARE OFFLINE
**ROL**: Backup și sincronizare când nu e conexiune
**TRANSMISIE**: 
- Folosește timestamp-ul ORIGINAL din coordonata salvată
- `CapacitorHttp.post()` sau fetch fallback
- SORTARE cronologică FIX nou implementat

**CARACTERISTICI**:
- ✅ Salvare coordonate failed
- ✅ Sync batch cu retry logic
- ✅ Sortare cronologică înainte de transmisie
- ✅ Max 3 retry attempts

---

## TIMESTAMP FLOW ACUM (DUPĂ FIX):

```
1. garanteedGPS.ts: ACELAȘI timestamp pentru toate cursele din interval
2. directAndroidGPS.ts: new Date().toISOString() cu logging
3. capacitorGPS.ts: delegat la Android service
4. offlineGPS.ts: sortare cronologică înainte de sync
```

## TOATE SERVICIILE ACUM TRANSMIT CONSISTENT!
✅ Timestamp IDENTIC în garanteedGPS pentru toate cursele
✅ Logging timestamp în directAndroid  
✅ Sortare cronologică în offline sync
✅ Toate folosesc același API endpoint: `/gps.php`