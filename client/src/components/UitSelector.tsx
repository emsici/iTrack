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
  const { token } = useAuth();
  const { setSelectedUits, setCurrentActiveUit } = useTransport();
  const [isLoading, setIsLoading] = useState(false);
  const [availableUits, setAvailableUits] = useState<UitOption[]>([]);
  const [localSelectedUits, setLocalSelectedUits] = useState<UitOption[]>([]);
  const [currentUit, setCurrentUit] = useState<string>("");

  const { vehicleInfo } = useAuth();

  // Obținem lista de UIT-uri disponibile la încărcarea componentei
  useEffect(() => {
    const fetchUits = async () => {
      setIsLoading(true);
      try {
        // În implementarea reală, aici ar trebui să faceți un apel API pentru a obține UIT-urile disponibile
        // Preluăm UIT-urile disponibile - ne asigurăm că UIT12345 este primul, pentru a se potrivi cu vehicleInfo
        const mockUits: UitOption[] = [
          { uit: "UIT12345", start_locatie: "București", stop_locatie: "Cluj" },
          { uit: "UIT56789", start_locatie: "Oradea", stop_locatie: "Arad" },
          { uit: "UIT23456", start_locatie: "Cluj", stop_locatie: "Timișoara" },
          { uit: "UIT34567", start_locatie: "Iași", stop_locatie: "Constanța" },
          { uit: "UIT45678", start_locatie: "Brașov", stop_locatie: "Sibiu" }
        ];
        
        // Simulăm un răspuns de la API
        setTimeout(() => {
          setAvailableUits(mockUits);
          setIsLoading(false);
          
          // Adăugăm automat UIT-ul din vehicleInfo dacă există
          if (vehicleInfo && vehicleInfo.uit) {
            const uitFromVehicle = mockUits.find(uit => uit.uit === vehicleInfo.uit);
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
        }, 500);
      } catch (error) {
        console.error("Eroare la obținerea UIT-urilor:", error);
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu s-au putut încărca UIT-urile disponibile."
        });
        setIsLoading(false);
      }
    };

    fetchUits();
  }, [token]);

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