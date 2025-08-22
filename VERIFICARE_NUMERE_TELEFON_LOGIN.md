# VERIFICARE: DOI UTILIZATORI CU NUMERE DE TELEFON DIFERITE

## SCENARIUL REAL:
- **Utilizator 1:** Login cu numărul de telefon `0721234567` + parolă
- **Utilizator 2:** Login cu numărul de telefon `0723456789` + parolă
- **Ambii:** Folosesc același vehicul AB123CD și aceeași cursă UIT 456789

## FLOW-UL DE AUTENTIFICARE:

### Utilizator 1 (0721234567):
1. Login: `0721234567` + parolă → Server returnează `TOKEN_A`
2. Device ID: Oricare Android ID (ex: `A1B2C3D4`)
3. Token Hash: `12345678` (din TOKEN_A)
4. **Identificator final:** `AB123CD_456789_A1B2C3D4_12345678`

### Utilizator 2 (0723456789):
1. Login: `0723456789` + parolă → Server returnează `TOKEN_B` 
2. Device ID: Oricare Android ID (ex: `E5F6G7H8` sau chiar același `A1B2C3D4`)
3. Token Hash: `87654321` (din TOKEN_B)
4. **Identificator final:** `AB123CD_456789_E5F6G7H8_87654321`

## PROTECȚIA DUBLĂ:

### 1. Token JWT diferit:
- Fiecare număr de telefon primește token unic la login
- Token-urile au hash-uri diferite
- **Chiar pe același device fizic = identificatori diferiți**

### 2. Device ID + Token Hash:
- Chiar dacă același device: `TOKEN_A` ≠ `TOKEN_B`
- Hash diferit = identificator unic garantat
- **Zero posibilitate de conflict**

## TRANSMISIE LA SERVER:

### Ambii utilizatori transmit:
```json
{
  "uit": "456789",
  "numar_inmatriculare": "AB123CD"
  // ... coordonate GPS
}
```

### Cu headers diferite:
- **Utilizator 1:** `Authorization: Bearer TOKEN_A`
- **Utilizator 2:** `Authorization: Bearer TOKEN_B`

## REZULTAT:
**COMPLET SIGUR** - Sistemul identifică corect ambii utilizatori prin token-urile JWT diferite, indiferent de device-ul folosit!