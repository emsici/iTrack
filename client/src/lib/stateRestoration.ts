import { UitOption } from "@/context/TransportContext";
import { getActiveUit, getTransportState, getSelectedUits } from "./offlineStorage";
import { toast } from "@/hooks/use-toast";

export interface RestoredState {
  transportState: string | null;
  activeUit: UitOption | null;
  selectedUits: UitOption[];
}

/**
 * Verifică dacă există o stare salvată și o returnează
 * Aceasta va fi folosită pentru a restaura starea în mod controlat
 */
export const checkSavedState = (): RestoredState => {
  // Obținem toate datele salvate
  const transportState = getTransportState();
  const activeUit = getActiveUit();
  const selectedUits = getSelectedUits();
  
  // Logăm ce am găsit pentru debugging
  if (transportState) {
    console.log(`[State Restoration] Stare transport găsită: ${transportState}`);
  }
  
  if (activeUit) {
    console.log(`[State Restoration] UIT activ găsit: ${activeUit.uit}`);
  }
  
  if (selectedUits.length > 0) {
    console.log(`[State Restoration] ${selectedUits.length} UIT-uri găsite în stocarea locală`);
  }
  
  // Verificăm dacă avem o stare activă sau pauză
  const hasActiveState = transportState === "active" || transportState === "paused";
  
  // Notificăm utilizatorul dacă există un transport activ
  if (hasActiveState && activeUit) {
    // Întârziere pentru a asigura că UI-ul e pregătit
    setTimeout(() => {
      toast({
        title: "Sesiune restaurată",
        description: `Transport ${transportState} restaurat pentru UIT: ${activeUit.uit}`,
      });
    }, 1000);
  }
  
  return {
    transportState,
    activeUit,
    selectedUits
  };
};

/**
 * Funcție pentru a verifica dacă ar trebui să pornim tracking-ul GPS la restaurare
 */
export const shouldStartGpsOnRestore = (restoredState: RestoredState): boolean => {
  // Pornim GPS DOAR dacă avem un transport activ
  return restoredState.transportState === "active" && !!restoredState.activeUit;
};