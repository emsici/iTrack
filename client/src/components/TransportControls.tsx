import { useState, useEffect, useRef } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Check, AlertTriangle, Truck, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { isTransportActive, forceTransportActive } from "@/lib/transportHelper";
import { useForceTransportActive } from "@/hooks/useForceTransportActive";

// Interfață pentru un transport
interface Transport {
  id: string;
  uit: string;
  start_locatie: string;
  stop_locatie: string;
  status: "inactive" | "active" | "paused" | "finished";
  isTracking: boolean;
}

export default function TransportControls() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [battery, setBattery] = useState(100);
  const transportIdRef = useRef<string>("");
  const { 
    transportStatus, 
    selectedUits,
    currentActiveUit, 
    startTransport, 
    pauseTransport, 
    resumeTransport, 
    finishTransport,
    isGpsActive,
    isBackgroundActive,
  } = useTransport();
  const { vehicleInfo } = useAuth();
  
  // Activăm hook-ul pentru forțarea stării de transport activ
  // care va verifica periodic dacă transportul este activ și va forța starea activă
  useForceTransportActive(transportStatus);
  
  // Eliminată funcția pentru pornirea transportului fără GPS

  // Încarcă transporturile disponibile pentru vehicul 
  useEffect(() => {
    if (vehicleInfo && vehicleInfo.uit) {
      // Inițializează cu UIT-ul obținut la înregistrarea vehiculului
      setTransports([
        {
          id: "1",
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie,
          stop_locatie: vehicleInfo.stop_locatie,
          status: "inactive",
          isTracking: false
        }
      ]);
    }
  }, [vehicleInfo]);
  
  // Sincronizează starea transporturilor cu starea globală din context
  useEffect(() => {
    if (transports.length === 0) return;
    
    // Verificăm mai întâi localStorage pentru a asigura sincronizarea cu starea persistentă
    const localStatus = localStorage.getItem('transport_status');
    
    // Decidem ce status să folosim, prioritizând localStorage
    const effectiveStatus = localStatus || transportStatus || "inactive";
    
    console.log("[TransportControls] Sincronizare stare din localStorage și context:", {
      localStatus,
      contextStatus: transportStatus,
      effectiveStatus
    });
    
    // Actualizăm transporturile cu starea efectivă
    setTransports(prev => prev.map(transport => ({
      ...transport,
      status: effectiveStatus as "inactive" | "active" | "paused" | "finished",
      isTracking: effectiveStatus === "active" && isBackgroundActive
    })));
    
  }, [transportStatus, isBackgroundActive]);
  
  // Un efect separat pentru a verifica periodic starea din localStorage
  useEffect(() => {
    const checkStorageState = () => {
      const storedStatus = localStorage.getItem('transport_status');
      
      // Dacă starea din localStorage este "finished" dar transportStatus nu este,
      // forțăm actualizarea UI-ului
      if (storedStatus === "finished" && transportStatus !== "finished") {
        console.log("[TransportControls] Detectare diferență între localStorage și context:", {
          localStorage: storedStatus,
          context: transportStatus
        });
        
        // Actualizăm UI-ul
        setTransports(prev => prev.map(transport => ({
          ...transport,
          status: "finished",
          isTracking: false
        })));
      }
    };
    
    // Verificăm la pornire
    checkStorageState();
    
    // Și setăm un interval pentru verificări periodice
    const interval = setInterval(checkStorageState, 2000);
    return () => clearInterval(interval);
  }, [transportStatus]);

  // Helper function pentru indicator de stare
  const getStatusIndicatorClass = (status: string, isTracking: boolean) => {
    switch(status) {
      case "inactive": return "bg-gray-400";
      case "active": return isTracking ? "bg-green-500 animate-pulse" : "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "finished": return "bg-blue-500";
      default: return "bg-gray-400";
    }
  };
  
  // Obține textul de stare pentru afișare
  const getStatusText = (status: string, isTracking: boolean) => {
    switch(status) {
      case "inactive": return "Inactiv";
      case "active": return isTracking ? "Activ (GPS pornit)" : "Activ (fără GPS)";
      case "paused": return "În pauză";
      case "finished": return "Finalizat";
      default: return "Necunoscut";
    }
  };
  
  // Handler pentru pornirea unui transport
  const handleStartTransport = async (transportId: string) => {
    try {
      transportIdRef.current = transportId;
      console.log("Se începe transportul:", transportId);
      
      toast({
        title: "Se procesează...",
        description: "Se inițiază transportul, vă rugăm așteptați..."
      });
      
      // Găsim transportul curent din lista de transporturi
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      // Construim obiectul UIT pentru a-l transmite funcției startTransport
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      // Pornim transportul
      const result = await startTransport(currentUit);
      console.log("Rezultat pornire transport:", result);
      
      if (result) {
        // Actualizăm starea transportului în UI
        setTransports(prevTransports => 
          prevTransports.map(transport => 
            transport.id === transportId 
              ? { ...transport, status: "active", isTracking: true } 
              : transport
          )
        );
        
        // Forțăm starea activă
        forceTransportActive();
        
        toast({
          title: "Transport pornit",
          description: `Cursa ${currentTransport.uit} a început, coordonatele GPS sunt transmise în timp real.`
        });
      } else {
        console.error("Pornire transport eșuată");
        toast({
          variant: "destructive", 
          title: "Eroare GPS",
          description: "Nu s-a putut activa GPS-ul. Transportul nu poate fi pornit fără GPS activ."
        });
      }
    } catch (error) {
      console.error("Eroare la pornirea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la pornirea transportului. Verificați conexiunea la internet."
      });
    }
  };
  
  // Handler pentru pausarea unui transport
  const handlePauseTransport = async (transportId: string) => {
    try {
      console.log("Se pune în pauză transportul:", transportId);
      
      toast({
        title: "Se procesează...",
        description: "Se întrerupe transmisia GPS, vă rugăm așteptați..."
      });
      
      // Găsim transportul curent din lista de transporturi
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      // Construim obiectul UIT pentru a-l transmite funcției pauseTransport
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      // Apelăm funcția din context
      await pauseTransport(currentUit);
      
      // Actualizăm starea transportului în UI
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "paused", isTracking: false } 
            : transport
        )
      );
      
      toast({
        title: "Transport în pauză",
        description: `Cursa ${currentTransport.uit} a fost pusă în pauză, transmisia GPS este întreruptă.`
      });
    } catch (error) {
      console.error("Eroare la întreruperea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la întreruperea transportului."
      });
    }
  };
  
  // Handler pentru reluarea unui transport
  const handleResumeTransport = async (transportId: string) => {
    try {
      console.log("Se reia transportul:", transportId);
      
      toast({
        title: "Se procesează...",
        description: "Se reia transmisia GPS, vă rugăm așteptați..."
      });
      
      // Găsim transportul curent din lista de transporturi
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      // Construim obiectul UIT pentru a-l transmite funcției resumeTransport
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      // Apelăm funcția din context
      await resumeTransport(currentUit);
      
      // Actualizăm starea transportului în UI
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "active", isTracking: true } 
            : transport
        )
      );
      
      // Forțăm starea activă
      forceTransportActive();
      
      toast({
        title: "Transport reluat",
        description: `Cursa ${currentTransport.uit} a fost reluată, transmisia GPS este activă.`
      });
    } catch (error) {
      console.error("Eroare la reluarea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la reluarea transportului."
      });
    }
  };
  
  // Handler pentru finalizarea unui transport
  const handleFinishTransport = async (transportId: string) => {
    try {
      console.log("Se finalizează transportul:", transportId);
      
      // Găsim transportul curent din lista de transporturi
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      // Construim obiectul UIT pentru a-l transmite funcției finishTransport
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      // Marcare imediată ca "în curs de finalizare" pentru feedback vizual
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { 
                ...transport, 
                status: "finished", 
                isTracking: false 
              } 
            : transport
        )
      );
      
      // IMPORTANT: Prevenim resetarea stării imediat după finalizare
      localStorage.setItem('persist_finished_state', 'true');
      
      // Forțăm setarea statusului în localStorage înainte de a chema finishTransport
      localStorage.setItem('transport_status', 'finished');
      
      // Asigurăm că starea persistă cel puțin 10 secunde
      setTimeout(() => {
        // Verificăm din nou dacă utilizatorul a repornit deja transportul
        const currentStatus = localStorage.getItem('transport_status');
        if (currentStatus === 'finished') {
          console.log("[TransportControls] Curățare setări după perioada de afișare finalizat");
          localStorage.removeItem('persist_finished_state');
        }
      }, 10000);
      
      // Notificăm utilizatorul
      toast({
        title: "Se procesează...",
        description: `Se finalizează transportul ${currentTransport.uit}, vă rugăm așteptați...`
      });
      
      // Apelăm funcția din context
      try {
        await finishTransport(currentUit);
        console.log("[TransportControls] Transport finalizat cu succes");
        
        // După finalizare, forțăm setarea statusului din nou în localStorage
        localStorage.setItem('transport_status', 'inactive');
        
        toast({
          title: "Transport finalizat",
          description: `Cursa ${currentTransport.uit} a fost finalizată cu succes.`,
          variant: "default"
        });
      } catch (finishError) {
        console.error("[TransportControls] Eroare specifică la finalizare:", finishError);
        
        // Chiar și în caz de eroare la finishTransport(), considerăm transportul finalizat
        // și resetăm starea manual pentru a evita blocajele
        
        // Forțăm starea în localStorage la "inactive"
        localStorage.setItem('transport_status', 'inactive');
        localStorage.removeItem('transport_state_ref');
        
        toast({
          title: "Transport finalizat",
          description: `Cursa ${currentTransport.uit} a fost finalizată, dar a apărut o mică eroare la sincronizare.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("[TransportControls] Eroare generală la finalizarea transportului:", error);
      
      // Resetăm starea din localStorage pentru a permite utilizatorului să continue
      localStorage.setItem('transport_status', 'inactive');
      localStorage.removeItem('transport_state_ref');
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la finalizarea transportului. Încercați din nou."
      });
    }
  };

  return (
    <div className="w-full mb-6">
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardTitle className="text-xl flex items-center">
            <Truck className="mr-2 h-6 w-6" />
            Control Transport
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {transports.map(transport => (
              <div key={transport.id} className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className={`h-3 w-3 rounded-full mr-2 ${getStatusIndicatorClass(transport.status, transport.isTracking)}`}
                      ></div>
                      <span className="font-medium">
                        {getStatusText(transport.status, transport.isTracking)}
                      </span>
                    </div>
                    <Badge variant="outline" className="ml-2 bg-blue-50">
                      <Clock className="h-3 w-3 mr-1" />
                      UIT: {transport.uit}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Traseu:</span>
                      <span className="font-medium">{transport.start_locatie} → {transport.stop_locatie}</span>
                    </div>
                    {isGpsActive !== undefined && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">GPS:</span>
                        <span className={`font-medium ${isGpsActive ? 'text-green-600' : 'text-red-600'}`}>
                          {isGpsActive ? 'Activ' : 'Inactiv'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Baterie:</span>
                      <span className="font-medium">{battery}%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 mt-2">
                    {/* Stare INACTIVĂ: Afișăm doar butonul de pornire */}
                    {transport.status === "inactive" && (
                      <Button 
                        variant="default"
                        className="w-full bg-green-600 text-white hover:bg-green-700 shadow-md"
                        onClick={() => handleStartTransport(transport.id)}
                      >
                        <Play className="h-4 w-4 mr-2" /> Pornire Transport
                      </Button>
                    )}
                    
                    {/* Stare ACTIVĂ: Afișăm butoanele de Pauză și Finalizare */}
                    {transport.status === "active" && (
                      <>
                        <Button 
                          variant="default"
                          className="flex-1 bg-yellow-600 text-white hover:bg-yellow-700 shadow-md"
                          onClick={() => handlePauseTransport(transport.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" /> Pauză de odihnă
                        </Button>
                        
                        <Button 
                          variant="default"
                          className="flex-1 bg-gray-600 text-white hover:bg-gray-700 shadow-md"
                          onClick={() => handleFinishTransport(transport.id)}
                        >
                          <Check className="h-4 w-4 mr-2" /> Finalizare
                        </Button>
                      </>
                    )}
                    
                    {/* Stare PAUZĂ: Afișăm butonul de Reluare și Finalizare */}
                    {transport.status === "paused" && (
                      <>
                        <Button 
                          variant="default"
                          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                          onClick={() => handleResumeTransport(transport.id)}
                        >
                          <Play className="h-4 w-4 mr-2" /> Reluare cursă
                        </Button>
                        
                        <Button 
                          variant="default"
                          className="flex-1 bg-gray-600 text-white hover:bg-gray-700 shadow-md"
                          onClick={() => handleFinishTransport(transport.id)}
                        >
                          <Check className="h-4 w-4 mr-2" /> Finalizare
                        </Button>
                      </>
                    )}
                    
                    {/* Stare FINALIZAT: Nu afișăm niciun buton */}
                    {transport.status === "finished" && (
                      <div className="w-full p-3 bg-gray-100 rounded-md text-center text-gray-500">
                        Transport finalizat
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}