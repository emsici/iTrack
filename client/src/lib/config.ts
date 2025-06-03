import { Capacitor } from '@capacitor/core';

// Configurarea URL-urilor pentru diferite medii
export const getApiBaseUrl = (): string => {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // Pentru aplicațiile native, folosim URL-ul Replit complet
    return 'https://rest-express--euscagency.replit.app';
  } else {
    // Pentru browser, folosim URL-ul relativ
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