import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { TransportProvider } from "@/context/TransportContext";
import LoginPage from "@/pages/LoginPage";
import VehicleInputPage from "@/pages/VehicleInputPage";
import TransportPage from "@/pages/TransportPage";
import LogViewerPage from "@/pages/LogViewerPage";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { requestGpsPermissions, isNativePlatform, CapacitorGeoService } from "@/lib/capacitorService";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import "@/lib/autoGpsTransmission";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setupConsoleInterceptor, addLog } from "@/lib/logService";
import "@/lib/directGpsTest";
import "@/lib/simpleGpsService";
import "@/lib/gpsIntervalService";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/vehicle" component={VehicleInputPage} />
      <Route path="/transport" component={TransportPage} />
      <Route path="/admin/logs" component={LogViewerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  
  // Inițializăm interceptorul pentru console.log și alte mesaje
  useEffect(() => {
    // Configurăm interceptorul pentru consolă
    setupConsoleInterceptor();
    
    // Adăugăm un log de pornire a aplicației
    addLog('Aplicație pornită', 'info', 'system', {
      platform: isNativePlatform() ? Capacitor.getPlatform() : 'browser',
      timestamp: new Date().toISOString()
    });
    
    return () => {
      // Adăugăm un log de închidere a aplicației
      addLog('Aplicație închisă', 'info', 'system');
    };
  }, []);
  
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
      // Solicităm permisiunile indiferent dacă le-am solicitat anterior
      // Acest lucru asigură că pe dispozitivele reale cererea este făcută la fiecare pornire
      if (isNativePlatform()) {
        console.log("Solicitare permisiuni GPS la pornirea aplicației...");
        
        // Pe Android afișăm dialogul personalizat, pe iOS cerem direct permisiunile
        try {
          // Nu mai verificăm starea permisiunilor, forțăm cererea lor
          console.log("Forțăm cererea permisiunilor la pornirea aplicației");
          
          // Pentru device-uri reale, vrem să cerem permisiunile la fiecare pornire
          // până când sunt acordate, astfel încât aplicația să funcționeze corect
          
          // Altfel, solicităm permisiunile în funcție de platformă
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
    
    // Întârziem puțin solicitarea permisiunilor pentru a permite aplicației să se încarce complet
    const timer = setTimeout(() => {
      requestPermissions();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
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
              <DialogTitle>Activare serviciu de locație</DialogTitle>
              <DialogDescription>
                Aplicația iTrack necesită activarea serviciului de locație pentru a urmări transporturile. 
                Fără acces la locație, aplicația nu va putea înregistra traseul parcurs.
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
                Activează locația
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TransportProvider>
    </AuthProvider>
  );
}

export default App;
