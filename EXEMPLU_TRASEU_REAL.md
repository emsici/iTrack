# EXEMPLU TRASEU REAL - PUNCTUL A LA PUNCTUL B

## SCENARIUL TĂU:
**Punctul A:** Plecare (ex: Calea Victoriei 1, București)
**Punctul B:** Destinație (ex: Piața Unirii, București)
**Acțiuni:** START la punctul A → conduci → STOP la punctul B

## CE SE ÎNTÂMPLĂ:

### La punctul A (START):
```
Ora 09:00:00 - Apasă START
GPS primit: 44.4398, 26.0977 (Calea Victoriei)
Status: ACTIVE (2)
Transmisie început la server
```

### În timpul conducerii (la fiecare 10 secunde):
```
Ora 09:00:10 - GPS: 44.4405, 26.0985 (te-ai mișcat 50m nord)
Ora 09:00:20 - GPS: 44.4412, 26.0993 (încă 50m nord)  
Ora 09:00:30 - GPS: 44.4419, 26.1001 (ai cotit spre est)
Ora 09:00:40 - GPS: 44.4426, 26.1009 (continui pe traseu)
Ora 09:00:50 - GPS: 44.4433, 26.1017 (aproape de semafor)
Ora 09:01:00 - GPS: 44.4440, 26.1025 (ai trecut semafor)
...și așa mai departe până ajungi...
Ora 09:15:40 - GPS: 44.4267, 26.1025 (aproape de Piața Unirii)
Ora 09:15:50 - GPS: 44.4267, 26.1030 (ai parcat)
```

### La punctul B (STOP):
```
Ora 09:16:00 - Apasă STOP
GPS final: 44.4267, 26.1030 (Piața Unirii)
Status: STOPPED (4)
Transmisie oprită
```

## REZULTATUL PE SERVER:

**Vei avea înregistrat complet:**
- **100+ puncte GPS** pentru o cursă de 16 minute
- **Traseu exact** pe hartă cu toate cotiturile
- **Viteza la fiecare punct** (0 km/h la semafor, 50 km/h pe șosea)
- **Timpul exact** pentru fiecare segment
- **Distanța totală calculată** din coordonate reale
- **Opriri, accelerări, frânări** - toate vizibile

## PRECIZIE:

**Fiecare 10 secunde:**
- Coordonate GPS reale cu precizie ~3-5 metri
- Viteză reală calculată de chipset
- Direcție reală de mișcare
- Timestamp exact România (+3 UTC)

**CONCLUZIA:** Vei avea traseu COMPLET și EXACT din viața reală, fără să pierzi niciun segment important!