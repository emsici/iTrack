  // Inițializare GPS condiționată de starea transportului și autentificării
  useEffect(() => {
    console.log("Inițializare GPS automată la pornire");
    
    const initGps = async () => {
      // Verificăm dacă avem un transport activ - doar atunci inițializăm GPS-ul complet
      const shouldStartGps = transportStatus === "active";
      
      try {
        // Solicită permisiuni GPS (doar o dată, indiferent de starea transportului)
        // pentru a fi pregătiți când utilizatorul va dori să pornească un transport
        const permissions = await CapacitorGeoService.requestPermissions();
        console.log("Permisiuni GPS obținute:", permissions);
        
        // Verifică disponibilitatea GPS-ului inițial
        const isGpsAvailable = await checkGpsAvailability();
        console.log("Disponibilitate GPS inițială:", isGpsAvailable ? "Disponibil" : "Indisponibil");
        
        // Obține poziția inițială și începe urmărirea DOAR dacă transportul este activ
        if (shouldStartGps) {
          try {
            const position = await getCurrentPosition();
            console.log("Poziție GPS inițială obținută:", {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            
            // Actualizează starea cu poziția inițială
            setGpsCoordinates({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
              viteza: position.coords.speed ? position.coords.speed * 3.6 : 0,
              directie: position.coords.heading || 0,
              altitudine: position.coords.altitude || 0,
              baterie: await CapacitorGeoService.getBatteryLevel()
            });
            
            // Inițializăm flag-ul de GPS activ doar pentru transport activ
            setIsGpsActive(true);
            
            // Pornește urmărirea poziției DOAR dacă transportul este activ
            console.log("Start watch position pentru actualizări UI în timp real");
            startWatchPosition((pos) => {
              // Actualizează poziția doar local pentru UI
              setGpsCoordinates({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
                viteza: pos.coords.speed ? pos.coords.speed * 3.6 : 0,
                directie: pos.coords.heading || 0,
                altitudine: pos.coords.altitude || 0,
                baterie: batteryRef.current // folosim valoarea memorată
              });
            });
          } catch (error) {
            console.error("Eroare la obținerea poziției inițiale:", error);
            setIsGpsActive(false);
          }
        } else {
          console.log("Transport inactiv, nu se inițializează GPS-ul complet");
          // Oprim orice monitorizare GPS existentă pentru a economisi bateria
          stopWatchPosition();
          setIsGpsActive(false);
          
          // Resetăm coordonatele dacă transportul este inactiv sau finalizat
          if (transportStatus === "inactive" || transportStatus === "finished") {
            setGpsCoordinates(null);
          }
        }
      } catch (error) {
        console.error("Eroare la inițializarea GPS:", error);
        setIsGpsActive(false);
      }
    };
    
    // Inițializează monitorizarea conectivității
    console.log("Inițializare monitorizare conectivitate");
    setupConnectivityListeners(async (isConnected) => {
      if (isConnected && token) {
        // Avem conexiune și token, încercăm să sincronizăm datele offline
        await syncOfflineData(token);
      }
    });
    
    // Doar inițializăm GPS-ul dacă utilizatorul este autentificat
    if (isAuthenticated) {
      initGps();
    } else {
      console.log("Utilizator neautentificat, nu se inițializează GPS");
      setIsGpsActive(false);
      setGpsCoordinates(null);
    }
    
    return () => {
      // Curățenie - oprește orice urmărire GPS când componenta este demontată
      console.log("Cleanup monitorizare conectivitate");
      console.log("Stop tracking GPS");
      stopWatchPosition();
    };
  }, [transportStatus, isAuthenticated]); // Re-evaluăm când se schimbă starea transportului sau autentificarea