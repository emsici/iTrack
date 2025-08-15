import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const VEHICLE_NUMBER_KEY = 'vehicle_number';

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

export const clearVehicleNumber = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: VEHICLE_NUMBER_KEY });
  } catch (error) {
    console.error('Error clearing vehicle number:', error);
    throw error;
  }
};
