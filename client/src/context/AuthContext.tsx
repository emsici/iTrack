import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Login } from "@shared/schema";
import { loginUser, getVehicleInfo, isValidToken, isTokenExpired, decodeToken } from "@/lib/auth";
import { Capacitor } from "@capacitor/core";
import { Http } from "@capacitor-community/http";
import { setGpsAccessControl } from "@/lib/transportService";
import { setSyncEnabled } from "@/lib/connectivityService";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  hasVehicle: boolean;
  userInfo: {
    email: string;
  } | null;
  vehicleInfo: {
    nr: string;
    uit: string;
    start_locatie: string;
    stop_locatie: string;
    allTransports?: Array<{
      uit: string;
      start_locatie: string;
      stop_locatie: string;
      ikRoTrans?: number;
      dataTransport?: string;
    }>;
  } | null;
  login: (credentials: Login) => Promise<boolean>;
  registerVehicle: (registrationNumber: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string } | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<{
    nr: string;
    uit: string;
    start_locatie: string;
    stop_locatie: string;
    allTransports?: Array<{
      uit: string;
      start_locatie: string;
      stop_locatie: string;
      ikRoTrans?: number;
      dataTransport?: string;
    }>;
  } | null>(null);
  const { toast } = useToast();

  // Funcție pentru a salva starea sesiunii
  const saveSessionState = (tokenValue: string, userInfoValue: any, vehicleInfoValue: any) => {
    try {
      console.log("Salvez starea sesiunii în stocare permanentă");
      
      // Memorăm token-ul și informațiile conexe
      localStorage.setItem("auth_token", tokenValue);
      
      if (userInfoValue) {
        localStorage.setItem("user_info", JSON.stringify(userInfoValue));
      }
      
      if (vehicleInfoValue) {
        localStorage.setItem("vehicle_info", JSON.stringify(vehicleInfoValue));
      }
      
      // Pentru aplicații native, adăugăm date și în sessionStorage ca backup
      if (Capacitor.isNativePlatform()) {
        console.log("Salvare backup în sessionStorage pentru dispozitiv nativ");
        sessionStorage.setItem("auth_token", tokenValue);
        
        if (userInfoValue) {
          sessionStorage.setItem("user_info", JSON.stringify(userInfoValue));
        }
        
        if (vehicleInfoValue) {
          sessionStorage.setItem("vehicle_info", JSON.stringify(vehicleInfoValue));
        }
      }
    } catch (error) {
      console.error("Eroare la salvarea stării sesiunii:", error);
    }
  };
  
  // Check for existing session on mount
  useEffect(() => {
    try {
      console.log("Verificare sesiune existentă la pornirea aplicației");
      
      // Folosim localStorage ca sursă primară
      let storedToken = localStorage.getItem("auth_token");
      let storedUserInfo = localStorage.getItem("user_info");
      let storedVehicleInfo = localStorage.getItem("vehicle_info");
      
      // Pe dispozitive native, verificăm și sessionStorage dacă localStorage e gol
      if (Capacitor.isNativePlatform() && !storedToken) {
        console.log("Pe dispozitiv nativ, verificăm și backup-ul din sessionStorage");
        storedToken = sessionStorage.getItem("auth_token");
        storedUserInfo = sessionStorage.getItem("user_info");
        storedVehicleInfo = sessionStorage.getItem("vehicle_info");
      }
      
      if (storedToken) {
        // Verificare token expirat
        if (isTokenExpired(storedToken)) {
          console.log("Token expirat, ștergem sesiunea");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_info");
          localStorage.removeItem("vehicle_info");
          sessionStorage.removeItem("auth_token");
          sessionStorage.removeItem("user_info");
          sessionStorage.removeItem("vehicle_info");
          
          // Actualizăm controlul de acces GPS
          setGpsAccessControl(false, false);
          
          return;
        }
        
        console.log("Sesiune găsită, restaurez starea autentificării");
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // Actualizăm controlul de acces GPS - utilizator autentificat, transport încă necunoscut
        setGpsAccessControl(true, false);
        
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
        
        if (storedVehicleInfo) {
          setVehicleInfo(JSON.parse(storedVehicleInfo));
          setHasVehicle(true);
        }
      } else {
        console.log("Nu s-a găsit nicio sesiune salvată");
        
        // Actualizăm controlul de acces GPS - utilizator neautentificat
        setGpsAccessControl(false, false);
      }
    } catch (error) {
      console.error("Eroare la restaurarea sesiunii:", error);
      // În caz de eroare, ștergem datele potențial corupte
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("vehicle_info");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_info");
      sessionStorage.removeItem("vehicle_info");
    }
  }, []);

  const login = async (credentials: Login): Promise<boolean> => {
    try {
      console.log("Încercare de autentificare cu:", credentials);
      
      // Verificare specială pentru utilizatorul admin (pagina de loguri)
      if (credentials.email === 'admin@itrack.app' && credentials.password === 'admin123') {
        console.log("Credențiale admin detectate - autentificare specială pentru admin");
        return false; // Returnăm false pentru ca pagina LogViewerPage să gestioneze autentificarea local
      }
      
      // Verificăm dacă acest utilizator este ultimul care a fost logat
      // pentru a decide dacă păstrăm datele GPS stocate sau le ștergem
      const lastLoggedUser = localStorage.getItem("last_logged_user");
      const isSameUser = lastLoggedUser === credentials.email;
      
      console.log("Verificare utilizator anterior:", 
        isSameUser ? "Este același utilizator, păstrăm datele GPS" : "Utilizator diferit, vom șterge datele GPS vechi");
      
      // Dacă nu este același utilizator, ștergem datele GPS din localStorage
      if (!isSameUser) {
        console.log("Ștergem datele GPS ale utilizatorului anterior");
        localStorage.removeItem("itrack_offline_gps_data");
      } else {
        // Dacă este același utilizator, activăm sincronizarea automată a datelor GPS
        console.log("Activăm sincronizarea automată pentru utilizatorul care se reconectează");
        setSyncEnabled(true);
      }
      
      // Folosim funcția din lib/auth.ts pentru autentificare uniformă
      const result = await loginUser(credentials);
      
      console.log("Rezultat autentificare:", result);
      
      if (result.success && result.token) {
        // Autentificare reușită
        setToken(result.token);
        setUserInfo({ email: credentials.email });
        setIsAuthenticated(true);
        
        // Actualizăm controlul de acces GPS pentru utilizator autentificat
        setGpsAccessControl(true, false);
        
        // Activăm sincronizarea pentru datele GPS stocate
        setSyncEnabled(true);
        
        // Folosim funcția noastră pentru a salva sesiunea în toate tipurile de stocare
        saveSessionState(
          result.token, 
          { email: credentials.email },
          null // Vehicleinfo va fi adăugat după ce obținem informațiile vehiculului
        );
        
        // Actualizăm și înregistrarea ultimului utilizator logat
        localStorage.setItem("last_logged_user", credentials.email);
        
        toast({
          title: "Autentificare reușită",
          description: "Bine ai venit!",
        });
        return true;
      } else {
        // Autentificare eșuată
        toast({
          variant: "destructive",
          title: "Autentificare eșuată",
          description: result.message || "Credențiale incorecte",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Eroare de autentificare",
        description: "Nu s-a putut contacta serverul. Verificați conexiunea la internet.",
      });
      return false;
    }
  };

  const registerVehicle = async (registrationNumber: string): Promise<boolean> => {
    try {
      console.log("Încercare de înregistrare vehicul:", registrationNumber);
      
      // Verificăm dacă avem un token valid
      if (!token) {
        console.error("Nu există token de autentificare pentru actualizarea vehiculului");
        toast({
          variant: "destructive",
          title: "Eroare de autentificare",
          description: "Sesiunea de autentificare a expirat. Reconectați-vă."
        });
        return false;
      }
      
      // Obținem token-ul actualizat din localStorage pentru a ne asigura că folosim cea mai recentă versiune
      const currentToken = localStorage.getItem("auth_token") || token;
      
      // Verificăm dacă token-ul conține "exp" pentru a detecta expirarea
      if (currentToken) {
        try {
          const tokenParts = currentToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const exp = payload.exp;
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (exp && exp < currentTime) {
              console.error("Token expirat, exp:", exp, "currentTime:", currentTime);
              toast({
                variant: "destructive",
                title: "Sesiune expirată",
                description: "Sesiunea dumneavoastră a expirat. Vă rugăm să vă autentificați din nou."
              });
              
              // Deconectăm utilizatorul
              logout();
              return false;
            }
          }
        } catch (e) {
          console.error("Eroare la decodarea token-ului:", e);
        }
      }
      
      try {
        // Folosim funcția din lib/auth.ts pentru a obține informații despre vehicul
        const data = await getVehicleInfo(registrationNumber, currentToken);
        
        console.log("Răspuns date vehicul:", data);
        
        // Verificăm dacă avem date valide (fie în noul format, fie în cel vechi)
        if (data && (data.uit || data.UIT)) {
          // Actualizăm informațiile vehiculului local cu datele din răspuns
          const vehicleData = {
            nr: registrationNumber,  // Folosim numărul de înmatriculare furnizat
            uit: data.uit || data.UIT || "",
            start_locatie: data.start_locatie || "",
            stop_locatie: data.stop_locatie || "",
            // Adăugăm și alte informații din răspuns dacă există
            codDeclarant: data.codDeclarant,
            denumireCui: data.denumireCui,
            dataTransport: data.dataTransport,
            ikRoTrans: data.ikRoTrans
          };
          
          setVehicleInfo(vehicleData);
          setHasVehicle(true);
          
          // Folosim funcția noastră pentru a salva în toate locurile
          saveSessionState(token, userInfo, vehicleData);
          
          toast({
            title: "Vehicul actualizat",
            description: `Vehicul ${registrationNumber} actualizat cu succes!`,
          });
          return true;
        } else {
          toast({
            variant: "destructive",
            title: "Actualizare eșuată",
            description: "Numărul de înmatriculare nu este valid sau nu există în sistem.",
          });
          return false;
        }
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error("Eroare la actualizarea vehiculului:", error);
      
      const errorMessage = (error as Error).message || "Nu s-a putut actualiza vehiculul";
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: errorMessage.includes("Token") 
          ? "Sesiunea a expirat. Reconectați-vă." 
          : "Nu s-a putut actualiza vehiculul. Verificați conexiunea la internet."
      });
      
      // Dacă avem o eroare de token, deconectăm utilizatorul
      if (errorMessage.includes("Token")) {
        logout();
      }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      // Dezactivăm sincronizarea automată a datelor GPS offline la logout
      // Acest lucru previne trimiterea datelor când utilizatorul nu este autentificat
      setSyncEnabled(false);
      
      // Dacă avem token, trimitem request de logout către API-ul extern
      if (token && Capacitor.isNativePlatform()) {
        const logoutApiUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/logout.php";
        console.log("Trimit cerere de logout către API extern:", logoutApiUrl);
        
        // Folosim format JSON raw ca la autentificare
        const rawData = JSON.stringify({
          "logout": true
        });
        
        try {
          // Pentru dispozitive native folosim HTTP plugin
          const response = await Http.request({
            method: 'POST',
            url: logoutApiUrl,
            data: rawData,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token.startsWith("Bearer ") ? token : `Bearer ${token}`
            },
            params: {} as any
          });
          
          console.log("Răspuns logout de la API extern:", response.status, response.data);
        } catch (error) {
          console.error("Eroare la logout API extern:", error);
          // Continuăm cu logout local chiar dacă API-ul extern eșuează
        }
      }
    } catch (error) {
      console.error("Eroare la procesul de logout:", error);
    } finally {
      // Oprim sincronizarea, dar PĂSTRĂM datele GPS în storage pentru o eventuală reconectare
      // Salvăm email-ul utilizatorului înainte de logout pentru a-l putea verifica la login ulterior
      const currentUserEmail = userInfo?.email;
      if (currentUserEmail) {
        localStorage.setItem("last_logged_user", currentUserEmail);
        console.log("Salvat ultimul utilizator logat pentru verificare la reconectare:", currentUserEmail);
      }
      
      // Indiferent de rezultatul API-ului, curățăm starea locală
      setToken(null);
      setIsAuthenticated(false);
      setUserInfo(null);
      setVehicleInfo(null);
      setHasVehicle(false);
      
      // Actualizăm controlul de acces GPS - utilizator deautentificat
      setGpsAccessControl(false, false);
      
      // Ștergem toate datele de sesiune din toate locațiile posibile
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("vehicle_info");
      
      // Ștergem și din sessionStorage pentru dispozitive native
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_info");
      sessionStorage.removeItem("vehicle_info");
      
      // Ștergem și starea transportului din localStorage dacă există
      if (vehicleInfo?.nr) {
        localStorage.removeItem(`transport_state_${vehicleInfo.nr}`);
        console.log("Stare transport ștearsă din localStorage la deconectare");
      }
      
      toast({
        title: "Deconectare reușită",
        description: "Ați fost deconectat cu succes.",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        hasVehicle,
        userInfo,
        vehicleInfo,
        login,
        registerVehicle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
