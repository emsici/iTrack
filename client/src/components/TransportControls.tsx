import { useState, useEffect } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Check, AlertTriangle, Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const { vehicleInfo, token } = useAuth();
  const [transports, setTransports] = useState<Transport[]>([]);
  const [battery, setBattery] = useState(100);
  const { startTransport, pauseTransport, resumeTransport, finishTransport } = useTransport();

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

  // Helper function pentru indicator de stare
  const getStatusIndicatorClass = (status: string, isTracking: boolean) => {
    if (status === "active" && isTracking) {
      return "bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.2)]";
    } else if (status === "paused") {
      return "bg-warning shadow-[0_0_0_3px_rgba(245,158,11,0.2)]";
    } else if (status === "finished") {
      return "bg-secondary-500 shadow-[0_0_0_3px_rgba(107,114,128,0.2)]";
    } else {
      return "bg-destructive shadow-[0_0_0_3px_rgba(239,68,68,0.2)]";
    }
  };

  // Helper function pentru textul de stare
  const getStatusText = (status: string, isTracking: boolean) => {
    if (status === "active" && isTracking) {
      return "GPS Activ";
    } else if (status === "paused") {
      return "GPS Pauză";
    } else if (status === "finished") {
      return "Transport Finalizat";
    } else {
      return "GPS Inactiv";
    }
  };

  // Helper function pentru clasa de culoare a textului
  const getStatusTextClass = (status: string, isTracking: boolean) => {
    if (status === "active" && isTracking) {
      return "text-success";
    } else if (status === "paused") {
      return "text-warning";
    } else if (status === "finished") {
      return "text-secondary-500";
    } else {
      return "text-destructive";
    }
  };

  // Funcții pentru gestionarea transporturilor
  const handleStartTransport = async (transportId: string) => {
    try {
      // Actualizează starea transportului în UI
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "active", isTracking: true } 
          : transport
      ));
      
      // Pornește GPS tracking în backend
      await startTransport();
      
      toast({
        title: "Transport pornit",
        description: "Cursa a început. Coordonatele GPS se trimit acum."
      });
    } catch (error) {
      console.error("Error starting transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut porni cursa. Încercați din nou."
      });
    }
  };

  const handlePauseTransport = async (transportId: string) => {
    try {
      // Actualizează starea transportului în UI
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "paused", isTracking: false } 
          : transport
      ));
      
      // Oprește GPS tracking în backend
      await pauseTransport();
      
      toast({
        title: "Pauză de odihnă",
        description: "Transmisia GPS este întreruptă temporar."
      });
    } catch (error) {
      console.error("Error pausing transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut întrerupe cursa. Încercați din nou."
      });
    }
  };

  const handleResumeTransport = async (transportId: string) => {
    try {
      // Actualizează starea transportului în UI
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "active", isTracking: true } 
          : transport
      ));
      
      // Repornește GPS tracking în backend
      await resumeTransport();
      
      toast({
        title: "Transport reluat",
        description: "Transmisia GPS a fost reluată."
      });
    } catch (error) {
      console.error("Error resuming transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa. Încercați din nou."
      });
    }
  };

  const handleFinishTransport = async (transportId: string) => {
    try {
      // Actualizează starea transportului în UI
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "finished", isTracking: false } 
          : transport
      ));
      
      // Finalizează GPS tracking în backend
      await finishTransport();
      
      toast({
        title: "Transport finalizat",
        description: "Cursa a fost încheiată cu succes."
      });
    } catch (error) {
      console.error("Error finishing transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut finaliza cursa. Încercați din nou."
      });
    }
  };

  if (transports.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <p className="text-center text-secondary-600">
            Nu există transporturi disponibile pentru acest vehicul.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-lg shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Truck className="mr-2 h-5 w-5 text-primary" />
            Transporturi disponibile
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {transports.map(transport => (
              <div 
                key={transport.id}
                className="border rounded-lg p-4 bg-secondary-50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-md font-bold text-secondary-800">{vehicleInfo?.nr}</h2>
                    <p className="text-sm text-secondary-500">UIT: <span className="font-medium">{transport.uit}</span></p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center mb-1">
                      <span 
                        className={`w-3 h-3 rounded-full mr-2 ${getStatusIndicatorClass(transport.status, transport.isTracking)}`} 
                        aria-hidden="true"
                      />
                      <span className={`text-sm font-medium ${getStatusTextClass(transport.status, transport.isTracking)}`}>
                        {getStatusText(transport.status, transport.isTracking)}
                      </span>
                    </div>
                    <span className="text-xs text-secondary-500">Baterie: {Math.round(battery)}%</span>
                  </div>
                </div>
                
                <div className="border-t border-b border-secondary-200 py-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div className="mb-3 sm:mb-0">
                      <p className="text-sm text-secondary-500">Plecare</p>
                      <p className="font-medium">{transport.start_locatie}</p>
                    </div>
                    <div className="hidden sm:flex items-center">
                      <svg className="h-5 w-5 text-secondary-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Destinație</p>
                      <p className="font-medium">{transport.stop_locatie}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-700 mb-2">Control transport</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="default"
                      className={`flex-1 bg-green-600 text-white hover:bg-opacity-90 disabled:opacity-50 ${
                        transport.status !== "inactive" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handleStartTransport(transport.id)}
                      disabled={transport.status !== "inactive"}
                    >
                      <Play className="h-4 w-4 mr-1" /> Start cursă
                    </Button>
                    
                    <Button 
                      variant="default"
                      className={`flex-1 bg-yellow-600 text-white hover:bg-opacity-90 disabled:opacity-50 ${
                        transport.status !== "active" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handlePauseTransport(transport.id)}
                      disabled={transport.status !== "active"}
                    >
                      <Pause className="h-4 w-4 mr-1" /> Pauză de odihnă
                    </Button>
                    
                    <Button 
                      variant="default"
                      className={`flex-1 bg-blue-600 text-white hover:bg-opacity-90 disabled:opacity-50 ${
                        transport.status !== "paused" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handleResumeTransport(transport.id)}
                      disabled={transport.status !== "paused"}
                    >
                      <Play className="h-4 w-4 mr-1" /> Reluare cursă
                    </Button>
                    
                    <Button 
                      variant="default"
                      className={`flex-1 bg-gray-600 text-white hover:bg-opacity-90 disabled:opacity-50 ${
                        (transport.status !== "active" && transport.status !== "paused") ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => handleFinishTransport(transport.id)}
                      disabled={transport.status !== "active" && transport.status !== "paused"}
                    >
                      <Check className="h-4 w-4 mr-1" /> Finalizare
                    </Button>
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
