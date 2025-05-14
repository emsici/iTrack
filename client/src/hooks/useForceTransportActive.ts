// Hook pentru forțarea stării active a transportului
// Acest hook va asigura că transportul rămâne activ
// chiar și după reîncărcare sau după actualizarea stării GPS

import { useEffect } from 'react';
import { forceTransportActive } from '@/lib/transportHelper';
import type { TransportStatus } from '@/lib/stateManager';

/**
 * Hook pentru forțarea stării active a transportului
 * Se va executa la fiecare 10 secunde dacă transportul este activ
 * 
 * @param transportStatus Starea curentă a transportului
 * @returns void
 */
export function useForceTransportActive(transportStatus: TransportStatus) {
  useEffect(() => {
    // Activăm doar pentru starea "active"
    if (transportStatus !== 'active') {
      return;
    }
    
    // Forțăm starea activă imediat - implementare directă pentru evitarea referințelor circulare
    try {
      // Implementare alternativă pentru evitarea dependențelor circulare
      try {
        // Actualizăm localStorage direct
        const savedStateJson = localStorage.getItem('itrack_app_state');
        if (savedStateJson) {
          const savedState = JSON.parse(savedStateJson);
          
          // Forțăm starea activă
          const updatedState = {
            ...savedState,
            transportStatus: 'active'
          };
          
          localStorage.setItem('itrack_app_state', JSON.stringify(updatedState));
          localStorage.setItem('transport_status', 'active');
        }
      } catch (storageError) {
        console.error("[useForceTransportActive] Eroare la accesarea localStorage:", storageError);
      }
      
      console.log("[useForceTransportActive] Forțare inițială stare transport activ");
    } catch (error) {
      console.error("Eroare la forțarea inițială a transportului activ:", error);
    }
    
    // Setăm un interval pentru a menține starea activă
    const intervalId = setInterval(() => {
      if (transportStatus === 'active') {
        try {
          // Implementare alternativă directă, evitând dependența de forceTransportActive
          try {
            // Actualizăm localStorage direct
            const savedStateJson = localStorage.getItem('itrack_app_state');
            if (savedStateJson) {
              const savedState = JSON.parse(savedStateJson);
              
              // Forțăm starea activă
              const updatedState = {
                ...savedState,
                transportStatus: 'active'
              };
              
              localStorage.setItem('itrack_app_state', JSON.stringify(updatedState));
              localStorage.setItem('transport_status', 'active');
            }
          } catch (storageError) {
            console.error("[useForceTransportActive] Eroare la accesarea localStorage:", storageError);
          }
          
          console.log("[useForceTransportActive] Forțare periodică stare transport activ");
        } catch (error) {
          console.error("Eroare la forțarea periodică a transportului activ:", error);
        }
      }
    }, 10000); // La fiecare 10 secunde
    
    // Cleanup la unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [transportStatus]);
}