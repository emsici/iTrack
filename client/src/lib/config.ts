import { Capacitor } from '@capacitor/core';

// Configurarea URL-urilor pentru diferite medii
export const getApiBaseUrl = (): string => {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // Pentru aplicațiile native, folosim API-ul GPS direct
    // Doar pentru cererile de autentificare și management vehicule
    return 'https://www.euscagency.com/etsm3/platforme/transport/apk';
  } else {
    // Pentru browser, folosim URL-ul relativ (prin serverul Replit ca proxy)
    return '';
  }
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

// Verifică dacă suntem pe platformă nativă
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

console.log('[Config] Platform:', isNativePlatform() ? 'Native' : 'Browser');
console.log('[Config] Base URL:', getApiBaseUrl());