import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';

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
