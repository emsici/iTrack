import { useState, useEffect, useRef } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Check, Truck, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useForceTransportActive } from "@/hooks/useForceTransportActive";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Interfață pentru un transport cu toate detaliile
interface Transport {
  id: string;
  uit: string;
  start_locatie: string;
  stop_locatie: string;
  status: "inactive" | "active" | "paused" | "finished";
  isTracking: boolean;
  // Detalii complete din API
  ikRoTrans?: number;
  codDeclarant?: number;
  denumireCui?: string;
  nrVehicul?: string;
  dataTransport?: string;
  Vama?: string | null;
  BirouVamal?: string | null;
}

export default function TransportControls() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [battery, setBattery] = useState(100);
  const [expandedTransports, setExpandedTransports] = useState<Set<string>>(new Set());
  const { 
    transportStatus, 
    currentActiveUit, 
    startTransport, 
    pauseTransport, 
    resumeTransport, 
    finishTransport,
    isGpsActive,
    isBackgroundActive,
    gpsCoordinates,
  } = useTransport();
  const { vehicleInfo } = useAuth();
  
  // Activăm hook-ul pentru forțarea stării de transport activ
  useForceTransportActive(transportStatus);

  // Funcție pentru toggle expand/collapse
  const toggleExpanded = (transportId: string) => {
    setExpandedTransports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transportId)) {
        newSet.delete(transportId);
      } else {
        newSet.add(transportId);
      }
      return newSet;
    });
  };

  // Încarcă transporturile disponibile pentru vehicul 
  useEffect(() => {
    console.log("TransportControls: vehicleInfo updated:", vehicleInfo);
    console.log("TransportControls: vehicleInfo.allTransports:", vehicleInfo?.allTransports);
    
    if (vehicleInfo?.allTransports && Array.isArray(vehicleInfo.allTransports) && vehicleInfo.allTransports.length > 0) {
      // Folosim toate transporturile din vehicleInfo.allTransports cu detalii complete
      const allTransports = vehicleInfo.allTransports.map((transport, index) => ({
        id: (index + 1).toString(),
        uit: transport.uit,
        start_locatie: transport.start_locatie,
        stop_locatie: transport.stop_locatie,
        status: "inactive" as const,
        isTracking: false,
        // Detalii complete din API
        ikRoTrans: transport.ikRoTrans,
        codDeclarant: (vehicleInfo as any).codDeclarant,
        denumireCui: (vehicleInfo as any).denumireCui,
        nrVehicul: vehicleInfo.nr,
        dataTransport: transport.dataTransport,
        Vama: null,
        BirouVamal: null,
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

  // Sincronizăm starea transportului cu contextul
  useEffect(() => {
    const activeUitFromStorage = localStorage.getItem('current_active_uit');
    const localStatus = localStorage.getItem('transport_status') as "inactive" | "active" | "paused" | "finished" | null;
    
    console.log("[TransportControls] Sincronizare stare:", {
      localStatus,
      contextStatus: transportStatus,
      effectiveStatus: localStatus || transportStatus,
      activeUitFromStorage,
      currentActiveUit: currentActiveUit?.uit
    });

    const effectiveStatus = localStatus || transportStatus;
    const activeUit = currentActiveUit?.uit || activeUitFromStorage;

    if (effectiveStatus && activeUit) {
      setTransports(prev => prev.map(transport => ({
        ...transport,
        status: transport.uit === activeUit ? effectiveStatus : "inactive",
        isTracking: transport.uit === activeUit && effectiveStatus === "active"
      })));
    } else if (effectiveStatus === "inactive") {
      setTransports(prev => prev.map(transport => ({
        ...transport,
        status: "inactive",
        isTracking: false
      })));
    }
  }, [transportStatus, currentActiveUit]);

  // Funcție pentru obținerea textului statusului
  const getStatusText = (status: string, isTracking: boolean) => {
    if (isTracking && !isGpsActive) {
      return "Activ (fără GPS)"; // Acest caz nu ar trebui să se întâmple
    }
    
    switch (status) {
      case "active":
        return isGpsActive ? "Activ" : "Activ (fără GPS)";
      case "paused":
        return "În pauză";
      case "finished":
        return "Finalizat";
      default:
        return "Inactiv";
    }
  };

  // Handler pentru pornirea unui transport
  const handleStartTransport = async (transportId: string) => {
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
      
      const success = await startTransport(currentUit);
      if (!success) {
        throw new Error("Pornirea transportului a eșuat");
      }
      
      // Salvăm în localStorage
      localStorage.setItem('current_active_transport_id', transportId);
      localStorage.setItem('current_active_uit', currentTransport.uit);
      
      setTransports(prevTransports => 
        prevTransports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "active", isTracking: true } 
            : { ...transport, status: "inactive", isTracking: false }
        )
      );
      
      toast({
        title: "Transport pornit",
        description: `Transport ${currentTransport.uit} a fost pornit cu succes.`
      });
    } catch (error) {
      console.error("Eroare la pornirea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la pornirea transportului."
      });
    }
  };

  // Handler pentru pauzarea unui transport
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
        title: "Transport pus în pauză",
        description: `Transport ${currentTransport.uit} a fost pus în pauză.`
      });
    } catch (error) {
      console.error("Eroare la pauzarea transportului:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la pauzarea transportului."
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
        {transports.map(transport => {
          const isActive = transport.status === 'active';
          const isExpanded = expandedTransports.has(transport.id);
          
          return (
            <Card key={transport.id} className={`transition-all duration-300 hover:shadow-lg border-l-4 ${
              transport.status === 'active' ? 'border-l-green-500 bg-green-50' :
              transport.status === 'paused' ? 'border-l-yellow-500 bg-yellow-50' :
              transport.status === 'finished' ? 'border-l-gray-500 bg-gray-50' :
              'border-l-blue-500 bg-white hover:bg-blue-50'
            }`}>
              <CardContent className="p-6">
                <div className="space-y-4">
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
                        <p className="text-sm text-gray-500">UIT: {transport.uit}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(transport.id)}
                      className="p-1 h-8 w-8"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* Traseu */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{transport.start_locatie}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <Truck className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-2 flex-1 justify-end">
                        <span className="font-medium text-gray-900">{transport.stop_locatie}</span>
                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Localizare curentă pentru transportul activ */}
                  {isActive && gpsCoordinates && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Localizare curentă</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p>Lat: {gpsCoordinates.lat.toFixed(6)}</p>
                        <p>Lng: {gpsCoordinates.lng.toFixed(6)}</p>
                        <p>Actualizat: {new Date(gpsCoordinates.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Detalii expandabile */}
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Detalii complete</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">ikRoTrans:</span>
                            <span className="ml-2 font-medium">{transport.ikRoTrans || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Cod Declarant:</span>
                            <span className="ml-2 font-medium">{transport.codDeclarant || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Denumire:</span>
                            <span className="ml-2 font-medium">{transport.denumireCui || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Vehicul:</span>
                            <span className="ml-2 font-medium">{transport.nrVehicul || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Data:</span>
                            <span className="ml-2 font-medium">{transport.dataTransport || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Controale */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`font-medium ${
                        isActive && isGpsActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        GPS: {isGpsActive ? 'Activ' : 'Inactiv'}
                      </span>
                      <span className="text-gray-600">Baterie: {battery}%</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {transport.status === 'inactive' && (
                        <Button
                          onClick={() => handleStartTransport(transport.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Pornește
                        </Button>
                      )}
                      
                      {transport.status === 'active' && (
                        <>
                          <Button
                            onClick={() => handlePauseTransport(transport.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pauză
                          </Button>
                          
                          <Button
                            onClick={() => handleFinishTransport(transport.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Finalizează
                          </Button>
                        </>
                      )}
                      
                      {transport.status === 'paused' && (
                        <>
                          <Button
                            onClick={() => handleResumeTransport(transport.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Reia
                          </Button>
                          
                          <Button
                            onClick={() => handleFinishTransport(transport.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Finalizează
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}