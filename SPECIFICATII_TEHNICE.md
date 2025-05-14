# Specificații Tehnice - Aplicația iTrack

## 1. Prezentare Generală

iTrack este o aplicație mobilă cross-platform care permite șoferilor profesioniști monitorizarea transporturilor și raportarea coordonatelor GPS. Aplicația oferă un sistem complet pentru înregistrarea, gestionarea și raportarea în timp real a locațiilor vehiculelor pe tot parcursul transporturilor, cu funcționalități de lucru în fundal și offline.

### Scopul aplicației
- Urmărirea în timp real a vehiculelor prin GPS
- Gestionarea transporturilor (pornire, pauză, reluare, finalizare)
- Raportarea datelor către un server central
- Funcționare continuă în medii cu conectivitate limitată și când telefonul este blocat
- Persistența stării transportului între sesiuni și navigări în aplicație

## 2. Arhitectura Tehnică

### Stack tehnologic
- **Frontend**: React/TypeScript (Single Page Application)
- **Conversia mobilă**: Capacitor (pentru iOS/Android)
- **UI**: Tailwind CSS cu componente ShahCN personalizate
- **Hartă**: Integrare cu Leaflet pentru vizualizarea locației
- **API Extern**: Comunicare directă cu API-ul existent al companiei pentru autentificare și raportare date GPS
- **Stocare locală**: LocalStorage și IndexedDB pentru persistența datelor între sesiuni

### Structura aplicației
```
client/            - Codul aplicației frontend
  src/
    components/    - Componentele UI reutilizabile
    context/       - State management global
    hooks/         - Custom hooks reutilizabile
    lib/           - Servicii și utilități
    pages/         - Paginile principale
server/            - Codul serverului
  routes/          - Definiții rute API
shared/            - Cod partajat între frontend și backend
  schema.ts        - Definițiile tipurilor și modelul de date
```

## 3. Funcționalități Principale

### 3.1 Autentificare și Securitate
- **Autentificare securizată**: Implementare bazată pe JWT
- **Proxy API**: Sistem de proxy pentru API-ul extern care previne problemele de CORS
- **Persistența sesiunii**: Sesiunea utilizatorului este păstrată între restartările aplicației

### 3.2 Modulul de Transport
- **Selectare transport**: Șoferii pot alege transportul (UIT) dorit, cu actualizări periodice la fiecare 30 secunde
- **Fluxul de transport**: Interfață intuitivă pentru gestionarea stărilor unui transport:
  - Pornire transport - începe transmisia GPS și afișează butoane de control relevante
  - Pauză transport - întrerupe temporar transmisia GPS, păstrând însă sesiunea activă
  - Reluare transport - reactivează transmisia GPS după o pauză
  - Finalizare transport - încheie complet transportul și trimite status "finished" către server
- **Persistența între pagini**: Transportul rămâne activ când utilizatorul navighează între ecranele aplicației
- **Registru transporturi**: Sistem de gestionare a stării transporturilor pentru mai multe vehicule simultan
- **Validare date**: Verificarea completitudinii și corectitudinii datelor înainte de trimitere

### 3.3 Sistem GPS și Geolocalizare
- **Serviciu Geolocation**: Colectarea poziției precise GPS cu suport nativ pentru platforme mobile
- **Tracking continuu**: Urmărire în timp real cu transmitere la intervale de 60 secunde
- **Funcționare în fundal**: Continuă urmărirea GPS chiar și când aplicația este minimizată sau telefonul blocat
- **Procesare date senzori**: Colectarea și transmiterea informațiilor despre:
  - Latitudine și longitudine (poziție exactă)
  - Viteză instantanee
  - Direcție (heading) din senzori giroscopici
  - Altitudine
  - Nivel baterie
  - HDOP (precizia GPS)
  - Puterea semnalului GSM/mobil
- **Afișare pe hartă**: Vizualizarea poziției curente pe hartă interactivă Leaflet

### 3.4 Monitorizare și Statistici
- **Statistici în timp real**:
  - Distanță parcursă calculată din coordonatele GPS
  - Viteză medie determinată pe baza distanței și timpului
  - Viteză maximă înregistrată în timpul transportului
  - Timp total de deplasare, inclusiv pauzele
  - Indicator GPS activ/inactiv în header-ul aplicației
- **Afișare hartă**: Vizualizarea poziției curente cu actualizare în timp real
- **Indicator stare GPS**: Indicator vizual (verde când e activ, roșu când e inactiv) persistent între pagini

### 3.5 Funcționare în Background
- **Serviciu background Capacitor**: Continuă colectarea și transmiterea coordonatelor GPS chiar și când:
  - Aplicația este minimizată de utilizator
  - Telefonul este blocat
  - Utilizatorul navighează între pagini
- **Notificări vocale**: Anunțuri vocale configurabile pentru:
  - Pornirea transportului
  - Pauză transport
  - Reluare transport
  - Finalizare transport
  - Pierderea/regăsirea semnalului GPS
  - Pierderea/regăsirea conexiunii la internet

### 3.6 Operare Offline
- **Stocarea locală a coordonatelor GPS**: Salvare în localStorage când conexiunea la internet este indisponibilă
- **Sincronizare automată batch**: Trimiterea coordonatelor stocate în batch când conexiunea este restabilită
- **Timestamping corect**: Asigurarea că timestamp-urile sunt corecte, chiar și pentru datele stocate offline
- **Gestionarea stării de conectivitate**: Monitorizare automată a disponibilității internetului
- **Eliminare date duplicate**: Verificarea coordonatelor și timestamp-urilor pentru a evita duplicarea datelor
- **Păstrarea datelor între sesiuni**: Datele GPS sunt păstrate la logout pentru același utilizator
- **Control avansat al sincronizării**: Activare/dezactivare inteligentă a sincronizării în funcție de starea sesiunii

### 3.7 Alerte și Notificări
- **Alerte de conectivitate**: Notificare imediată când conexiunea la internet este pierdută sau restabilită
- **Alerte GPS**: Notificare când semnalul GPS este pierdut sau indisponibil
- **Toast notifications**: Alerte vizuale non-intruzive pentru toate evenimentele importante
- **Persistența stării între sesiuni**: Starea transportului și configurațiile sunt păstrate între sesiuni și restartări

## 4. Integrări și API

### 4.1 Integrare API extern
- **Autentificare**: `POST /api/login` - Autentificare securizată cu token JWT
- **Informații vehicul**: `GET /api/vehicle/:nr` - Obținere detalii vehicul și UIT-uri disponibile
- **Raportare GPS**: `POST /api/transport/gps` - Transmitere coordonate GPS în format JSON brut
- **Managementul transportului**: `PUT /api/transport/:id/status` - Actualizare status transport (în progres/finalizat)
- **Structură date GPS**: Format JSON specific pentru trimiterea coordonatelor:
  ```json
  {
    "lat": 44.26,
    "lng": 28.62,
    "timestamp": "2025-05-14T03:23:24Z",
    "viteza": 45.8,
    "directie": 180,
    "altitudine": 120.5,
    "baterie": 85,
    "numar_inmatriculare": "B123ABC",
    "uit": "UIT12345",
    "status": "in_progress",
    "hdop": 1.2,
    "gsm_signal": 70
  }
  ```

### 4.2 Integrare senzori mobilă prin Capacitor
- **GPS/Geolocation**: Acces la localizarea precisă cu permisiuni explicite
- **DeviceOrientation**: Obținerea direcției (heading) din senzori giroscopici
- **Baterie**: Monitorizare nivel baterie
- **Network**: Detectarea stării conexiunii la internet
- **App state**: Detecție când aplicația rulează în background

## 5. Securitate și Performanță

### 5.1 Măsuri de securitate
- **HTTPS**: Comunicare criptată pentru toate cererile
- **Validare date**: Verificarea tuturor input-urilor
- **Autorizare**: Verificarea permisiunilor pentru fiecare acțiune
- **Securizare transport**: Configurarea corectă a conexiunilor HTTP/HTTPS

### 5.2 Optimizări de performanță
- **Managementul bateriei**: Reducerea consumului prin optimizarea frecvenței colectării datelor
- **Stocarea eficientă**: Optimizarea structurii de date pentru a minimiza utilizarea spațiului
- **Sincronizare asincronă**: Prevenirea blocării UI în timpul operațiunilor de rețea
- **Lazy loading**: Încărcarea componentelor doar când sunt necesare

## 6. Interfețe și UX

### 6.1 Design adaptiv
- **Layout responsive**: Funcționare optimă pe telefoane și tablete
- **Mod luminos/întunecat**: Adaptarea la preferințele utilizatorului
- **Accesibilitate**: Contrast adecvat și feedback vocal

### 6.2 Ecrane principale
- **Login**: Autentificarea utilizatorului
- **Selectare vehicul**: Introducerea numărului de înmatriculare
- **Selectare transport**: Lista transporturilor disponibile
- **Control transport**: Butoane pentru gestionarea stării transportului
- **Hartă**: Vizualizarea locației și traseului 
- **Statistici**: Informații despre traseu și performanță

## 7. Compilare și Distribuire

### 7.1 Build-uri native
- **Android**: Generarea APK și Bundle pentru Play Store
- **iOS**: Generarea IPA pentru App Store (necesită Mac cu Xcode)

### 7.2 Configurații
- **Dezvoltare**: Utilizarea serverului de proxy pentru facilitarea dezvoltării
- **Producție**: Conexiune directă la API-uri externe

## 8. Monitorizare și Telemetrie

- **Logging**: Înregistrarea detaliată a acțiunilor și erorilor
- **Monitorizare performanță**: Urmărirea consumului de resurse
- **Captare erori**: Detectarea și raportarea erorilor neașteptate

## 9. Evoluții Viitoare

- Suport pentru rute prestabilite și geo-fencing
- Optimizare traseu și sugestii de evitare trafic
- Sistem de comunicare între șoferi și dispecerat
- Integrare cu sistemele vehiculului pentru date suplimentare (consum, diagnostic, etc.)
- Analiză predictivă pentru mentenanță și optimizare costuri