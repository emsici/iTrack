import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Login } from "@shared/schema";
import { loginUser, getVehicleInfo } from "@/lib/auth";

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
      
      // Folosim funcția din lib/auth.ts pentru autentificare uniformă
      const result = await loginUser(credentials);
      
      console.log("Rezultat autentificare:", result);
      
      if (result.success && result.token) {
        // Autentificare reușită
        setToken(result.token);
        setUserInfo({ email: credentials.email });
        setIsAuthenticated(true);
        
        // Store in localStorage
        localStorage.setItem("auth_token", result.token);
        localStorage.setItem("user_info", JSON.stringify({ email: credentials.email }));
        
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
        
        if (data && data.status === "success") {
          // Actualizăm informațiile vehiculului local
          const vehicleData = {
            nr: registrationNumber,  // Folosim numărul de înmatriculare furnizat
            uit: data.uit || "",
            start_locatie: data.start_locatie || "",
            stop_locatie: data.stop_locatie || ""
          };
          
          setVehicleInfo(vehicleData);
          setHasVehicle(true);
          
          // Actualizăm localStorage
          localStorage.setItem("vehicle_info", JSON.stringify(vehicleData));
          
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
