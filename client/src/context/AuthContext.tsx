import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Login } from "@shared/schema";
import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';

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
  } | null>(null);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUserInfo = localStorage.getItem("user_info");
    const storedVehicleInfo = localStorage.getItem("vehicle_info");

    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
      if (storedVehicleInfo) {
        setVehicleInfo(JSON.parse(storedVehicleInfo));
        setHasVehicle(true);
      }
    }
  }, []);

  const login = async (credentials: Login): Promise<boolean> => {
    try {
      console.log("Încercare de autentificare cu:", credentials);
      
      // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
      const isNative = Capacitor.isNativePlatform();
      
      // URL-ul API extern
      const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php";
      
      // În browser, folosim proxy-ul
      const apiUrl = "/api/login";
      
      console.log("Folosim URL API:", isNative ? apiExternUrl : apiUrl, "isNative:", isNative);
      
      let data;
      
      if (isNative) {
        // Pe dispozitiv nativ folosim plugin-ul @capacitor-community/http pentru a evita problemele CORS
        console.log("Folosim Capacitor HTTP plugin pentru login");
        
        try {
          const httpResponse = await Http.request({
            method: 'POST',
            url: apiExternUrl,
            data: {
              email: credentials.email,
              password: credentials.password
            }
          });
          
          console.log("Status răspuns Capacitor HTTP:", httpResponse.status);
          console.log("Răspuns date:", JSON.stringify(httpResponse.data));
          
          if (httpResponse.status >= 200 && httpResponse.status < 300) {
            data = httpResponse.data;
          } else {
            throw new Error(`Eroare la autentificare: ${httpResponse.status}`);
          }
        } catch (capacitorError) {
          console.error("Eroare plugin Capacitor HTTP:", capacitorError);
          throw capacitorError;
        }
      } else {
        // În browser, folosim fetch normal
        const requestOptions: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          })
        };
        
        const response = await fetch(apiUrl, requestOptions);
        data = await response.json();
      }
      
      console.log("Răspuns autentificare:", data);

      if (data.status === "success" && data.token) {
        setToken(data.token);
        setUserInfo({ email: credentials.email });
        setIsAuthenticated(true);
        
        // Store in localStorage
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_info", JSON.stringify({ email: credentials.email }));
        
        toast({
          title: "Autentificare reușită",
          description: "Bine ai venit!",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Autentificare eșuată",
          description: "Email sau parolă incorecte.",
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
      
      // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
      const isNative = Capacitor.isNativePlatform();
      
      // În aplicația nativă folosim URL-ul direct, în browser folosim proxy-ul
      const apiUrl = isNative
        ? `https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`
        : `/api/vehicle?nr=${registrationNumber}`;
      
      console.log("Folosim URL API vehicul:", apiUrl, "isNative:", isNative);
      
      // Obținem token-ul actualizat din localStorage pentru a ne asigura că folosim cea mai recentă versiune
      const currentToken = localStorage.getItem("auth_token") || token;
      console.log("Folosim token de autorizare:", currentToken ? "Token valid" : "Token lipsă");
      
      let data;
      
      if (isNative) {
        // Pe dispozitiv nativ folosim plugin-ul @capacitor-community/http pentru a evita problemele CORS
        try {
          const httpResponse = await Http.request({
            method: 'GET',
            url: apiUrl,
            headers: {
              "Authorization": `Bearer ${currentToken}`
            }
          });
          
          console.log("Status răspuns Capacitor HTTP (vehicul):", httpResponse.status);
          
          if (httpResponse.status >= 200 && httpResponse.status < 300) {
            data = httpResponse.data;
          } else {
            throw new Error(`Eroare la obținerea informațiilor vehiculului: ${httpResponse.status}`);
          }
        } catch (capacitorError) {
          console.error("Eroare plugin Capacitor HTTP (vehicul):", capacitorError);
          throw capacitorError;
        }
      } else {
        // În browser folosim fetch normal
        console.log("Trimit cerere către server cu token:", !!currentToken);
        
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${currentToken}`
          }
        });
        
        console.log("Status răspuns HTTP:", response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Token invalid sau expirat. Reconectați-vă.");
          }
          throw new Error(`Răspuns server: ${response.status} ${response.statusText}`);
        }
        
        // Verificăm tipul de conținut pentru a evita erori de parsare
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const textResponse = await response.text();
          console.error("Răspunsul nu este în format JSON:", textResponse);
          throw new Error("Răspunsul de la server nu este în formatul așteptat");
        }
      }

      console.log("Răspuns date vehicul:", data);

      if (data && data.status === "success") {
        // Actualizăm informațiile vehiculului local
        setVehicleInfo({
          nr: registrationNumber,  // Folosim numărul de înmatriculare furnizat
          uit: data.uit || "",
          start_locatie: data.start_locatie || "",
          stop_locatie: data.stop_locatie || ""
        });
        setHasVehicle(true);
        
        // Actualizăm localStorage
        localStorage.setItem("vehicle_info", JSON.stringify({
          nr: registrationNumber,
          uit: data.uit || "",
          start_locatie: data.start_locatie || "",
          stop_locatie: data.stop_locatie || ""
        }));
        
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

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setUserInfo(null);
    setVehicleInfo(null);
    setHasVehicle(false);
    
    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("vehicle_info");
    
    toast({
      title: "Deconectare reușită",
      description: "Ați fost deconectat cu succes.",
    });
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
