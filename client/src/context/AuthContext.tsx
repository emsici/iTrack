import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Login } from "@shared/schema";

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
      
      // Folosim proxy-ul nostru pentru a evita probleme de CORS
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      const data = await response.json();
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
      
      // Folosim proxy-ul nostru pentru a evita probleme de CORS
      const response = await fetch(
        `/api/vehicle/${registrationNumber}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setVehicleInfo(data);
        setHasVehicle(true);
        
        // Store in localStorage
        localStorage.setItem("vehicle_info", JSON.stringify(data));
        
        toast({
          title: "Vehicul înregistrat",
          description: `Vehicul ${data.nr} înregistrat cu succes!`,
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Înregistrare eșuată",
          description: "Numărul de înmatriculare nu este valid sau nu există în sistem.",
        });
        return false;
      }
    } catch (error) {
      console.error("Vehicle registration error:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut înregistra vehiculul. Verificați conexiunea la internet.",
      });
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
