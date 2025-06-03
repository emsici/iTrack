import { Capacitor } from '@capacitor/core';

// Configurarea URL-urilor pentru diferite medii
export const getApiBaseUrl = (): string => {
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // Pentru aplicațiile native, folosim URL-ul Replit complet
    // IMPORTANT: Acest URL trebuie să fie URL-ul public al aplicației Replit
    return window.location.origin.includes('replit.app') 
      ? window.location.origin 
      : 'https://rest-express--euscagency.replit.app';
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