import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { TransportProvider } from "@/context/TransportContext";
import LoginPage from "@/pages/LoginPage";
import VehicleInputPage from "@/pages/VehicleInputPage";
import TransportPage from "@/pages/TransportPage";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { requestGpsPermissions, isNativePlatform, CapacitorGeoService } from "@/lib/capacitorService";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  
  // Verificăm dacă permisiunile au fost cerute anterior
  useEffect(() => {
    try {
      const permChecked = localStorage.getItem('permissions_requested');
      if (permChecked === 'true') {
        setPermissionsRequested(true);
      }
    } catch (e) {
      console.error("Eroare la verificarea stării permisiunilor:", e);
    }
  }, []);
  
  // Solicită permisiunile GPS la pornirea aplicației, dar doar pe platforme native (Android/iOS)
  useEffect(() => {
    const requestPermissions = async () => {
      // Solicităm permisiunile doar dacă suntem pe platformă nativă și nu le-am solicitat anterior
      if (isNativePlatform() && !permissionsRequested) {
        console.log("Solicitare permisiuni GPS la pornirea aplicației...");
        
        // Verificăm dacă suntem pe Android și afișăm dialogul personalizat
        // sau cerem direct permisiunile pe iOS
        try {
          if (Capacitor.getPlatform() === 'android') {
            setShowPermissionsDialog(true);
          } else {
            // Pe iOS cerem direct permisiunile
            requestGpsPermissionsNow();
          }
        } catch (error) {
          console.error("Eroare la verificarea platformei:", error);
          // Încercăm oricum să cerem permisiunile
          requestGpsPermissionsNow(); 
        }
      }
    };
    
    requestPermissions();
  }, [toast, permissionsRequested]);
  
  // Funcție pentru solicitarea efectivă a permisiunilor
  const requestGpsPermissionsNow = async () => {
    try {
      const result = await requestGpsPermissions();
      
      // Marcăm că am solicitat permisiunile
      setPermissionsRequested(true);
      localStorage.setItem('permissions_requested', 'true');
      setShowPermissionsDialog(false);
      
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
      setShowPermissionsDialog(false);
    }
  };

  return (
    <AuthProvider>
      <TransportProvider>
        <Router />
        <Toaster position="bottom" />
        
        {/* Dialog de confirmare pentru permisiuni GPS */}
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Permisiuni de localizare</DialogTitle>
              <DialogDescription>
                Aplicația iTrack necesită acces la locația dvs. pentru a urmări transporturile și a transmite 
                coordonatele GPS. Veți avea control deplin asupra momentului în care GPS-ul este activ.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Acordarea permisiunilor de localizare este necesară pentru:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Urmărirea traseului în timpul transportului</li>
                  <li>Calcularea distanței parcurse și a vitezei</li>
                  <li>Înregistrarea cu precizie a rutei</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> GPS-ul va fi activ <strong>doar</strong> când porniți 
                  o cursă și se va opri automat la finalizare sau pauză.
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPermissionsRequested(true);
                  localStorage.setItem('permissions_requested', 'true');
                  setShowPermissionsDialog(false);
                }}
              >
                Mai târziu
              </Button>
              <Button 
                onClick={requestGpsPermissionsNow}
                className="bg-green-600 hover:bg-green-700"
              >
                Activează GPS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TransportProvider>
    </AuthProvider>
  );
}

export default App;
