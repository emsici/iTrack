// Tipuri de status pentru transport
export type TransportStatus = "inactive" | "active" | "paused" | "finished";

// Informații despre transportul unui vehicul
export interface VehicleTransportInfo {
  vehicleNumber: string;         // Număr înmatriculare
  uit: string;                   // UIT asociat
  status: TransportStatus;       // Stare transport
  startTime: string;             // Momentul începerii
  lastUpdateTime: string;        // Ultima actualizare
}

// Cheia folosită pentru stocarea în localStorage
const TRANSPORT_REGISTRY_KEY = 'transport_registry';

/**
 * Obține toate transporturile active din registru
 */
export const getAllTransports = (): VehicleTransportInfo[] => {
  try {
    const data = localStorage.getItem(TRANSPORT_REGISTRY_KEY);
    if (!data) return [];
    
    return JSON.parse(data) as VehicleTransportInfo[];
  } catch (error) {
    console.error('Eroare la obținerea transporturilor:', error);
    return [];
  }
};

/**
 * Obține informațiile unui transport specific după numărul de înmatriculare
 */
export const getTransportByVehicle = (vehicleNumber: string): VehicleTransportInfo | undefined => {
  const transports = getAllTransports();
  return transports.find(t => t.vehicleNumber === vehicleNumber);
};

/**
 * Adaugă sau actualizează un transport în registru
 */
export const updateTransport = (transport: VehicleTransportInfo): void => {
  try {
    const transports = getAllTransports();
    const index = transports.findIndex(t => t.vehicleNumber === transport.vehicleNumber);
    
    if (index >= 0) {
      // Actualizăm transportul existent
      transports[index] = transport;
    } else {
      // Adăugăm un nou transport
      transports.push(transport);
    }
    
    localStorage.setItem(TRANSPORT_REGISTRY_KEY, JSON.stringify(transports));
    console.log(`Transport ${transport.vehicleNumber} actualizat în registru:`, transport.status);
  } catch (error) {
    console.error('Eroare la actualizarea transportului:', error);
  }
};

/**
 * Elimină un transport din registru
 */
export const removeTransport = (vehicleNumber: string): void => {
  try {
    const transports = getAllTransports();
    const filteredTransports = transports.filter(t => t.vehicleNumber !== vehicleNumber);
    
    localStorage.setItem(TRANSPORT_REGISTRY_KEY, JSON.stringify(filteredTransports));
    console.log(`Transport ${vehicleNumber} eliminat din registru`);
  } catch (error) {
    console.error('Eroare la eliminarea transportului:', error);
  }
};

/**
 * Verifică dacă există un transport activ pentru vehiculul dat
 */
export const hasActiveTransport = (vehicleNumber: string): boolean => {
  const transport = getTransportByVehicle(vehicleNumber);
  return !!transport && (transport.status === 'active' || transport.status === 'paused');
};

/**
 * Verifică dacă există alte transporturi active în afară de vehiculul curent
 */
export const hasOtherActiveTransports = (currentVehicleNumber: string): boolean => {
  const transports = getAllTransports();
  return transports.some(t => 
    t.vehicleNumber !== currentVehicleNumber && 
    (t.status === 'active' || t.status === 'paused')
  );
};

/**
 * Sincronizează informațiile de transport cu starea curentă
 * 
 * Când schimbăm vehiculul, actualizăm vehicleInfo dar vrem să păstrăm starea transportului
 * pentru vehiculul curent în registru.
 */
export const syncTransportWithRegistry = (
  vehicleNumber: string, 
  curStatus: TransportStatus,
  curUit: string,
  onStatusChange: (status: TransportStatus) => void
): void => {
  const storedTransport = getTransportByVehicle(vehicleNumber);
  
  if (storedTransport) {
    // Există un transport în registru pentru acest vehicul
    console.log(`Sincronizare transport pentru ${vehicleNumber}: ${storedTransport.status}`);
    
    // Actualizăm starea din UI cu cea din registru
    if (curStatus !== storedTransport.status) {
      onStatusChange(storedTransport.status);
    }
  } else {
    // Nu există transport în registru, setăm starea la inactiv
    if (curStatus !== 'inactive') {
      onStatusChange('inactive');
    }
  }
};