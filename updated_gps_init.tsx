// Inițializare GPS condiționată de starea transportului și autentificării
useEffect(() => {
  console.log("Inițializare GPS automată la pornire");
  
  const initGps = async () => {
    // Verificăm dacă avem un transport activ - doar atunci inițializăm GPS-ul complet
    const shouldStartGps = transportStatus === "active";
    
    try {
      // Solicită permisiuni GPS (doar o dată, indiferent de starea transportului)
      const permissions = await CapacitorGeoService.requestPermissions();
      console.log("Permisiuni GPS obținute:", permissions);
      
      // Verifică disponibilitatea GPS-ului inițial
      const isGpsAvailable = await checkGpsAvailability();
      console.log("Disponibilitate GPS inițială:", isGpsAvailable ? "Disponibil" : "Indisponibil");
      
      // Obține poziția inițială pentru a popula harta, doar dacă transportul este activ
      if (shouldStartGps) {
        try {
          const position = await getCurrentPosition();
          console.log("Poziție GPS inițială obținută:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Actualizează starea cu poziția inițială, dar nu activăm GPS-ul!
          // GPS-ul va fi marcat ca activ doar când un transport este activ
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            viteza: 0,
            directie: 0,
            altitudine: 0,
            baterie: 100 // Valoare implicită
          });
          
          // Pornește urmărirea poziției pentru UI (nu pentru trimitere periodică)
          await startWatchPosition();
        } catch (error) {
          console.error("Eroare la obținerea poziției inițiale:", error);
        }
      } else {
        console.log("Nu se inițializează GPS complet - transport inactiv");
      }
    } catch (error) {
      console.error("Eroare la inițializarea GPS:", error);
      
      // Nu mai afișăm toast, folosim doar alerta permanentă din ConnectivityAlert
      // pentru a evita dublarea mesajelor de eroare
      
      // Setăm coordonate implicite doar dacă transportul este activ și nu avem coordonate
      if (shouldStartGps && !gpsCoordinates) {
        setGpsCoordinates({
          lat: 44.4268, // Coordonate generice pentru București (doar pentru UI)
          lng: 26.1025,
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
          viteza: 0,
          directie: 0,
          altitudine: 0,
          baterie: 100 // Valoare implicită
        });
      }
    }
  };
  
  // Inițializează monitorizarea conectivității
  console.log("Inițializare monitorizare conectivitate");
  setupConnectivityListeners(
    // Callback pentru când conectivitatea este restaurată
    async () => {
      console.log("Conectivitate restaurată, sincronizare date offline");
      // Verificăm dacă avem token pentru a sincroniza date
      if (token) {
        await syncOfflineData(token);
      } else {
        console.warn("Nu se pot sincroniza datele offline - token lipsă");
      }
    }
  );
  
  // Inițializează GPS doar când utilizatorul este autentificat
  if (isAuthenticated) {
    initGps();
  } else {
    // Resetăm starea pentru utilizatorii neautentificați
    setIsGpsActive(false);
    setGpsCoordinates(null);
    console.log("GPS neactivat - utilizator neautentificat");
  }
  
  // Cleanup la unmount
  return () => {
    console.log("Cleanup monitorizare conectivitate");
    stopGpsTracking();
  };
}, [startWatchPosition, stopGpsTracking, token, isAuthenticated, transportStatus, gpsCoordinates, setIsGpsActive, setGpsCoordinates]);