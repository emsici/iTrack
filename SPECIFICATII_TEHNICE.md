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
- **Selectare transport**: Șoferii pot alege transportul (UIT) dorit
- **Fluxul de transport**: Interfață pentru gestionarea stărilor unui transport:
  - Pornire transport
  - Pauză transport
  - Reluare transport
  - Finalizare transport
- **Validare date**: Verificarea completitudinii și corectitudinii datelor

### 3.3 Sistem GPS și Geolocalizare
- **Serviciu Geolocation**: Colectarea poziției precise GPS
- **Tracking continuu**: Urmărire în timp real cu actualizare la intervale regulate (60 secunde)
- **Procesare date senzori**: Colectarea informațiilor despre:
  - Viteză
  - Direcție (heading)
  - Altitudine
  - Nivel baterie
- **Afișare pe hartă**: Vizualizarea traseului și poziției curente prin integrare cu Leaflet

### 3.4 Monitorizare și Statistici
- **Statistici în timp real**:
  - Distanță parcursă
  - Viteză medie
  - Viteză maximă
  - Timp de deplasare
  - Nivel baterie
- **Istoric traseu**: Afișarea traseului parcurs pe hartă
- **Exportare date**: Posibilitatea de a exporta datele pentru analiză ulterioară

### 3.5 Funcționare în Background
- **Serviciu background**: Continuă colectarea și transmiterea datelor chiar și când aplicația este minimizată
- **Notificări vocale**: Anunțuri vocale pentru:
  - Pornirea transportului
  - Pauză
  - Reluare
  - Finalizare
  - Pierderea/regăsirea GPS
  - Pierderea/regăsirea conexiunii la internet

### 3.6 Operare Offline
- **Stocarea datelor locale**: În cazul lipsei conexiunii la internet, datele sunt stocate local
- **Sincronizare automată**: Trimiterea datelor stocate când conexiunea este restabilită
- **Gestionarea timpului**: Asigurarea că timestamp-urile sunt corecte și în ordine

### 3.7 Alerte și Notificări
- **Monitorizare conectivitate**: Detectarea și notificarea pierderii conexiunii
- **Monitorizare GPS**: Detectarea și notificarea pierderii semnalului GPS
- **Notificări de sistem**: Menținerea utilizatorului informat despre starea aplicației

## 4. Integrări și API

### 4.1 Integrare API extern
- **Autentificare**: `/api/login` - Gestionare autentificare
- **Informații vehicul**: `/api/vehicle` - Obținere detalii vehicul și UIT-uri disponibile
- **Raportare GPS**: `/api/transport/gps` - Transmitere coordonate GPS
- **Managementul transportului**: `/api/transport/{id}/status` - Actualizare status transport

### 4.2 Integrare senzori mobilă
- **GPS**: Acces la localizarea precisă
- **Accelerometru**: Detectare mișcare
- **Gyroskop**: Determinare orientare
- **Baterie**: Monitorizare nivel baterie

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