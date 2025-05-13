# Lista Facilităților Aplicației iTrack

## Interfața Utilizator
1. **Login Securizat**
   - Autentificare cu email și parolă
   - Persistență a sesiunii între restartări
   - Validare date de intrare și mesaje de eroare intuitive

2. **Înregistrare Vehicul**
   - Introducere număr de înmatriculare
   - Validare automată a numărului
   - Asociere cu UIT-uri disponibile

3. **Selector Transport (UIT)**
   - Lista transporturilor disponibile pentru șofer
   - Informații despre locația de pornire și destinație
   - Verificare status anterior în caz de reconectare

4. **Panou de Control**
   - Buton de Start Transport - începe monitorizarea și transmiterea datelor
   - Buton de Pauză Transport - suspendă temporar monitorizarea
   - Buton de Reluare Transport - reactivează monitorizarea
   - Buton de Finalizare Transport - închide transportul curent

5. **Hartă Interactivă**
   - Afișare poziție curentă în timp real
   - Vizualizare traseu parcurs
   - Zoom și navigare intuitivă
   - Marcaje pentru locațiile importante

6. **Panou Statistici**
   - Distanța parcursă în kilometri
   - Viteza curentă, medie și maximă
   - Timpul total de deplasare
   - Estimare timp rămas
   - Nivel baterie și statut conexiune

## Funcționalități Tehnice

7. **Tracking GPS de Precizie**
   - Colectare coordonate GPS la interval regulat (60 secunde)
   - Calculare automată a vitezei, direcției și altitudinii
   - Filtrare coordonate eronate
   - Optimizare pentru acuratețe și consum baterie

8. **Mod Fundal (Background)**
   - Continuarea funcționării când aplicația este minimizată
   - Tracking GPS activ chiar și cu ecranul blocat
   - Notificări persistente pentru status serviciu
   - Reluare automată după închidere accidentală

9. **Mod Offline**
   - Stocare locală a coordonatelor când nu există conexiune
   - Marcarea secvențelor offline pe hartă
   - Sincronizare automată când conexiunea e restabilită
   - Timestamp corect pentru toate înregistrările

10. **Notificări Vocale**
    - Anunțuri vocale la pornirea transportului
    - Alertă vocală la pierderea semnalului GPS
    - Alertă vocală la pierderea conexiunii internet
    - Confirmare vocală la finalizarea transportului
    - Volumul și frecvența configurabile

11. **Monitorizare Sistem**
    - Verificare continuă a statusului GPS
    - Monitorizare conexiune internet
    - Monitorizare nivel baterie
    - Detectare schimbări de rețea (WiFi/date mobile)

12. **Transmitere Securizată**
    - Criptare date transmise
    - Autentificare prin token JWT
    - Headers specifice pentru vehicul (X-Vehicle-Number, X-UIT)
    - Reîncercări automate în caz de eșec

## Integrări și Compatibilitate

13. **Suport Multi-Platformă**
    - Aplicație web responsive
    - Versiune nativă Android (APK)
    - Versiune nativă iOS (prin Capacitor)
    - Comportament consistent pe toate platformele

14. **Integrare API**
    - Comunicare cu API-ul existent al companiei
    - Format date compatibil cu sistemul central
    - Adaptare automată la schimbările de protocol
    - Proxy server pentru evitarea problemelor CORS

15. **Optimizare Resurse**
    - Consum redus de baterie prin GPS inteligent
    - Utilizare eficientă a datelor mobile
    - Funcționare pe dispozitive cu specificații modeste
    - Spațiu de stocare minimal

## Securitate și Confidențialitate

16. **Protecție Date**
    - Datele sunt criptate în tranzit
    - Nicio informație personală stocată pe termen lung
    - Curățare automată a datelor temporare
    - Mecanisme de protecție împotriva accesului neautorizat

17. **Permisiuni Minime**
    - Solicită doar permisiunile absolut necesare
    - Explicații clare pentru fiecare permisiune solicitată
    - Fără acces la alte date personale
    - Conformitate cu GDPR

## Facilități Operaționale

18. **Instrumentare Tehnică**
    - Logging detaliat pentru depanare
    - Mecanism de raportare erori
    - Diagnosticare conexiune și GPS
    - Configurare via parametri server

19. **Suport și Documentație**
    - Instrucțiuni de instalare detaliate
    - Ghid pentru construirea APK-ului
    - Explicații tehnice pentru dezvoltatori
    - Specificații pentru integrări viitoare