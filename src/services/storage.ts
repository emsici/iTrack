import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const VEHICLE_NUMBER_KEY = 'vehicle_number';
const VEHICLE_HISTORY_KEY = 'vehicle_number_history';

export const storeToken = async (token: string): Promise<void> => {
  try {
    await Preferences.set({
      key: TOKEN_KEY,
      value: token
    });
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    const result = await Preferences.get({ key: TOKEN_KEY });
    return result.value;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const clearToken = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: TOKEN_KEY });
  } catch (error) {
    console.error('Error clearing token:', error);
    throw error;
  }
};

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
    console.error('Error storing vehicle number:', error);
    throw error;
  }
};

export const getStoredVehicleNumber = async (): Promise<string | null> => {
  try {
    const result = await Preferences.get({ key: VEHICLE_NUMBER_KEY });
    return result.value;
  } catch (error) {
    console.error('Error getting stored vehicle number:', error);
    return null;
  }
};



// Vehicle number history functions for dropdown
export const getVehicleNumberHistory = async (): Promise<string[]> => {
  try {
    const result = await Preferences.get({ key: VEHICLE_HISTORY_KEY });
    if (result.value) {
      const history = JSON.parse(result.value);
      // CRITICĂ: Filtrează numerele invalide din istoric (inclusiv IL02ADD)
      const validHistory = history.filter((v: string) => 
        v && 
        v.trim() && 
        v.trim() !== 'IL02ADD' && 
        v.trim() !== 'undefined' && 
        v.trim() !== 'null' &&
        v.trim().length > 2
      );
      
      // Dacă istoricul s-a schimbat, salvează varianta curățată
      if (validHistory.length !== history.length) {
        console.log(`🗑️ Număre invalide eliminate din istoric: ${history.length - validHistory.length}`);
        await Preferences.set({ key: VEHICLE_HISTORY_KEY, value: JSON.stringify(validHistory) });
      }
      
      return validHistory;
    }
    return [];
  } catch (error) {
    console.error('Error getting vehicle number history:', error);
    return [];
  }
};

export const removeVehicleNumberFromHistory = async (vehicleNumber: string): Promise<void> => {
  try {
    const history = await getVehicleNumberHistory();
    const updatedHistory = history.filter(v => v !== vehicleNumber);
    await Preferences.set({ key: VEHICLE_HISTORY_KEY, value: JSON.stringify(updatedHistory) });
  } catch (error) {
    console.error('Error removing vehicle number from history:', error);
    throw error;
  }
};

export const clearStoredVehicleNumber = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: VEHICLE_NUMBER_KEY });
    console.log('🗑️ Numărul vehiculului șters din storage');
  } catch (error) {
    console.error('Error clearing stored vehicle number:', error);
    throw error;
  }
};
