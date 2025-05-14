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
  
  // Funcție pentru pornirea transportului direct, fără a aștepta GPS
  const startTransportWithoutGps = async (transportId: string) => {
    try {
      console.log("Pornire transport fără GPS...");
      
      toast({
        title: "Se procesează...",
        description: "Se pornește transportul fără poziție GPS inițială..."
      });
      
      // Pornim transportul direct, forțând ignorarea verificărilor GPS
      const result = await startTransport();
      console.log("Rezultat pornire transport fără GPS:", result);
      
      if (result) {
        // Actualizăm starea transportului în UI
        setTransports(prevTransports => 
          prevTransports.map(transport => 
            transport.id === transportId 
              ? { ...transport, status: "active", isTracking: true } 
              : transport
          )
        );
        
        toast({
          title: "Transport pornit",
          description: "Cursa a început. Coordonatele GPS se vor trimite când vor fi disponibile."
        });
      } else {
        console.error("Pornire transport fără GPS eșuată");
        toast({
          variant: "destructive", 
          title: "Eroare",
          description: "Nu s-a putut porni transportul. Verificați conexiunea și datele vehiculului."
        });
      }
    } catch (error) {
      console.error("Eroare la pornirea transportului fără GPS:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare la pornirea transportului. Verificați conexiunea la internet."
      });
    }
  };
  const { vehicleInfo, token } = useAuth();
  const [transports, setTransports] = useState<Transport[]>([]);
  const [battery, setBattery] = useState(100);
  const { 
    startTransport, 
    pauseTransport, 
    resumeTransport, 
    finishTransport,
    isBackgroundActive, // Adăugăm informație despre serviciul de background
    transportStatus,
    currentActiveUit, // Adăugăm acces la UIT-ul curent activ din context
    selectedUits // Adăugăm acces la lista de UIT-uri selectate
  } = useTransport();
  
  // Folosim hook-ul custom pentru a forța starea activă a transportului
  useForceTransportActive(transportStatus);

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
    if (transports.length === 0 || !transportStatus) return;
    
    // Actualizăm transporturile cu starea curentă din context
    setTransports(prev => prev.map(transport => ({
      ...transport,
      status: transportStatus,
      isTracking: transportStatus === "active" && isBackgroundActive
    })));
  }, [transportStatus, isBackgroundActive]);

  // Helper function pentru indicator de stare
  const getStatusIndicatorClass = (status: string, isTracking: boolean) => {
    if (status === "active") {
      return "bg-green-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]";
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
    if (status === "active") {
      return "Transport Activ";
    } else if (status === "paused") {
      return "Transport în Pauză";
    } else if (status === "finished") {
      return "Transport Finalizat";
    } else {
      return "Transport Inactiv";
    }
  };

  // Helper function pentru clasa de culoare a textului
  const getStatusTextClass = (status: string, isTracking: boolean) => {
    if (status === "active") {
      return "text-green-600";
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
      // Forțăm starea activă a transportului - aceasta va persista
      // chiar și între actualizări
      forceTransportActive();
      
      console.log("Verificare UIT și date transport:", { 
        vehicleInfo,
        currentActiveUit,
        transportId,
        isAlreadyActive: isTransportActive()
      });
      
      // Verificăm dacă transportId este valid
      const targetTransport = transports.find(t => t.id === transportId);
      if (!targetTransport) {
        console.error("Transport ID invalid:", transportId);
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "ID transport invalid. Reîncărcați pagina și încercați din nou."
        });
        return;
      }
      
      // Verificăm mai întâi dacă avem UIT valid configurat
      // INDIFERENT dacă este în TransportContext sau din transport local
      const uit = currentActiveUit?.uit || targetTransport.uit;
      
      if (!uit) {
        console.error("Lipsă UIT pentru transport");
        toast({
          variant: "destructive",
          title: "Eroare UIT",
          description: "Nu există un UIT selectat pentru transport. Selectați un UIT înainte de a porni transportul."
        });
        return;
      }
      
      // Afișăm un indicator de încărcare
      toast({
        title: "Se procesează...",
        description: "Se verifică permisiunile de locație..."
      });
      
      // Cererea permisiunilor de locație înainte de pornirea transportului
      try {
        // Folosim API nativ pentru a solicita permisiunile de locație
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          
          // Forțăm pornirea unui indicator de încărcare pentru a informa utilizatorul
          toast({
            title: "Se procesează...",
            description: "Se așteaptă accesul la serviciul de locație..."
          });
          
          // Folosim try/catch când solicităm permisiunile de locație
          try {
            // Reducem timeout-ul pentru a evita blocarea utilizatorului și tratăm separat erorile de timeout
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                console.log("Permisiuni locație acordate, pornire transport...");
                
                // Actualizăm UI-ul pentru a arăta că procesăm cererea
                toast({
                  title: "Se procesează...",
                  description: "Permisiuni acordate, se pornește transportul..."
                });
                
                try {
                  // Pornește GPS tracking în backend
                  const result = await startTransport();
                  console.log("Rezultat pornire transport:", result);
                  
                  if (result) {
                    // Actualizează starea transportului în UI DOAR după ce s-a pornit cu succes
                    setTransports(prevTransports => 
                      prevTransports.map(transport => 
                        transport.id === transportId 
                          ? { ...transport, status: "active", isTracking: true } 
                          : transport
                      )
                    );
                    
                    toast({
                      title: "Transport pornit",
                      description: "Cursa a început. Coordonatele GPS se trimit acum."
                    });
                  } else {
                    console.error("Pornire transport eșuată, rezultat fals");
                    toast({
                      variant: "destructive",
                      title: "Eroare",
                      description: "Nu s-a putut porni transportul. Verificați conexiunea și datele vehiculului."
                    });
                  }
                } catch (startError) {
                  console.error("Eroare la pornirea transportului din context:", startError);
                  toast({
                    variant: "destructive",
                    title: "Eroare de sistem",
                    description: "A apărut o eroare la pornirea transportului. Încercați din nou."
                  });
                }
              },
              (geoError) => {
                console.error("Eroare permisiuni locație:", geoError);
                
                // Tratăm separat eroarea de timeout pentru a da un mesaj mai clar utilizatorului
                if (geoError.code === 3) { // 3 = TIMEOUT
                  console.log("Timeout la obținerea poziției GPS, încercăm să pornm transportul direct...");
                  toast({
                    title: "Timeout GPS",
                    description: "Pozițiile GPS vor fi obținute când sunt disponibile."
                  });
                  
                  // IMPORTANT: Încercăm să pornim transportul chiar și când poziția GPS nu este disponibilă
                  // Vom sări peste verificarea inițială, dar vom încerca să obținem locația ulterior
                  startTransportWithoutGps(transportId);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Permisiuni de locație necesare",
                    description: "Pentru a porni transportul, trebuie să activați serviciul de locație. Verificați setările telefonului."
                  });
                }
              },
              // Reducem timeout-ul la 5 secunde pentru un răspuns mai rapid al UI-ului
              { timeout: 5000, enableHighAccuracy: true, maximumAge: 10000 }
            );
          } catch (geoInitError) {
            console.error("Eroare la inițializarea serviciului de locație:", geoInitError);
            // Încercăm să pornim transportul direct când avem o eroare la inițializarea GPS
            startTransportWithoutGps(transportId);
          }
        } else {
          console.error("API Geolocation nu este disponibil în acest browser");
          // Încercăm direct startTransport fără verificare permisiuni
          try {
            const result = await startTransport();
            
            if (result) {
              setTransports(prevTransports => 
                prevTransports.map(transport => 
                  transport.id === transportId 
                    ? { ...transport, status: "active", isTracking: true } 
                    : transport
                )
              );
              
              toast({
                title: "Transport pornit",
                description: "Cursa a început. Coordonatele GPS se trimit acum."
              });
            } else {
              toast({
                variant: "destructive",
                title: "Eroare",
                description: "Nu s-a putut porni transportul fără acces la serviciile de localizare."
              });
            }
          } catch (directStartError) {
            console.error("Eroare la pornirea directă a transportului:", directStartError);
            toast({
              variant: "destructive",
              title: "Eroare",
              description: "Nu s-a putut porni transportul. Verificați conexiunea la internet și setările dispozitivului."
            });
          }
        }
      } catch (permError) {
        console.error("Eroare la solicitarea permisiunilor:", permError);
        toast({
          variant: "destructive",
          title: "Eroare permisiuni",
          description: "Nu s-au putut obține permisiunile de locație necesare."
        });
      }
    } catch (generalError) {
      console.error("Eroare generală la pornirea transportului:", generalError);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "A apărut o eroare neașteptată. Încercați din nou."
      });
    }
  };

  const handlePauseTransport = async (transportId: string) => {
    try {
      // Afișăm un indicator de încărcare
      toast({
        title: "Se procesează...",
        description: "Așteptați până se întrerupe transmisia GPS."
      });
      
      // Oprește GPS tracking în backend - ÎNAINTE de a actualiza UI
      console.log("Oprire tracking GPS");
      await pauseTransport();
      
      // Doar după ce tracking-ul a fost oprit, actualizăm UI-ul
      console.log("Tracking GPS oprit, actualizez UI");
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "paused", isTracking: false } 
          : transport
      ));
      
      toast({
        title: "Pauză de odihnă",
        description: "Transmisia GPS este întreruptă temporar."
      });
    } catch (error) {
      console.error("Error pausing transport:", error);
      
      // La eroare, revenim la starea anterioară
      const currentTransport = transports.find(t => t.id === transportId);
      if (currentTransport && currentTransport.status === "active") {
        // Revenim la starea activă dacă acea stare a fost activă înainte
        setTransports(transports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "active", isTracking: true } 
            : transport
        ));
      }
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut întrerupe cursa. Încercați din nou."
      });
    }
  };

  const handleResumeTransport = async (transportId: string) => {
    try {
      // Afișăm un indicator de încărcare
      toast({
        title: "Se procesează...",
        description: "Așteptați până se reactivează GPS-ul."
      });
      
      // Repornește GPS tracking în backend - ÎNAINTE de a actualiza UI
      console.log("Repornire tracking GPS");
      await resumeTransport();
      
      // Apoi actualizăm UI-ul
      console.log("Tracking GPS repornit, actualizez UI");
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "active", isTracking: true } 
          : transport
      ));
      
      toast({
        title: "Transport reluat",
        description: "Transmisia GPS a fost reactivată."
      });
    } catch (error) {
      console.error("Error resuming transport:", error);
      
      // La eroare, revenim la starea anterioară
      const currentTransport = transports.find(t => t.id === transportId);
      if (currentTransport && currentTransport.status === "paused") {
        // Revenim la starea întreruptă dacă acea stare a fost întreruptă înainte
        setTransports(transports.map(transport => 
          transport.id === transportId 
            ? { ...transport, status: "paused", isTracking: false } 
            : transport
        ));
      }
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa. Încercați din nou."
      });
    }
  };

  const handleFinishTransport = async (transportId: string) => {
    try {
      // Afișăm un indicator de încărcare
      toast({
        title: "Se procesează...",
        description: "Așteptați finalizarea transportului."
      });
      
      // Finalizează GPS tracking în backend - ÎNAINTE de a actualiza UI
      console.log("Finalizare transport și oprire tracking GPS");
      await finishTransport();
      
      // Apoi actualizăm UI-ul
      console.log("Transport finalizat, actualizez UI");
      setTransports(transports.map(transport => 
        transport.id === transportId 
          ? { ...transport, status: "finished", isTracking: false } 
          : transport
      ));
      
      toast({
        title: "Transport finalizat",
        description: "Cursa a fost încheiată cu succes."
      });
    } catch (error) {
      console.error("Error finishing transport:", error);
      
      // La eroare, revenim la starea anterioară
      const currentTransport = transports.find(t => t.id === transportId);
      if (currentTransport) {
        // Revenim la starea anterioară (fie activă, fie în pauză)
        setTransports(transports.map(transport => 
          transport.id === transportId 
            ? { ...transport, 
                status: currentTransport.status, 
                isTracking: currentTransport.status === "active" 
              } 
            : transport
        ));
      }
      
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
    <div className="space-y-6 mt-4">
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
                    
                    {/* Indicator pentru serviciul de background a fost eliminat */}
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
                    {/* Afișăm butoanele în funcție de starea transportului */}
                    
                    {/* Stare INACTIVĂ: Afișăm doar butonul de Start */}
                    {transport.status === "inactive" && (
                      <Button 
                        variant="default"
                        className="flex-1 bg-green-600 text-white hover:bg-green-700 shadow-md"
                        onClick={() => handleStartTransport(transport.id)}
                      >
                        <Play className="h-4 w-4 mr-2" /> Start cursă
                      </Button>
                    )}
                    
                    {/* Stare ACTIVĂ: Afișăm butonul de Pauză și Finalizare */}
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
