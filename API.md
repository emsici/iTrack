# iTrack GPS - Documentație API

## Prezentare Generală

Aplicația iTrack GPS comunică cu un server backend prin API RESTful pentru autentificare, gestionarea curselor și transmisia datelor GPS. Toate comunicările sunt securizate prin HTTPS și utilizează autentificare JWT token.

## Configurare API

### Base URL
```
https://www.euscagency.com/etsm3/platforme/transport/apk
```

### Headers Comune
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {jwt_token}' // Pentru endpoint-urile autentificate
}
```

### Timeout și Retry
- **Timeout**: 10 secunde pentru toate request-urile
- **Retry Logic**: Maximum 3 încercări pentru request-urile eșuate
- **Exponential Backoff**: Delay crescător între retry-uri

## Endpoint-uri API

### 1. Autentificare

#### POST /api_login.php
Autentifică utilizatorul și returnează JWT token.

**Request Body:**
```json
{
  "email": "sofer@company.ro",
  "password": "parola123"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "12345",
  "expires_in": 3600
}
```

**Response Error (401):**
```json
{
  "status": "error",
  "error": "Date de conectare incorecte"
}
```

**Credențiale Admin pentru Testing:**
- Email: `admin@itrack.app`
- Password: `parola123`
- Token returnat: `ADMIN_TOKEN`

#### POST /api_logout.php
Invalidează token-ul JWT și curăță sesiunea server.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Logout successful"
}
```

### 2. Gestionare Curse

#### GET /get_courses_by_vehicle.php
Încarcă toate cursele disponibile pentru un vehicul specific.

**URL Parameters:**
```
?vehicle={numar_inmatriculare}&token={jwt_token}
```

**Exemplu Request:**
```
GET /get_courses_by_vehicle.php?vehicle=B123ABC&token=eyJhbGciOi...
```

**Response Success (200):**
```json
[
  {
    "id": "course_001",
    "name": "Transport Bucuresti - Cluj",
    "departure_location": "Bucuresti",
    "destination_location": "Cluj-Napoca",
    "departure_time": "2025-06-20 08:00:00",
    "arrival_time": "2025-06-20 16:00:00",
    "description": "Transport marfa generala",
    "status": 1,
    "uit": "UIT123456789",
    "ikRoTrans": 1001,
    "codDeclarant": 2001,
    "denumireDeclarant": "Transport Express SRL",
    "nrVehicul": "B123ABC",
    "dataTransport": "2025-06-20",
    "vama": "Bucuresti",
    "birouVamal": "Bucuresti Nord",
    "judet": "Bucuresti",
    "denumireLocStart": "Depozit Bucuresti",
    "vamaStop": "Cluj",
    "birouVamalStop": "Cluj Est",
    "judetStop": "Cluj",
    "denumireLocStop": "Magazin Cluj"
  }
]
```

**Statusuri Curse:**
- `1`: Disponibil (poate fi începută)
- `2`: Activ (în desfășurare)
- `3`: Pauză (întreruptă temporar)
- `4`: Oprită (finalizată)

#### POST /update_course_status.php
Actualizează statusul unei curse.

**Request Body:**
```json
{
  "course_id": "course_001",
  "status": 2,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timestamp": "2025-06-20T10:30:00Z"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Course status updated successfully",
  "course_id": "course_001",
  "new_status": 2
}
```

### 3. GPS Tracking

#### POST /gps.php
Transmite coordonatele GPS cu metadate complete.

**Request Body:**
```json
{
  "lat": 44.426767,
  "lng": 26.102538,
  "timestamp": "2025-06-20T10:30:15Z",
  "viteza": 85,
  "directie": 45,
  "altitudine": 95,
  "baterie": 78,
  "numar_inmatriculare": "B123ABC",
  "uit": "UIT123456789",
  "status": "2",
  "hdop": "1.2",
  "gsm_signal": "4",
  "course_id": "course_001",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Parametri GPS:**
- **lat/lng**: Coordonate cu precizie 8 decimale
- **timestamp**: ISO 8601 format cu timezone UTC
- **viteza**: Viteza în km/h (integer)
- **directie**: Direcția în grade (0-360)
- **altitudine**: Altitudinea în metri
- **baterie**: Procentaj baterie (0-100)
- **hdop**: Horizontal Dilution of Precision
- **gsm_signal**: Puterea semnalului GSM (1-5)

**Response Success (200):**
```json
{
  "status": "success",
  "message": "GPS data received",
  "timestamp": "2025-06-20T10:30:15Z",
  "coordinates_id": "gps_12345"
}
```

**Response Error (400):**
```json
{
  "status": "error",
  "error": "Invalid GPS coordinates",
  "details": "Latitude must be between -90 and 90"
}
```

## Gestionarea Erorilor

### Coduri de Status HTTP
- **200**: Success - Request procesat cu succes
- **400**: Bad Request - Date invalide în request
- **401**: Unauthorized - Token JWT invalid sau expirat
- **403**: Forbidden - Acces interzis pentru resursa solicitată
- **404**: Not Found - Endpoint-ul nu există
- **429**: Too Many Requests - Rate limiting activ
- **500**: Internal Server Error - Eroare server

### Formato Răspuns Erori
```json
{
  "status": "error",
  "error": "Mesaj eroare pentru utilizator",
  "error_code": "GPS_INVALID_COORDINATES",
  "details": "Detalii tehnice pentru debugging",
  "timestamp": "2025-06-20T10:30:15Z"
}
```

### Gestionarea în Aplicație
Aplicația implementează retry logic automat pentru erorile temporare:

```typescript
// Retry pentru network errors
const retryableErrors = [408, 429, 500, 502, 503, 504];

// Exponential backoff
const delays = [1000, 2000, 4000]; // 1s, 2s, 4s

// Fallback la offline storage pentru GPS
if (error && isGPSEndpoint) {
  await offlineGPSService.saveCoordinate(gpsData, courseId, vehicleNumber, token, status);
}
```

## Autentificare JWT

### Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Payload Decodat
```json
{
  "sub": "user_12345",
  "name": "Sofer Transport",
  "iat": 1671234567,
  "exp": 1671238167,
  "role": "driver",
  "vehicle_access": ["B123ABC", "B456DEF"]
}
```

### Gestionare Token
- **Stocare**: Capacitor Preferences (securizat)
- **Expirare**: Verificare automată înaintea fiecărui request
- **Refresh**: Re-login automat când token expiră
- **Cleanup**: Ștergere la logout

## Rate Limiting

### Limite Request-uri
- **Login**: 5 încercări per minut per IP
- **GPS Data**: 1 request per 5 secunde per vehicul
- **Course Management**: 10 request-uri per minut per token
- **General**: 100 request-uri per minut per token

### Headers Rate Limiting
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1671234567
```

## Monitoring și Logging

### Request Logging în Aplicație
Toate request-urile API sunt loggate pentru debugging:

```typescript
// Structura log API
{
  timestamp: "2025-06-20T10:30:15Z",
  method: "POST",
  endpoint: "/gps.php",
  status: 200,
  responseTime: 245, // ms
  requestSize: 1024, // bytes
  responseSize: 128, // bytes
  error: null
}
```

### Metrici de Performanță
- **Response Time Average**: < 500ms pentru GPS
- **Success Rate**: > 99% pentru toate endpoint-urile
- **Availability**: 99.9% uptime SLA

## Dezvoltare și Testing

### Environment URLs
```javascript
const API_URLS = {
  production: 'https://www.euscagency.com/etsm3/platforme/transport/apk',
  staging: 'https://staging.euscagency.com/etsm3/platforme/transport/apk',
  development: 'http://localhost:8080/api' // Pentru testing local
};
```

### Mock Responses pentru Testing
Pentru testing offline, aplicația poate utiliza răspunsuri mock:

```typescript
// Mock course data pentru testing
const mockCourses = [
  {
    id: "mock_001",
    name: "Test Course Bucuresti - Cluj",
    status: 1,
    uit: "MOCK123456789"
  }
];

// Activare mock mode
localStorage.setItem('api_mock_mode', 'true');
```

### Debugging API
Aplicația oferă debugging complet prin debug panel:
- Logging toate request-urile și răspunsurile
- Timing și performance metrics
- Error tracking cu stack traces
- Network status monitoring

## Securitate API

### HTTPS Obligatoriu
Toate comunicările trebuie să folosească HTTPS pentru protecția datelor în tranzit.

### Validare Input
- Sanitizarea tuturor inputurilor
- Validare format email și coordonate GPS
- Lungime maximă pentru stringuri
- Rate limiting pentru preveni abuse

### Data Privacy
- Nu se transmit date personale sensibile
- Coordonatele GPS sunt anonimizate la nivel de server
- Token-urile JWT nu conțin informații sensibile
- Logging exclude datele personale