import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const VEHICLE_NUMBER_KEY = 'vehicle_number';
const VEHICLE_HISTORY_KEY = 'vehicle_number_history';

/**
 * Salvează token-ul de autentificare în storage-ul persistent
 * @param token - Token-ul JWT primit de la server
 * @throws Error dacă salvarea eșuează
 * @description AVERTISMENT SECURITATE: Token stocat NECRIPTAT în Preferences
 * 
 * PROBLEMĂ CRITICĂ DE SECURITATE:
 * - Token JWT stocat în plain text în SharedPreferences Android
 * - Vulnerabil la accese neautorizate dacă device compromis
 * - Nu respectă best practices pentru aplicații enterprise
 * 
 * SOLUȚIE RECOMANDATĂ:
 * - Implementare @aparajita/capacitor-secure-storage sau @capawesome/capacitor-secure-storage
 * - AES-256 encryption cu Android KeyStore hardware-backed protection
 * - Optional: biometric authentication pentru acces token
 * 
 * PENTRU PRODUCȚIE: Înlocuiește cu secure storage pentru aplicații enterprise
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    await Preferences.set({
      key: TOKEN_KEY,
      value: token
    });
  } catch (error) {
    console.error('Eroare stocare token:', error);
    throw error;
  }
};

/**
 * Recuperează token-ul de autentificare din storage
 * @returns Promise<string | null> - Token-ul salvat sau null dacă nu există
 * @description Graceful degradation - returnează null în caz de eroare
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const result = await Preferences.get({ key: TOKEN_KEY });
    return result.value;
  } catch (error) {
    console.error('Eroare citire token stocat:', error);
    return null;
  }
};

export const clearToken = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: TOKEN_KEY });
  } catch (error) {
    console.error('Eroare ștergere token:', error);
    throw error;
  }
};

/**
 * Salvează numărul vehiculului și actualizează istoricul
 * @param vehicleNumber - Numărul de înmatriculare al vehiculului
 * @throws Error dacă salvarea eșuează
 * @description Salvează vehiculul curent și îl adaugă în istoric (maxim 5)
 */
export const storeVehicleNumber = async (vehicleNumber: string): Promise<void> => {
  try {
    await Preferences.set({
      key: VEHICLE_NUMBER_KEY,
      value: vehicleNumber
    });
    
    // Store vehicle number in history for dropdown
    const history = await getVehicleNumberHistory();
    if (!history.includes(vehicleNumber)) {
      const updatedHistory = [vehicleNumber, ...history.slice(0, 4)]; // Keep last 5
      await Preferences.set({ key: VEHICLE_HISTORY_KEY, value: JSON.stringify(updatedHistory) });
    }
  } catch (error) {
    console.error('Eroare stocare număr vehicul:', error);
    throw error;
  }
};

export const getStoredVehicleNumber = async (): Promise<string | null> => {
  try {
    const result = await Preferences.get({ key: VEHICLE_NUMBER_KEY });
    return result.value;
  } catch (error) {
    console.error('Eroare citire număr vehicul stocat:', error);
    return null;
  }
};

export const clearStoredVehicleNumber = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: VEHICLE_NUMBER_KEY });
  } catch (error) {
    console.error('Eroare ștergere număr vehicul stocat:', error);
    throw error;
  }
};

// Vehicle number history functions for dropdown
/**
 * Recuperează istoricul numerelor de vehicule cu validare
 * @returns Promise<string[]> - Lista cu numerele valide din istoric
 * @description Filtrează automat numerele invalide (IL02ADD, undefined, null)
 */
export const getVehicleNumberHistory = async (): Promise<string[]> => {
  try {
    const result = await Preferences.get({ key: VEHICLE_HISTORY_KEY });
    if (result.value) {
      const history = JSON.parse(result.value);
      // CRITICĂ: Filtrează numerele invalide din istoric (inclusiv IL02ADD)
      const validHistory = history.filter((num: string) => 
        num && 
        num.trim() && 
        num.trim() !== 'IL02ADD' && 
        num.trim() !== 'undefined' && 
        num.trim() !== 'null' &&
        num.trim().length > 2
      );
      
      // Dacă istoricul s-a schimbat, salvează varianta curățată
      if (validHistory.length !== history.length) {
        console.log(`Număre invalide eliminate din istoric: ${history.length - validHistory.length}`);
        await Preferences.set({ key: VEHICLE_HISTORY_KEY, value: JSON.stringify(validHistory) });
      }
      
      return validHistory;
    }
    return [];
  } catch (error) {
    console.error('Eroare citire istoric număr vehicul:', error);
    return [];
  }
};

export const removeVehicleNumberFromHistory = async (vehicleNumber: string): Promise<void> => {
  try {
    const history = await getVehicleNumberHistory();
    const updatedHistory = history.filter(num => num !== vehicleNumber);
    await Preferences.set({ 
      key: VEHICLE_HISTORY_KEY, 
      value: JSON.stringify(updatedHistory) 
    });
  } catch (error) {
    console.error('Eroare eliminare număr vehicul din istoric:', error);
    throw error;
  }
};