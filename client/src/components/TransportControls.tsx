import { useState, useEffect, useRef } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Check, Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
  const { 
    transportStatus, 
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
  useForceTransportActive(transportStatus);

  // Încarcă transporturile disponibile pentru vehicul 
  useEffect(() => {
    console.log("TransportControls: vehicleInfo updated:", vehicleInfo);
    console.log("TransportControls: vehicleInfo.allTransports:", vehicleInfo?.allTransports);
    
    if (vehicleInfo?.allTransports && Array.isArray(vehicleInfo.allTransports) && vehicleInfo.allTransports.length > 0) {
      // Folosim toate transporturile din vehicleInfo.allTransports
      const allTransports = vehicleInfo.allTransports.map((transport, index) => ({
        id: (index + 1).toString(),
        uit: transport.uit,
        start_locatie: transport.start_locatie,
        stop_locatie: transport.stop_locatie,
        status: "inactive" as const,
        isTracking: false
      }));
      
      console.log("TransportControls: Setez toate transporturile:", allTransports);
      setTransports(allTransports);
    } else if (vehicleInfo && vehicleInfo.uit) {
      // Fallback pentru compatibilitate - folosim doar primul UIT
      console.log("TransportControls: Folosesc fallback cu primul UIT:", vehicleInfo.uit);
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
  
  // Sincronizează starea transporturilor cu starea globală din context - doar pentru transportul activ
  useEffect(() => {
    if (transports.length === 0) return;
    
    const localStatus = localStorage.getItem('transport_status');
    const activeUitFromStorage = localStorage.getItem('current_active_uit');
    const effectiveStatus = localStatus || transportStatus || "inactive";
    
    console.log("[TransportControls] Sincronizare stare:", {
      localStatus,
      contextStatus: transportStatus,
      effectiveStatus,
      activeUitFromStorage,
      currentActiveUit: currentActiveUit?.uit
    });
    
    // Actualizăm DOAR transportul care este activ în contextul global
    const activeUit = currentActiveUit?.uit || activeUitFromStorage;
    
    setTransports(prev => prev.map(transport => {
      // Dacă este transportul activ din context, actualizăm statusul
      if (transport.uit === activeUit) {
        return {
          ...transport,
          status: effectiveStatus as "inactive" | "active" | "paused" | "finished",
          isTracking: effectiveStatus === "active" && isBackgroundActive
        };
      }
      // Pentru celelalte transporturi, păstrăm statusul local (independent)
      return transport;
    }));
    
  }, [transportStatus, isBackgroundActive, currentActiveUit]);

  // Obține clasa de culoare pentru indicatorul de stare
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

  // Handler pentru pornirea unui transport individual
  const handleStartTransport = async (transportId: string) => {
    try {
      console.log("Se începe transportul:", transportId);
      
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      // Verificăm dacă există deja un transport activ
      const hasActiveTransport = transports.some(t => t.status === "active");
      if (hasActiveTransport) {
        toast({
          variant: "destructive",
          title: "Transport deja activ",
          description: "Există deja un transport în desfășurare. Finalizați-l înainte de a porni altul."
        });
        return;
      }
      
      toast({
        title: "Se procesează...",
        description: "Se inițiază transportul, vă rugăm așteptați..."
      });
      
      // Actualizăm starea LOCAL pentru acest transport
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "active", isTracking: true }
            : transport
        )
      );
      
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      // Salvăm în localStorage care transport este activ
      localStorage.setItem('current_active_transport_id', transportId);
      localStorage.setItem('current_active_uit', currentTransport.uit);
      
      const result = await startTransport(currentUit);
      console.log("Rezultat pornire transport:", result);
      
      if (result) {
        toast({
          title: "Transport pornit",
          description: `Transport ${currentTransport.uit} pornit cu succes.`
        });
      } else {
        // Resetăm starea în caz de eroare
        setTransports(prevTransports => 
          prevTransports.map(transport => 
            transport.id === transportId 
              ? { ...transport, status: "inactive", isTracking: false } 
              : transport
          )
        );
        localStorage.removeItem('current_active_transport_id');
        localStorage.removeItem('current_active_uit');
        
        toast({
          variant: "destructive",
          title: "Eroare GPS",
          description: "Nu s-a putut activa GPS-ul. Transportul nu poate fi pornit fără GPS activ."
        });
      }
    } catch (error) {
      console.error("Eroare la pornirea transportului:", error);
      
      // Resetăm starea în caz de eroare
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "inactive", isTracking: false } 
            : transport
        )
      );
      localStorage.removeItem('current_active_transport_id');
      localStorage.removeItem('current_active_uit');
      
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
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      await pauseTransport(currentUit);
      
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "paused", isTracking: false } 
            : transport
        )
      );
      
      toast({
        title: "Transport în pauză",
        description: `Transport ${currentTransport.uit} a fost pus în pauză.`
      });
    } catch (error) {
      console.error("Eroare la pausarea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la pausarea transportului."
      });
    }
  };

  // Handler pentru reluarea unui transport
  const handleResumeTransport = async (transportId: string) => {
    try {
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      await resumeTransport(currentUit);
      
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "active", isTracking: true } 
            : transport
        )
      );
      
      toast({
        title: "Transport reluat",
        description: `Transport ${currentTransport.uit} a fost reluat.`
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
      const currentTransport = transports.find(t => t.id === transportId);
      if (!currentTransport) {
        throw new Error("Transport negăsit");
      }
      
      const currentUit = {
        uit: currentTransport.uit,
        start_locatie: currentTransport.start_locatie,
        stop_locatie: currentTransport.stop_locatie
      };
      
      await finishTransport(currentUit);
      
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "finished", isTracking: false } 
            : transport
        )
      );
      
      // Curățăm localStorage
      localStorage.removeItem('current_active_transport_id');
      localStorage.removeItem('current_active_uit');
      
      toast({
        title: "Transport finalizat",
        description: `Transport ${currentTransport.uit} a fost finalizat cu succes.`
      });
    } catch (error) {
      console.error("Eroare la finalizarea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la finalizarea transportului."
      });
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transporturi Disponibile</h2>
        <p className="text-gray-600">Selectați și gestionați transporturile dumneavoastră</p>
      </div>
      
      <div className="grid gap-4">
        {transports.map(transport => (
          <Card key={transport.id} className={`transition-all duration-300 hover:shadow-lg border-l-4 ${
            transport.status === 'active' ? 'border-l-green-500 bg-green-50' :
            transport.status === 'paused' ? 'border-l-yellow-500 bg-yellow-50' :
            transport.status === 'finished' ? 'border-l-gray-500 bg-gray-50' :
            'border-l-blue-500 bg-white hover:bg-blue-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                {/* Header cu status și UIT */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                      transport.status === 'active' ? 'bg-green-500' :
                      transport.status === 'paused' ? 'bg-yellow-500' :
                      transport.status === 'finished' ? 'bg-gray-500' :
                      'bg-blue-500'
                    }`}>
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {getStatusText(transport.status, transport.isTracking)}
                      </h3>
                      <p className="text-sm text-gray-500">Transport #{transport.id}</p>
                    </div>
                  </div>
                  
                  <Badge className={`px-3 py-1 font-medium ${
                    transport.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                    transport.status === 'paused' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    transport.status === 'finished' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    UIT: {transport.uit}
                  </Badge>
                </div>
                
                {/* Informații traseu */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{transport.start_locatie}</span>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <div className="h-0.5 w-8 bg-gray-300"></div>
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div className="h-0.5 w-8 bg-gray-300"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-1 justify-end">
                      <span className="font-medium text-gray-900">{transport.stop_locatie}</span>
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Informații status */}
                <div className="flex justify-between items-center text-sm">
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
                
                {/* Butoane acțiuni cu design modern */}
                <div className="flex flex-col space-y-3">
                  {/* Stare INACTIVĂ: Afișăm doar butonul de pornire */}
                  {transport.status === "inactive" && (
                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                      onClick={() => handleStartTransport(transport.id)}
                    >
                      <Play className="h-5 w-5 mr-2" /> Pornire Transport
                    </Button>
                  )}
                  
                  {/* Stare ACTIVĂ: Afișăm butoanele de Pauză și Finalizare */}
                  {transport.status === "active" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        className="h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                        onClick={() => handlePauseTransport(transport.id)}
                      >
                        <Pause className="h-4 w-4 mr-2" /> Pauză
                      </Button>
                      
                      <Button 
                        className="h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                        onClick={() => handleFinishTransport(transport.id)}
                      >
                        <Check className="h-4 w-4 mr-2" /> Finalizare
                      </Button>
                    </div>
                  )}
                  
                  {/* Stare PAUZĂ: Afișăm butonul de Reluare și Finalizare */}
                  {transport.status === "paused" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                        onClick={() => handleResumeTransport(transport.id)}
                      >
                        <Play className="h-4 w-4 mr-2" /> Reluare
                      </Button>
                      
                      <Button 
                        className="h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                        onClick={() => handleFinishTransport(transport.id)}
                      >
                        <Check className="h-4 w-4 mr-2" /> Finalizare
                      </Button>
                    </div>
                  )}
                  
                  {/* Stare FINALIZAT: Mesaj informativ */}
                  {transport.status === "finished" && (
                    <div className="w-full p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg text-center">
                      <span className="text-gray-600 font-medium">✓ Transport finalizat cu succes</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}