import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { TransportProvider } from "@/context/TransportContext";
import LoginPage from "@/pages/LoginPage";
import VehicleInputPage from "@/pages/VehicleInputPage";
import TransportPage from "@/pages/TransportPage";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { requestGpsPermissions, isNativePlatform } from "@/lib/capacitorService";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/vehicle" component={VehicleInputPage} />
      <Route path="/transport" component={TransportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  
  // Solicită permisiunile GPS la pornirea aplicației, dar doar pe platforme native (Android/iOS)
  useEffect(() => {
    const requestPermissions = async () => {
      if (isNativePlatform() && !permissionsRequested) {
        console.log("Solicitare permisiuni GPS la pornirea aplicației...");
        try {
          const result = await requestGpsPermissions();
          setPermissionsRequested(true);
          
          if (result) {
            console.log("Permisiuni GPS acordate cu succes");
          } else {
            console.warn("Permisiunile GPS au fost refuzate sau au eșuat");
            // Afișăm un mesaj pentru utilizator despre importanța permisiunilor GPS
            toast({
              title: "Permisiuni GPS necesare",
              description: "Pentru a utiliza aplicația, vă rugăm să activați localizarea și să acordați permisiuni de acces la locație.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Eroare la solicitarea permisiunilor GPS:", error);
        }
      }
    };
    
    requestPermissions();
  }, [toast, permissionsRequested]);

  return (
    <AuthProvider>
      <TransportProvider>
        <Router />
        <Toaster position="bottom" />
      </TransportProvider>
    </AuthProvider>
  );
}

export default App;
