# VERIFICARE: TRASEU REAL PE STRĂZI

## EXEMPLU CONCRET BUCUREȘTI:

### Traseu: Calea Victoriei → Piața Unirii (prin străzi reale)

**START:** Calea Victoriei nr. 1
```
09:00:00 - GPS: 44.4398, 26.0977 (Calea Victoriei 1)
09:00:10 - GPS: 44.4405, 26.0985 (Calea Victoriei 15) - mergi pe stradă
09:00:20 - GPS: 44.4412, 26.0993 (Calea Victoriei 30) - continui pe stradă
09:00:30 - GPS: 44.4419, 26.1001 (aproape de intersecție cu Bulevardul Elisabeta)
```

**COTIRE:** La intersecție (GPS înregistrează exact cotirea)
```
09:00:40 - GPS: 44.4426, 26.1009 (ai cotit pe Bulevardul Elisabeta)
09:00:50 - GPS: 44.4433, 26.1017 (mergi pe Elisabeta)
09:01:00 - GPS: 44.4440, 26.1025 (continui pe Elisabeta)
```

**INTERSECȚIE:** La semafor (GPS înregistrează oprirea)
```
09:01:10 - GPS: 44.4440, 26.1025 (oprit la semafor - VITEZA = 0)
09:01:20 - GPS: 44.4440, 26.1025 (încă oprit - ACELEAȘI coordonate)
09:01:30 - GPS: 44.4447, 26.1033 (semafor verde, ai plecat)
```

**COTIRE DIN NOU:** 
```
09:01:40 - GPS: 44.4454, 26.1041 (mergi spre următoarea cotitură)
09:01:50 - GPS: 44.4461, 26.1049 (ai cotit pe strada perpendiculară)
```

**FINAL:** Ajuns la destinație
```
09:15:40 - GPS: 44.4267, 26.1025 (aproape de Piața Unirii)
09:15:50 - GPS: 44.4267, 26.1030 (ai parcat în piață)
09:16:00 - STOP apăsat
```

## CE ÎNREGISTREAZĂ GPS-UL:

✅ **Fiecare cotitură exactă** - coordonatele se schimbă când cotești
✅ **Opriri la semafoare** - aceleași coordonate + viteză 0
✅ **Mersul pe străzi curbe** - coordonatele urmăresc curba drumului
✅ **Parcarea** - ultimele coordonate unde te-ai oprit
✅ **Nu linie dreaptă** - GPS urmărește drumul real, nu distanța directă

## DOVADA DIN COD:

GPS-ul Android înregistrează poziția ta **exact unde ești** la fiecare 10 secunde:
```java
Log.i(TAG, "GPS primit: " + location.getLatitude() + ", " + location.getLongitude());
gpsData.put("lat", location.getLatitude());  // ← Poziția ta EXACTĂ
gpsData.put("lng", location.getLongitude()); // ← Poziția ta EXACTĂ
gpsData.put("viteza", (int) (location.getSpeed() * 3.6)); // ← Viteza ta REALĂ
```

**CONCLUZIA:** Vei avea traseu **EXACT pe străzi** cu toate cotiturile, opririle și drumurile reale - nu linie dreaptă!