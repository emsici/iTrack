# 🕒 Start Secvențial UIT-uri - Exemplu Real

## SCENARIUL: Start UIT 35 în momente diferite

### EXEMPLU PRACTIC:

**10:05:20** → Start UIT 35 (primul)
```
Android service: Start GPS pentru UIT 35
Primul ciclu GPS la: 10:05:20.123
Transmisie: UIT 35 → timestamp: 2025-08-14T10:05:20.123Z
```

**10:05:23** → Start UIT 36 (al doilea) 
```
Android service: Adaugă UIT 36 la lista activă
Următorul ciclu GPS la: 10:05:25.123 (următorul interval de 5 sec)
Transmisie: UIT 35 → timestamp: 2025-08-14T10:05:25.123Z
         UIT 36 → timestamp: 2025-08-14T10:05:25.123Z (același!)
```

**10:05:27** → Start UIT 37 (al treilea)
```
Android service: Adaugă UIT 37 la lista activă  
Următorul ciclu GPS la: 10:05:30.123
Transmisie: UIT 35 → timestamp: 2025-08-14T10:05:30.123Z
         UIT 36 → timestamp: 2025-08-14T10:05:30.123Z (același!)
         UIT 37 → timestamp: 2025-08-14T10:05:30.123Z (același!)
```

## LOGICA TIMESTAMP-URILOR:

### PRIMUL START (UIT 35):
- Se creează primul ciclu GPS
- UIT 35 primește primul timestamp la momentul start-ului

### URMĂTOARELE START-uri (UIT 36, 37):
- Se adaugă la lista activă
- **NU se creează ciclu nou imediat**
- Așteaptă următorul interval de 5 secunde
- **Toate UIT-urile active primesc același timestamp din următorul ciclu**

## REZULTAT:
- Fiecare UIT poate avea **primul timestamp diferit** (când a fost pornit)
- Din momentul când sunt **toate active**, primesc **același timestamp** la fiecare ciclu
- **Ordinea de transmisie**: întotdeauna sortată alfabetic (35 → 36 → 37)

## CONCLUZIE:
**Start-ul în secunde diferite afectează doar primul timestamp al fiecărui UIT. Din momentul când sunt toate active, sincronizarea este perfectă.**