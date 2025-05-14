# iTrack Transport - Aplicație de Monitorizare

## Descriere
iTrack este o aplicație mobilă profesională pentru șoferi care permite monitorizarea transporturilor și trimiterea coordonatelor GPS în timp real. Aplicația este dezvoltată pentru a funcționa pe dispozitive Android și iOS, cu suport pentru construirea directă a unui APK Android.

## Caracteristici principale

### Autentificare și Gestionare Vehicule
- Autentificare securizată cu JWT
- Gestionarea informațiilor despre vehicul și număr de înmatriculare
- Salvarea sesiunii autentificate până la expirarea token-ului

### Monitorizare Transport
- Selectarea UIT-urilor disponibile cu actualizare automată la fiecare 30 secunde
- Control complet al stării transportului (pornire, pauză, reluare, finalizare)
- Afișarea stării GPS și informațiilor despre locație în timp real
- Afișarea statisticilor de transport (distanță, viteză, timp)

### Tracking GPS
- Tracking GPS continuu în fundal, chiar și când aplicația este minimizată sau telefonul blocat
- Salvarea coordonatelor offline când nu există conexiune la internet
- Sincronizarea automată a datelor când conexiunea este restaurată
- Trimiterea coordonatelor GPS la fiecare minut către serverul API

### Interfață Utilizator
- Interfață mobilă optimizată cu design responsive
- Indicator de stare GPS (verde când este activ, roșu când este inactiv)
- Hartă interactivă cu poziția curentă
- Alerte pentru pierderea conexiunii GPS sau internet

## Workflow Transport

1. **Inițierea transportului:**
   - Utilizatorul selectează un UIT disponibil
   - Apasă butonul "Pornește" pentru a începe transportul
   - Starea transportului se schimbă în "activ" și începe urmărirea GPS

2. **Urmărirea GPS activă:**
   - Coordonatele GPS sunt citite și trimise către server la fiecare 60 secunde
   - Funcția de urmărire rămâne activă chiar și când aplicația este minimizată
   - Datele sunt stocate local când nu există conexiune la internet

3. **Navigarea în aplicație:**
   - Starea transportului este salvată local și persistă între navigări
   - Utilizatorul poate schimba între paginile aplicației fără a pierde statusul transportului
   - La revenirea în aplicație, interfața este restaurată pentru a reflecta starea curentă

4. **Minimizare și blocare telefon:**
   - Aplicația continuă să monitorizeze și să trimită poziții GPS
   - Serviciul de fundal funcționează chiar și când telefonul este blocat
   - La revenirea în aplicație, datele sunt sincronizate automat

5. **Actualizarea transporturilor din API:**
   - La fiecare 30 de secunde, aplicația verifică dacă există noi transporturi disponibile
   - Transporturile noi sunt adăugate la sfârșitul listei existente
   - Utilizatorul primește notificare când apar transporturi noi

6. **Finalizarea transportului:**
   - Utilizatorul apasă butonul "Finalizează" pentru a marca transportul ca finalizat
   - Ultimele coordonate sunt trimise cu status "finished"
   - Tracking-ul GPS se oprește și starea transportului revine la "inactiv"

## Tehnologii utilizate

- React cu TypeScript pentru logica de business
- Capacitor pentru integrare nativă pe dispozitive mobile
- Leaflet pentru afișarea hărților interactive
- Tailwind CSS pentru stil și design responsive
- Context API pentru gestionarea stării aplicației
- WebSocket pentru comunicare în timp real
- React Query pentru management avansat al stării
- LocalStorage pentru persistența datelor între sesiuni