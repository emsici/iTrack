# iTrack Transport - Aplicație de Monitorizare

## Descriere
iTrack este o aplicație mobilă profesională pentru șoferi care permite monitorizarea transporturilor și trimiterea coordonatelor GPS în timp real. Aplicația este dezvoltată pentru a funcționa pe dispozitive Android și iOS, cu suport pentru construirea directă a unui APK Android.

## Caracteristici principale

### Autentificare și Gestionare Vehicule
- Autentificare securizată cu JWT
- Gestionarea informațiilor despre vehicul și număr de înmatriculare
- Salvarea sesiunii autentificate până la expirarea token-ului
- Persistența stării între sesiunile utilizatorului pentru aceeași identitate

### Monitorizare Transport
- Selectarea UIT-urilor disponibile cu actualizare automată la fiecare 30 secunde
- Control complet al stării transportului (pornire, pauză, reluare, finalizare)
- Afișarea stării GPS și informațiilor despre locație în timp real
- Afișarea statisticilor de transport (distanță, viteză, timp)
- Suport pentru gestionarea mai multor transporturi simultan de către manageri

### Tracking GPS
- Tracking GPS continuu în fundal, chiar și când aplicația este minimizată sau telefonul blocat
- Salvarea coordonatelor offline când nu există conexiune la internet
- Sincronizarea automată a datelor când conexiunea este restaurată
- Trimiterea coordonatelor GPS la fiecare minut către serverul API
- Eliminarea datelor duplicate pentru eficiență rețea (verificare coordonate și timestamp)
- Afișarea numărului de duplicate detectate și eliminate în timpul sincronizării
- Verificarea și filtrarea triplă a duplicatelor: la salvare, înainte de sincronizare și la trimitere
- Păstrarea datelor offline pentru reconectări ale aceluiași utilizator
- Control inteligent al sincronizării: activare automată la login, dezactivare la logout

### Interfață Utilizator
- Interfață mobilă optimizată cu design responsive
- Indicator de stare GPS (verde când este activ, roșu când este inactiv)
- Hartă interactivă cu poziția curentă
- Alerte pentru pierderea conexiunii GPS sau internet
- Dialog About cu informații despre aplicație accesibil din meniu

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

## Optimizări pentru gestionarea datelor

### Strategii de eliminare a duplicatelor GPS
Aplicația implementează o strategie în trei etape pentru a preveni transmiterea datelor GPS duplicate:

1. **La salvare locală:** 
   - Verificare dacă coordonatele GPS au aceleași valori lat/lng și timestamp înainte de a fi salvate
   - Calculul diferenței minime între coordonate pentru a considera două puncte distincte

2. **Înainte de sincronizare:**
   - Filtrare suplimentară a datelor din localStorage folosind un Set() pentru a elimina înregistrările cu aceleași coordonate și timestamp
   - Numărarea și raportarea duplicatelor identificate

3. **La trimitere către API:**
   - Verificare finală pentru a preveni trimiterea datelor redundante către server
   - Trimiterea doar a datelor unice pentru a optimiza transferul de date și spațiul de stocare

### Managementul sesiunii și controlul sincronizării
- Activarea automată a sincronizării la autentificare
- Dezactivarea sincronizării la deconectare pentru a preveni trimiterea neintenționată a datelor
- Păstrarea contextuală a datelor GPS: menținerea între sesiuni pentru același utilizator, ștergerea pentru utilizatori diferiți
- Mecanisme avansate de protecție împotriva expirării token-urilor și reautentificare