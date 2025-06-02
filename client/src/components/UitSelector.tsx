import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransport } from "@/context/TransportContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Interfață pentru un UIT disponibil
interface UitOption {
  uit: string;
  start_locatie: string;
  stop_locatie: string;
}

export default function UitSelector() {
  const { setSelectedUits, setCurrentActiveUit } = useTransport();
  const [isLoading, setIsLoading] = useState(false);
  const [availableUits, setAvailableUits] = useState<UitOption[]>([]);
  const [localSelectedUits, setLocalSelectedUits] = useState<UitOption[]>([]);
  const [currentUit, setCurrentUit] = useState<string>("");

  const { vehicleInfo, token } = useAuth();

  // Funcție pentru a obține transporturile disponibile de la server
  const fetchUits = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      console.log("Obținem transporturile disponibile pentru vehicul:", vehicleInfo?.nr);
      
      let uits: UitOption[] = [];
      
      // Verificăm mai întâi dacă vehicleInfo conține toate transporturile
      console.log("=== VERIFICARE TRANSPORTURI ===");
      console.log("vehicleInfo:", vehicleInfo);
      console.log("vehicleInfo.allTransports:", vehicleInfo?.allTransports);
      
      if (vehicleInfo && vehicleInfo.allTransports && Array.isArray(vehicleInfo.allTransports)) {
        // Folosim transporturile din vehicleInfo care conține deja toate UIT-urile
        uits = vehicleInfo.allTransports.map((transport: any) => ({
          uit: transport.uit,
          start_locatie: transport.start_locatie,
          stop_locatie: transport.stop_locatie
        }));
        console.log("UIT-uri obținute din vehicleInfo.allTransports:", uits.length);
        console.log("Lista completă UIT-uri:", uits);
      } else if (vehicleInfo && vehicleInfo.nr && token) {
        try {
          // Facem un apel la API pentru a obține toate UIT-urile pentru vehicul
          const response = await fetch(`/api/vehicle?nr=${vehicleInfo.nr}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const apiData = await response.json();
            console.log("Răspuns API pentru UIT-uri:", apiData);
            
            // Procesăm răspunsul cu noua structură: { status, count, data }
            if (apiData && apiData.status === "success" && apiData.data && Array.isArray(apiData.data)) {
              // Convertim toate datele din API la formatul UitOption
              uits = apiData.data.map((item: any) => ({
                uit: item.UIT || item.uit,
                start_locatie: item.denumireLocStart || "Locație start",
                stop_locatie: item.denumireLocStop || "Locație destinație"
              }));
              
              console.log("UIT-uri procesate din API:", uits.length);
            } else {
              console.log("Format API nerecunoscut, folosim datele din vehicleInfo");
              // Fallback la datele din vehicleInfo
              if (vehicleInfo.uit) {
                uits.push({
                  uit: vehicleInfo.uit,
                  start_locatie: vehicleInfo.start_locatie || "Locație start",
                  stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
                });
              }
            }
          } else {
            console.log("Eroare la apelul API, folosim datele din vehicleInfo");
            // Fallback la datele din vehicleInfo
            if (vehicleInfo.uit) {
              uits.push({
                uit: vehicleInfo.uit,
                start_locatie: vehicleInfo.start_locatie || "Locație start",
                stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
              });
            }
          }
        } catch (apiError) {
          console.error("Eroare la obținerea UIT-urilor din API:", apiError);
          // Fallback la datele din vehicleInfo
          if (vehicleInfo.uit) {
            uits.push({
              uit: vehicleInfo.uit,
              start_locatie: vehicleInfo.start_locatie || "Locație start",
              stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
            });
          }
        }
      } else if (vehicleInfo && vehicleInfo.uit) {
        // Dacă nu avem token sau nr, folosim doar datele din vehicleInfo
        uits.push({
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie || "Locație start",
          stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
        });
      } else {
        // Adăugăm un UIT generic dacă nu avem informații
        const genericUit = {
          uit: "UIT" + (vehicleInfo?.nr || "12345"),
          start_locatie: "Depou",
          stop_locatie: "Destinație"
        };
        uits = [genericUit];
      }
      
      // Sortăm UIT-urile în ordine descrescătoare înainte de a le afișa
      uits.sort((a, b) => {
        // Extragem părțile numerice din UIT (presupunând formatul "UIT" + număr)
        const numA = parseInt(a.uit.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.uit.replace(/\D/g, '') || '0', 10);
        
        // Sortare descrescătoare
        return numB - numA;
      });
      
      console.log("UIT-uri sortate descrescător:", uits.map(u => u.uit));
      
      // Simulăm un răspuns de la API (delay redus pentru actualizări periodice)
      const delay = showLoading ? 500 : 200;
      setTimeout(() => {
        // Înainte de a seta noile UIT-uri, verificăm care sunt noi
        const existingUitIds = availableUits.map(uit => uit.uit);
        const newUits = uits.filter(uit => !existingUitIds.includes(uit.uit));
        
        // Pentru actualizări periodice, adăugăm noile UIT-uri la sfârșitul listei existente
        if (!showLoading && newUits.length > 0) {
          // Adăugăm noile UIT-uri și sortăm întreaga listă în ordine descrescătoare
          setAvailableUits(prevUits => {
            const combinedUits = [...prevUits, ...newUits];
            return combinedUits.sort((a, b) => {
              const numA = parseInt(a.uit.replace(/\D/g, '') || '0', 10);
              const numB = parseInt(b.uit.replace(/\D/g, '') || '0', 10);
              return numB - numA;  // Sortare descrescătoare
            });
          });
          
          // Afișăm notificare pentru utilizator
          const newUitsCount = newUits.length;
          toast({
            variant: "default",
            title: "Noi transporturi disponibile",
            description: `${newUitsCount} transport(uri) nou(i) disponibil(e).`,
            duration: 3000
          });
          
          console.log(`${newUitsCount} transporturi noi adăugate la lista existentă`);
        } else {
          // La prima încărcare sau când nu există UIT-uri noi, înlocuim toată lista
          // cu cea sortată descrescător
          setAvailableUits(uits);
        }
        
        if (showLoading) {
          setIsLoading(false);
        }
        
        // La prima încărcare, adăugăm automat UIT-ul din vehicleInfo dacă există
        // și dacă nu am selectat deja niciun UIT
        if (showLoading && vehicleInfo && vehicleInfo.uit && localSelectedUits.length === 0) {
          const uitFromVehicle = uits.find(uit => uit.uit === vehicleInfo.uit);
          if (uitFromVehicle) {
            // Adăugăm în lista de selectate
            setLocalSelectedUits([uitFromVehicle]);
            setSelectedUits([uitFromVehicle]);
            
            // Setăm ca UIT activ
            setCurrentActiveUit(uitFromVehicle);
            
            console.log("UIT setat automat din vehicleInfo:", uitFromVehicle);
            
            toast({
              title: "UIT configurat automat",
              description: `UIT ${uitFromVehicle.uit} a fost configurat automat din informațiile vehiculului.`
            });
          }
        }
        
        // Am mutat notificarea în blocul de cod de mai sus
      }, delay);
    } catch (error) {
      console.error("Eroare la obținerea UIT-urilor:", error);
      if (showLoading) {
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu s-au putut încărca UIT-urile disponibile."
        });
        setIsLoading(false);
      }
    }
  };

  // Obținem lista de UIT-uri disponibile la încărcarea componentei sau când se modifică vehicleInfo
  useEffect(() => {
    console.log("UitSelector - useEffect - vehicleInfo:", vehicleInfo);
    console.log("vehicleInfo?.allTransports:", vehicleInfo?.allTransports);
    
    // Verificăm dacă avem toate transporturile în vehicleInfo
    if (vehicleInfo?.allTransports && Array.isArray(vehicleInfo.allTransports) && vehicleInfo.allTransports.length > 0) {
      console.log("Folosim toate transporturile din vehicleInfo.allTransports:", vehicleInfo.allTransports.length);
      
      // Convertim toate transporturile la formatul UitOption
      const allUits = vehicleInfo.allTransports.map(transport => ({
        uit: transport.uit,
        start_locatie: transport.start_locatie || "Locație start",
        stop_locatie: transport.stop_locatie || "Locație destinație"
      }));
      
      console.log("Setăm toate UIT-urile disponibile:", allUits);
      setAvailableUits(allUits);
      
      // Setăm primul UIT ca selectat dacă nu avem nimic selectat
      if (localSelectedUits.length === 0 && allUits.length > 0) {
        const firstUit = allUits[0];
        setSelectedUits([firstUit]);
        setCurrentActiveUit(firstUit);
        setLocalSelectedUits([firstUit]);
        
        console.log("Primul UIT setat automat:", firstUit);
        toast({
          title: "UIT configurat",
          description: `Găsite ${allUits.length} transporturi. UIT ${firstUit.uit} setat automat.`,
        });
      }
      
    } else if (vehicleInfo && vehicleInfo.uit) {
      console.log("Setăm direct UIT-ul din vehicleInfo:", vehicleInfo.uit);
      
      // Creăm un UIT direct din vehicleInfo pentru a evita problemele de sincronizare
      const directUit = {
        uit: vehicleInfo.uit,
        start_locatie: vehicleInfo.start_locatie || "Locație start",
        stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
      };
      
      // IMPORTANT: Actualizăm starea globală direct, nu prin intermediul stării locale
      // Aceasta asigură că UIT-ul este disponibil imediat pentru pornirea transportului
      setSelectedUits([directUit]);
      setCurrentActiveUit(directUit);
      
      // Actualizăm și starea locală pentru UI
      setLocalSelectedUits([directUit]);
      setAvailableUits([directUit]);
      
      toast({
        title: "UIT setat",
        description: `UIT ${directUit.uit} configurat automat.`,
        duration: 3000
      });
    }
    
    // Continuăm cu încărcarea normală a UIT-urilor
    fetchUits(true);
  }, [token, vehicleInfo, setSelectedUits, setCurrentActiveUit]); // Adăugăm toate dependențele necesare
  
  // Efect pentru actualizarea periodică a transporturilor disponibile
  useEffect(() => {
    // Verificăm actualizări la fiecare 30 de secunde
    // (în producție, acest interval ar putea fi ajustat în funcție de cerințe)
    const POLLING_INTERVAL = 30 * 1000; // 30 secunde
    
    // Setăm intervalul doar dacă avem vehicleInfo și token valid
    if (vehicleInfo?.nr && token) {
      console.log("Configurăm actualizarea periodică a transporturilor disponibile");
      
      const intervalId = setInterval(() => {
        console.log("Actualizare periodică transporturi...");
        fetchUits(false); // Nu afișăm loading state pentru actualizările periodice
      }, POLLING_INTERVAL);
      
      // Cleanup la demontarea componentei
      return () => {
        console.log("Oprire actualizări periodice transporturi");
        clearInterval(intervalId);
      };
    }
    
    return undefined;
  }, [vehicleInfo, token]);

  // Funcție pentru adăugarea unui UIT în lista de selectate
  const addUit = () => {
    if (!currentUit) return;
    
    const uitToAdd = availableUits.find(uit => uit.uit === currentUit);
    
    if (uitToAdd && !localSelectedUits.some(u => u.uit === currentUit)) {
      const newSelectedUits = [...localSelectedUits, uitToAdd];
      setLocalSelectedUits(newSelectedUits);
      setSelectedUits(newSelectedUits);
      
      // Setăm primul UIT ca active dacă nu există altul activ
      if (newSelectedUits.length === 1) {
        setCurrentActiveUit(uitToAdd);
      }
      
      setCurrentUit("");
      
      toast({
        title: "UIT adăugat",
        description: `UIT ${uitToAdd.uit} a fost adăugat cu succes.`
      });
    }
  };

  // Funcție pentru eliminarea unui UIT din lista de selectate
  const removeUit = (uitToRemove: string) => {
    const newSelectedUits = localSelectedUits.filter(uit => uit.uit !== uitToRemove);
    setLocalSelectedUits(newSelectedUits);
    setSelectedUits(newSelectedUits);
    
    // Actualizăm UIT-ul activ dacă cel eliminat era activ
    if (newSelectedUits.length > 0) {
      setCurrentActiveUit(newSelectedUits[0]);
    } else {
      setCurrentActiveUit(null);
    }
    
    toast({
      variant: "default",
      title: "UIT eliminat",
      description: `UIT ${uitToRemove} a fost eliminat din selecție.`
    });
  };

  // Filtrăm UIT-urile care nu au fost deja selectate
  const availableForSelection = availableUits.filter(
    uit => !localSelectedUits.some(selectedUit => selectedUit.uit === uit.uit)
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Selectare UIT-uri</CardTitle>
        <CardDescription>
          Selectați unul sau mai multe UIT-uri pentru transport
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Se încarcă UIT-urile disponibile...</span>
          </div>
        ) : (
          <>
            {/* Selector pentru adăugarea unui nou UIT */}
            <div className="flex gap-2 mb-4">
              <Select 
                value={currentUit} 
                onValueChange={setCurrentUit}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selectează UIT" />
                </SelectTrigger>
                <SelectContent>
                  {availableForSelection.length > 0 ? (
                    availableForSelection.map(uit => (
                      <SelectItem key={uit.uit} value={uit.uit}>
                        {uit.uit} ({uit.start_locatie} - {uit.stop_locatie})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nu mai sunt UIT-uri disponibile
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={addUit} 
                disabled={!currentUit || availableForSelection.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" /> Adaugă
              </Button>
            </div>
            
            {/* Listă UIT-uri selectate */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-secondary-700">UIT-uri selectate:</h3>
              
              {localSelectedUits.length === 0 ? (
                <p className="text-sm text-secondary-500 italic py-2">
                  Nu ați selectat niciun UIT încă. Selectați cel puțin un UIT pentru a putea începe transportul.
                </p>
              ) : (
                <div className="space-y-2">
                  {localSelectedUits.map(uit => (
                    <div 
                      key={uit.uit}
                      className="flex justify-between items-center p-3 bg-secondary-50 rounded-md border border-secondary-200"
                    >
                      <div>
                        <p className="font-medium">{uit.uit}</p>
                        <p className="text-xs text-secondary-500">
                          {uit.start_locatie} → {uit.stop_locatie}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeUit(uit.uit)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}