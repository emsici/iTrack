import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';

// Interfață pentru tipul navigator.connection extins
interface NavigatorWithConnection extends Navigator {
  connection?: {
    signalStrength?: number;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

// Verifică dacă aplicația rulează pe o platformă nativă (Android/iOS) sau în browser
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// Flag pentru a evita solicitări multiple simultane
let isRequestingPermissions = false;

// Flag pentru a ține evidența dacă am solicitat deja permisiunile
let permissionsRequested = false;

// Funcție pentru solicitarea permisiunilor GPS
export const requestGpsPermissions = async (): Promise<boolean> => {
  console.log("Solicitare permisiuni GPS la pornirea aplicației");
  
  // Dacă am solicitat deja permisiunile și suntem pe dispozitiv nativ, 
  // nu mai solicităm din nou pentru a evita blocarea aplicației
  if (permissionsRequested && Capacitor.isNativePlatform()) {
    console.log("Permisiunile au fost deja solicitate anterior, nu mai solicităm");
    return true;
  }
  
  // Prevenim multiple solicitări simultane care ar putea bloca aplicația
  if (isRequestingPermissions) {
    console.log("Solicitarea permisiunilor este deja în curs, așteptăm");
    // Așteptăm puțin și returnăm true pentru a permite fluxul să continue
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1000);
    });
  }
  
  try {
    isRequestingPermissions = true;
    
    if (!Capacitor.isNativePlatform()) {
      console.log("Rulăm în browser, solicităm permisiuni browser standard");
      // În browser, folosim navigator.permissions dacă este disponibil
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (result.state === 'granted') {
            isRequestingPermissions = false;
            permissionsRequested = true;
            return true;
          }
        } catch (browserPermError) {
          console.log("Eroare la verificarea permisiunilor browser:", browserPermError);
        }
      }
      
      // Dacă nu putem verifica permisiunile sau nu sunt acordate,
      // încercăm să obținem poziția direct pentru a declanșa promptul
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            console.log("Permisiuni browser acordate");
            isRequestingPermissions = false;
            permissionsRequested = true;
            resolve(true);
          },
          (err) => {
            console.error("Permisiuni browser respinse:", err);
            isRequestingPermissions = false;
            permissionsRequested = true;
            resolve(false);
          },
          { timeout: 3000, enableHighAccuracy: true }
        );
      });
    }
    
    // Gestionăm platforma nativă (Android/iOS)
    // Verificăm starea permisiunii
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      console.log("Stare permisiuni GPS:", permissionStatus.location);
      
      // Dacă permisiunea este deja acordată, returnam direct true
      if (permissionStatus.location === 'granted') {
        console.log("Permisiune GPS deja acordată");
        isRequestingPermissions = false;
        permissionsRequested = true;
        return true;
      }
      
      // Pentru Android 10+ (API 29+), gestionare specială pentru ACCESS_BACKGROUND_LOCATION
      // Această permisiune trebuie solicitată separat și doar după ce utilizatorul a acordat permisiunile de bază
      if (Capacitor.getPlatform() === 'android') {
        // Prima dată solicităm doar permisiunile de bază (FINE și COARSE location)
        console.log("Solicităm permisiuni de localizare de bază pentru Android");
        
        try {
          // Marcăm faptul că am solicitat permisiunile pentru a nu le solicita din nou
          permissionsRequested = true;
          
          // Solicităm permisiunile cu un timeout pentru a preveni blocarea
          const requestPromise = Geolocation.requestPermissions();
          const timeoutPromise = new Promise<any>((resolve) => {
            setTimeout(() => {
              console.log("Timeout la solicitarea permisiunilor de bază");
              resolve({ location: 'timeout' });
            }, 2000);
          });
          
          const requestResult = await Promise.race([requestPromise, timeoutPromise]);
          console.log("Rezultat solicitare permisiuni de bază:", requestResult.location);
          
          // Chiar dacă permisiunea este refuzată, continuăm fluxul aplicației pentru a nu o bloca
          isRequestingPermissions = false;
          
          // Returnează true pentru a permite continuarea fluxului, chiar dacă permisiunile nu sunt acordate
          // Utilizatorul va fi notificat în UI că sunt necesare permisiunile
          return true;
        } catch (error) {
          console.error("Eroare la solicitarea permisiunilor Android:", error);
          isRequestingPermissions = false;
          permissionsRequested = true;
          return true; // Continuăm fluxul chiar și în caz de eroare
        }
      }
      
      // Pentru iOS și alte platforme
      console.log("Solicităm permisiuni GPS (non-Android)");
      try {
        const requestResult = await Geolocation.requestPermissions();
        console.log("Rezultat solicitare permisiuni GPS:", requestResult.location);
        
        isRequestingPermissions = false;
        permissionsRequested = true;
        
        // Chiar dacă permisiunea este refuzată, continuăm pentru a nu bloca aplicația
        // Utilizatorul va fi notificat în UI că sunt necesare permisiunile
        return true;
      } catch (error) {
        console.error("Eroare la solicitarea permisiunilor non-Android:", error);
        isRequestingPermissions = false;
        permissionsRequested = true;
        return true;
      }
    } catch (checkError) {
      console.error("Eroare la verificarea permisiunilor:", checkError);
      isRequestingPermissions = false;
      permissionsRequested = true;
      return true; // Continuăm fluxul chiar și în caz de eroare
    }
  } catch (err) {
    console.error("Eroare generală la solicitarea permisiunilor GPS:", err);
    isRequestingPermissions = false;
    permissionsRequested = true;
    // Returnăm true în caz de eroare pentru a permite continuarea fluxului aplicației
    return true;
  }
};

// Serviciu de geolocation folosind Capacitor
export const CapacitorGeoService = {
  // Obținerea valorii HDOP (Horizontal Dilution of Precision)
  getHDOP: async (): Promise<number> => {
    try {
      // Android permite accesul la HDOP și alte metrici GPS avansate prin plugin-uri native
      if (Capacitor.isNativePlatform()) {
        if (Capacitor.getPlatform() === 'android') {
          try {
            // Încercăm să obținem poziția cu opțiuni avansate
            // Capacitor Geolocation nu ne oferă direct HDOP, dar Android are acces intern
            // Pentru a-l obține, am putea crea un plugin personalizat Capacitor
            // Acest plugin ar putea accesa LocationManager și să extragă metricile GPS
            
            // Următoarea secțiune simulează apelul unui plugin personalizat
            // Într-o implementare reală, am avea ceva de genul:
            // const hdopResult = await HDOPPlugin.getValue();
            
            // Deocamdată, folosim o metodă mai indirectă, obținând o nouă poziție
            // și inspectând proprietățile disponibile în poziție
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
            
            // Convertim acuratețea în HDOP aproximativ
            // Un HDOP de calitate este: 0-1 (excelent), 1-2 (bun), 2-5 (moderat), 5-10 (slab), 10+ (foarte slab)
            // Aceasta este o aproximare, deoarece acuratețea este în metri și HDOP este un factor
            if (position.coords.accuracy) {
              // Formula aproximativă: HDOP ≈ accuracy / 5 (pentru valori GPS tipice)
              // O acuratețe de 5m ≈ HDOP 1.0
              // O acuratețe de 10m ≈ HDOP 2.0
              const estimatedHDOP = position.coords.accuracy / 5;
              console.log(`HDOP estimat din acuratețea GPS (${position.coords.accuracy}m): ${estimatedHDOP}`);
              return Math.min(Math.max(estimatedHDOP, 0.5), 20); // Limităm între 0.5 și 20
            }
          } catch (err) {
            console.warn('Eroare la accesarea HDOP nativ:', err);
          }
        }
        
        // Dacă metoda specifică platformei a eșuat sau suntem pe iOS
        // Facem o estimare bazată pe acuratețea poziției actuale
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 5000
          });
          
          if (position.coords.accuracy) {
            // Conversia acurateței în HDOP aproximativ
            const estimatedHDOP = position.coords.accuracy / 5;
            return Math.min(Math.max(estimatedHDOP, 0.5), 20); // Limităm între 0.5 și 20
          }
        } catch (posErr) {
          console.warn('Nu se poate estima HDOP din poziție:', posErr);
        }
        
        // Valoare de rezervă pentru dispozitivele native
        return 1.5;
      }
      
      // Pentru browser, nu avem acces direct la HDOP, returnăm o valoare implicită
      return 2.0;
    } catch (error) {
      console.warn('Nu se poate obține HDOP:', error);
      return 2.0; // Valoare implicită în caz de eroare
    }
  },
  
  // Obținerea puterii semnalului GSM (0-100%)
  getGSMSignal: async (): Promise<number> => {
    try {
      // În mod normal, puterea semnalului GSM/Celular ar trebui obținută de la API-ul nativ
      if (Capacitor.isNativePlatform()) {
        // Pe Android, puterea semnalului poate fi obținută folosind un plugin personalizat
        // care accesează TelephonyManager și obține valorile semnalului
        if (Capacitor.getPlatform() === 'android') {
          try {
            // Aici ar trebui să fie un apel către un plugin nativ care obține informații celulare
            // Pe un dispozitiv real, am crea un plugin Capacitor personalizat
            // Exemplu: const signalInfo = await NetworkInfoPlugin.getSignalStrength();
            
            // Deocamdată, folosim o alternativă: verificarea calității conexiunii de rețea
            // În Android, putem obține informații despre conexiune folosind API-ul NetworkInfo
            // Într-o implementare reală, am avea un plugin dedicat

            // Estimare bazată pe viteza de conexiune și tipul rețelei
            // Poate fi implementat printr-un plugin Capacitor personalizat
            // care accesează NetworkCapabilities sau ConnectivityManager din Android
            
            // În absența unui plugin, putem folosi API-uri web pentru a estima
            // calitatea conexiunii indirectă prin teste de viteză sau latență
            
            // Testăm latența cu un ping simplu către un server cunoscut
            const startTime = Date.now();
            try {
              const testResponse = await fetch('https://www.google.com', { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store' 
              });
              const latency = Date.now() - startTime;
              
              // Convertim latența într-o estimare a puterii semnalului
              // Latență mică = semnal puternic, latență mare = semnal slab
              // 0-100ms: excelent, 100-300ms: bun, 300-600ms: mediu, 600ms+: slab
              if (latency < 100) return 95;
              if (latency < 300) return 85;
              if (latency < 600) return 70;
              if (latency < 1000) return 50;
              return 30;
            } catch (networkErr) {
              console.warn('Eroare la testul de latență:', networkErr);
              // Dacă testul de latență eșuează, încercăm să estimăm din tipul conexiunii
            }
          } catch (androidErr) {
            console.warn('Eroare la obținerea informațiilor de semnal Android:', androidErr);
          }
        }
        
        // Pentru iOS sau dacă metodele Android au eșuat
        // iOS restricționează accesul la informațiile despre semnal și rețea
        // Putem estima din efectiveType sau informații despre conexiune
        
        // Verificăm NetworkInformation API dacă e disponibil
        const nav = navigator as NavigatorWithConnection;
        if (nav.connection) {
          // Estimăm puterea semnalului din tipul conexiunii
          const effectiveType = nav.connection.effectiveType;
          if (effectiveType === '4g') return 90;
          if (effectiveType === '3g') return 75;
          if (effectiveType === '2g') return 50;
          if (effectiveType === 'slow-2g') return 25;
          
          // Sau estimăm din viteza de descărcare (downlink)
          if (nav.connection.downlink) {
            const mbps = nav.connection.downlink; // în Mbps
            if (mbps > 10) return 95;
            if (mbps > 5) return 85;
            if (mbps > 2) return 75;
            if (mbps > 1) return 65;
            if (mbps > 0.5) return 50;
            return 40;
          }
          
          // Sau estimăm din RTT (round-trip time)
          if (nav.connection.rtt) {
            const rtt = nav.connection.rtt; // în ms
            if (rtt < 50) return 95;
            if (rtt < 100) return 85;
            if (rtt < 200) return 75;
            if (rtt < 400) return 60;
            if (rtt < 700) return 40;
            return 30;
          }
        }
        
        // Dacă toate metodele eșuează, returnăm o valoare implicită
        return 80;
      }
      
      // Pentru browser, verificăm NetworkInformation API
      const nav = navigator as NavigatorWithConnection;
      if (nav.connection) {
        // Folosim aceleași metode ca mai sus pentru estimare
        const effectiveType = nav.connection.effectiveType;
        if (effectiveType === '4g') return 90;
        if (effectiveType === '3g') return 75;
        if (effectiveType === '2g') return 50;
        if (effectiveType === 'slow-2g') return 25;
        
        if (nav.connection.downlink) {
          const mbps = nav.connection.downlink;
          if (mbps > 10) return 95;
          if (mbps > 5) return 85;
          if (mbps > 2) return 75;
          if (mbps > 1) return 65;
          if (mbps > 0.5) return 50;
          return 40;
        }
      }
      
      // Valoare implicită pentru browser dacă nu putem determina
      return 85;
    } catch (error) {
      console.warn('Nu se poate obține puterea semnalului GSM:', error);
      return 85; // Valoare implicită
    }
  },
  // Obținerea nivelului bateriei
  getBatteryLevel: async (): Promise<number> => {
    try {
      // Folosim API-ul Browser Battery dacă e disponibil
      if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
        const batteryManager = await (navigator as any).getBattery();
        return Math.round(batteryManager.level * 100);
      }
      // Verificăm API-uri mai vechi
      else if ((navigator as any).battery || (navigator as any).mozBattery) {
        const battery = (navigator as any).battery || (navigator as any).mozBattery;
        return Math.round(battery.level * 100);
      }
      
      // Pe iOS/Android, trebuie făcute verificări speciale pentru dispozitivul real
      if (Capacitor.isNativePlatform()) {
        // În versiunea viitoare se poate adăuga un plugin dedicat pentru baterie
        return 100;
      }

      // Valoare implicită
      return 100;
    } catch (error) {
      console.warn('Nu se poate obține nivelul bateriei:', error);
      return 100; // Valoare implicită
    }
  },
  
  // Obținerea direcției/headingului dispozitivului
  getHeading: async (): Promise<number> => {
    try {
      // Pentru dispozitive native, încercăm să folosim senzori specifici
      if (Capacitor.isNativePlatform()) {
        // În viitor se poate adăuga un plugin dedicat pentru compas/direcție
        // Deocamdată, folosim ultima direcție cunoscută din geolocation dacă e disponibilă
        return 0; // Valoare implicită pentru dezvoltare
      }
      
      // Pentru browser, folosim API-ul DeviceOrientation dacă e disponibil
      if (window.DeviceOrientationEvent) {
        return new Promise((resolve) => {
          // Încercăm să obținem o singură citire
          const handleOrientation = (event: DeviceOrientationEvent) => {
            // alpha: direcție (0-360)
            const heading = event.alpha || 0;
            window.removeEventListener('deviceorientation', handleOrientation);
            resolve(Math.round(heading));
          };
          
          // Setăm un timeout în caz că nu primim evenimente
          setTimeout(() => {
            window.removeEventListener('deviceorientation', handleOrientation);
            resolve(0);
          }, 1000);
          
          window.addEventListener('deviceorientation', handleOrientation, { once: true });
        });
      }
      
      // Valoare implicită dacă nu avem acces la senzori
      return 0;
    } catch (error) {
      console.warn('Nu se poate obține direcția/heading:', error);
      return 0; // Valoare implicită
    }
  },
  // Cererea de permisiuni pentru locație
  requestPermissions: async () => {
    if (!isNativePlatform()) {
      return navigator.permissions.query({ name: 'geolocation' });
    }
    
    return await Geolocation.requestPermissions();
  },
  
  // Obținerea poziției curente
  getCurrentPosition: async (options?: PositionOptions): Promise<Position> => {
    if (!isNativePlatform()) {
      // Folosim navigatorul browser pentru web
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const position: Position = {
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: pos.coords.altitude,
                altitudeAccuracy: pos.coords.altitudeAccuracy,
                heading: pos.coords.heading,
                speed: pos.coords.speed
              },
              timestamp: pos.timestamp
            };
            resolve(position);
          },
          (error) => {
            console.error('Eroare la getCurrentPosition:', error);
            
            // Adăugăm informații despre eroare pentru depanare mai bună
            if (error instanceof GeolocationPositionError) {
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  console.warn('GPS Error: Utilizatorul a refuzat permisiunea de geolocalizare');
                  break;
                case error.POSITION_UNAVAILABLE:
                  console.warn('GPS Error: Poziția nu este disponibilă în acest moment');
                  break;
                case error.TIMEOUT:
                  console.warn('GPS Error: Timp expirat pentru obținerea poziției');
                  break;
                default:
                  console.warn('GPS Error: Eroare necunoscută', error.message);
              }
            }
            
            reject(error);
          },
          {
            enableHighAccuracy: options?.enableHighAccuracy !== undefined ? options.enableHighAccuracy : true,
            timeout: options?.timeout || 30000, // Mărim timeout-ul la 30 secunde
            maximumAge: options?.maximumAge || 10000 // Acceptăm poziții cu vechimea de până la 10 secunde
          }
        );
      });
    }
    
    // Folosim Capacitor pentru platforme native
    return await Geolocation.getCurrentPosition(options);
  },
  
  // Urmărirea poziției (watch)
  watchPosition: (callback: (position: Position) => void, options?: PositionOptions) => {
    // Verificăm dacă funcția callback este validă
    if (!callback || typeof callback !== 'function') {
      console.error('Eroare: callback invalid pentru watchPosition');
      return {
        watchId: null,
        clearWatch: () => console.log('Nicio urmărire de anulat - callback invalid')
      };
    }
    
    // Folosim un wrapper pentru callback pentru a capta erorile
    const safeCallback = (pos: Position) => {
      try {
        callback(pos);
      } catch (callbackError) {
        console.error('Eroare în callback-ul watchPosition:', callbackError);
      }
    };
    
    // Opțiuni GPS sigure
    const safeOptions = {
      enableHighAccuracy: options?.enableHighAccuracy !== undefined ? options.enableHighAccuracy : true,
      timeout: options?.timeout || 30000, // 30 secunde timeout
      maximumAge: options?.maximumAge || 10000 // 10 secunde vechime maximă
    };
    
    // Gestionează erorile GPS într-un mod sigur
    const handleError = (error: any) => {
      console.error('Eroare la watchPosition:', error);
      
      // Adăugăm informații despre eroare pentru o depanare mai bună
      if (error instanceof GeolocationPositionError) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            console.warn('GPS Error: Utilizatorul a refuzat permisiunea de geolocalizare');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('GPS Error: Poziția nu este disponibilă în acest moment');
            break;
          case error.TIMEOUT:
            console.warn('GPS Error: Timp expirat pentru obținerea poziției');
            break;
          default:
            console.warn('GPS Error: Eroare necunoscută', error.message);
        }
      }
    };
    
    if (!isNativePlatform()) {
      try {
        // Verificăm dacă API-ul de geolocalizare este disponibil în browser
        if (!navigator.geolocation) {
          console.error('Geolocalizarea nu este suportată de acest browser');
          return {
            watchId: null,
            clearWatch: () => console.log('Nicio urmărire de anulat - geolocation indisponibil')
          };
        }
        
        // Folosim navigatorul browser pentru web
        console.log('Inițializare urmărire poziție în browser');
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            try {
              const position: Position = {
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  altitude: pos.coords.altitude,
                  altitudeAccuracy: pos.coords.altitudeAccuracy,
                  heading: pos.coords.heading,
                  speed: pos.coords.speed
                },
                timestamp: pos.timestamp
              };
              safeCallback(position);
            } catch (posConversionError) {
              console.error('Eroare la conversia poziției:', posConversionError);
            }
          },
          handleError,
          safeOptions
        );
        
        console.log('Urmărire GPS browser inițiată cu ID:', watchId);
        
        return {
          watchId,
          clearWatch: () => {
            try {
              navigator.geolocation.clearWatch(watchId);
              console.log('Urmărire GPS browser oprită cu succes');
            } catch (clearError) {
              console.error('Eroare la oprirea urmăririi GPS browser:', clearError);
            }
          }
        };
      } catch (browserError) {
        console.error('Eroare la inițializarea urmăririi GPS browser:', browserError);
        return {
          watchId: null,
          clearWatch: () => console.log('Nicio urmărire de anulat - eroare la inițializare browser')
        };
      }
    }
    
    // Pentru platformele native (Android/iOS), folosim API-urile Capacitor
    console.log('Inițializare urmărire poziție pe platformă nativă');
    
    const startWatch = async () => {
      try {
        console.log('Verificare permisiuni GPS înainte de urmărire');
        
        try {
          const permStatus = await Geolocation.checkPermissions();
          console.log('Status permisiuni GPS pentru urmărire:', permStatus.location);
          
          if (permStatus.location !== 'granted') {
            console.warn('Permisiunile GPS nu sunt acordate pentru urmărire. Solicităm explicit.');
            
            const requestResult = await Promise.race([
              Geolocation.requestPermissions(),
              new Promise<any>(resolve => {
                setTimeout(() => {
                  console.log('Timeout la solicitarea permisiunilor pentru urmărire');
                  resolve({ location: 'timeout' });
                }, 5000);
              })
            ]);
            
            console.log('Rezultat solicitare permisiuni pentru urmărire:', requestResult.location);
            
            if (requestResult.location !== 'granted') {
              console.warn('Utilizatorul nu a acordat permisiunile GPS necesare pentru urmărire');
              // Continuăm totuși, dar ar putea eșua. Utilizatorul va vedea un avertisment în UI.
            }
          }
        } catch (permError) {
          console.error('Eroare la verificarea/solicitarea permisiunilor:', permError);
          // Continuăm oricum pentru a nu bloca utilizatorul
        }
        
        const defaultOptions = {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000
        };
        
        console.log('Pornire urmărire poziție Capacitor cu opțiuni:', JSON.stringify(options || defaultOptions));
        
        // Adăugăm un timeout pentru a evita blocarea în cazul unei erori în Capacitor.watchPosition
        const watchPromise = Geolocation.watchPosition(options || defaultOptions, (position) => {
          try {
            if (position) {
              console.log('Poziție GPS primită în Capacitor');
              safeCallback(position);
            } else {
              console.warn('Poziție invalidă primită în urmărirea Capacitor');
            }
          } catch (posError) {
            console.error('Eroare la procesarea poziției în Capacitor:', posError);
          }
        });
        
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('Timeout la inițializarea urmăririi Capacitor');
            resolve(null);
          }, 5000);
        });
        
        const watchId = await Promise.race([watchPromise, timeoutPromise]);
        
        if (watchId === null) {
          console.error('Nu s-a putut inițializa urmărirea GPS în Capacitor');
          return {
            watchId: null,
            clearWatch: () => console.log('Nicio urmărire de anulat - timeout la inițializare')
          };
        }
        
        console.log('Urmărire GPS Capacitor inițiată cu succes, ID:', watchId);
        
        return {
          watchId,
          clearWatch: () => {
            try {
              Geolocation.clearWatch({ id: watchId });
              console.log('Urmărire GPS Capacitor oprită cu succes');
            } catch (clearError) {
              console.error('Eroare la oprirea urmăririi GPS Capacitor:', clearError);
            }
          }
        };
      } catch (capacitorError) {
        console.error('Eroare la inițializarea urmăririi GPS Capacitor:', capacitorError);
        return {
          watchId: null,
          clearWatch: () => console.log('Nicio urmărire de anulat - eroare Capacitor')
        };
      }
    };
    
    // Returnam promisiunea, dar adăugăm un tratament pentru excepții neașteptate
    try {
      return startWatch();
    } catch (unexpectedError) {
      console.error('Eroare neașteptată la pornirea urmăririi GPS:', unexpectedError);
      return {
        watchId: null,
        clearWatch: () => console.log('Nicio urmărire de anulat - eroare neașteptată')
      };
    }
  }
};

// Functie pentru convertirea obiectelor de poziție
export const convertGeolocationPosition = (position: GeolocationPosition): Position => {
  return {
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || null,
      altitudeAccuracy: position.coords.altitudeAccuracy || null,
      heading: position.coords.heading || null,
      speed: position.coords.speed || null
    },
    timestamp: position.timestamp
  };
};