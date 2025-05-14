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
    
    // Forțăm starea activă imediat
    forceTransportActive();
    console.log("[useForceTransportActive] Forțare inițială stare transport activ");
    
    // Setăm un interval pentru a menține starea activă
    const intervalId = setInterval(() => {
      if (transportStatus === 'active') {
        forceTransportActive();
        console.log("[useForceTransportActive] Forțare periodică stare transport activ");
      }
    }, 10000); // La fiecare 10 secunde
    
    // Cleanup la unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [transportStatus]);
}