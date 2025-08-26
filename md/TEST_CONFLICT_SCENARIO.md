# TEST CONFLICT SCENARIO - Doi numere de telefon (login), același vehicul

## Scenariul de test:
- **Număr telefon 1:** 0721234567 (cont A), pe orice device, vehicul AB123CD, cursă UIT 456789
- **Număr telefon 2:** 0723456789 (cont B), pe orice device, vehicul AB123CD, cursă UIT 456789

## Identificatori generați:

### Șofer 1 (Samsung):
- Device ID: `A1B2C3D4` (Android ID unic Samsung)
- Token Hash: `12345678` (hash din JWT token cont A)
- **Identificator final:** `AB123CD_456789_A1B2C3D4_12345678`

### Șofer 2 (Huawei):  
- Device ID: `E5F6G7H8` (Android ID unic Huawei)
- Token Hash: `87654321` (hash din JWT token cont B)
- **Identificator final:** `AB123CD_456789_E5F6G7H8_87654321`

## Verificare transmisie GPS:

### Șofer 1 transmite:
```json
{
  "uit": "456789",
  "numar_inmatriculare": "AB123CD",
  "lat": 44.4267,
  "lng": 26.1025,
  "viteza": 60,
  "directie": 90,
  "altitudine": 85,
  "hdop": 5,
  "gsm_signal": 4,
  "baterie": "85%",
  "status": 2,
  "timestamp": "2025-08-22 17:30:00"
}
```

### Șofer 2 transmite:
```json
{
  "uit": "456789", 
  "numar_inmatriculare": "AB123CD",
  "lat": 44.4568,
  "lng": 26.0891,
  "viteza": 45,
  "directie": 180,
  "altitudine": 92,
  "hdop": 3,
  "gsm_signal": 5,
  "baterie": "72%",
  "status": 2,
  "timestamp": "2025-08-22 17:30:00"
}
```

## Rezultat:
- **HashMap Android:** Două intrări separate, zero conflict
- **Server:** Primește coordonate de la ambii șoferi pentru același UIT
- **Tracking:** Ambii șoferi urmăriți independent
- **Fluiditate:** Zero interferență între cei doi