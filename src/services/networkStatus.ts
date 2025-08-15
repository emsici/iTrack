/**
 * SISTEM REAL DE DETECTARE ONLINE/OFFLINE
 * Bazat pe erorile reale de transmisie GPS către server
 * Nu se bazează pe navigator.onLine care nu este precis
 */

import { logAPI } from './appLogger';

class NetworkStatusService {
  private isOnline: boolean = true;
  private lastSuccessfulTransmission: number = Date.now();
  private consecutiveFailures: number = 0;
  private statusCallbacks: ((isOnline: boolean) => void)[] = [];
  
  // Configurări
  private readonly OFFLINE_THRESHOLD_MS = 30000; // 30 secunde fără succes = offline
  private readonly MAX_CONSECUTIVE_FAILURES = 3; // 3 eșecuri consecutive = offline
  private readonly ONLINE_CONFIRMATION_DELAY = 2000; // 2 secunde după succes = online

  constructor() {
    logAPI('🌐 Serviciu status rețea inițializat - detectare bazată pe transmisiile GPS reale');
    
    // Verificare periodică a status-ului
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000); // La 5 secunde
  }

  /**
   * Raportează o transmisie GPS reușită
   */
  reportSuccessfulTransmission(): void {
    const wasOffline = !this.isOnline;
    
    this.lastSuccessfulTransmission = Date.now();
    this.consecutiveFailures = 0;
    
    if (wasOffline) {
      // Delay pentru a confirma că internetul este stabil
      setTimeout(() => {
        if (this.consecutiveFailures === 0) {
          this.setOnlineStatus(true);
          logAPI('🟢 INTERNET REVENIT - detectat prin transmisia GPS reușită');
        }
      }, this.ONLINE_CONFIRMATION_DELAY);
    } else if (!this.isOnline) {
      this.setOnlineStatus(true);
      logAPI('🟢 Internet confirmat ONLINE prin transmisia GPS');
    }
  }

  /**
   * Raportează o eroare de transmisie GPS
   */
  reportTransmissionError(error: any): void {
    this.consecutiveFailures++;
    
    console.error(`❌ Eroare transmisie GPS (#${this.consecutiveFailures}): ${error}`);
    
    // Verifică dacă este o eroare reală de rețea
    if (this.isNetworkError(error)) {
      logAPI(`🔴 EROARE REȚEA detectată - eșecuri consecutive: ${this.consecutiveFailures}`);
      
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.setOnlineStatus(false);
        logAPI('🔴 INTERNET PIERDUT - detectat prin erorile GPS consecutive');
      }
    }
  }

  /**
   * Verifică dacă eroarea este legată de rețea
   */
  private isNetworkError(error: any): boolean {
    const errorMessage = String(error).toLowerCase();
    
    // Erori comune de rețea
    const networkErrors = [
      'network error',
      'fetch failed',
      'connection timeout',
      'no internet',
      'network request failed',
      'unable to connect',
      'connection refused',
      'timeout',
      'net::err',
      'failed to fetch'
    ];
    
    return networkErrors.some(err => errorMessage.includes(err));
  }

  /**
   * Verificare periodică a status-ului bazată pe timpul ultimei transmisii
   */
  private checkNetworkStatus(): void {
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulTransmission;
    
    if (timeSinceLastSuccess > this.OFFLINE_THRESHOLD_MS && this.isOnline) {
      logAPI(`⚠️ ${timeSinceLastSuccess}ms fără transmisie GPS reușită - posibil offline`);
      
      if (this.consecutiveFailures > 0) {
        this.setOnlineStatus(false);
        logAPI('🔴 INTERNET PIERDUT - timeout + eșecuri de transmisie');
      }
    }
  }

  /**
   * Setează status-ul online/offline și notifică callback-urile
   */
  private setOnlineStatus(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      logAPI(`🌐 Status rețea schimbat: ${online ? 'ONLINE' : 'OFFLINE'}`);
      
      // Notifică toate callback-urile
      this.statusCallbacks.forEach(callback => {
        try {
          callback(online);
        } catch (error) {
          console.error(`Eroare în callback status rețea: ${error}`);
        }
      });
    }
  }

  /**
   * Înregistrează un callback pentru schimbările de status
   */
  onStatusChange(callback: (isOnline: boolean) => void): void {
    this.statusCallbacks.push(callback);
    // Apelează callback-ul imediat cu status-ul curent
    callback(this.isOnline);
  }

  /**
   * Elimină un callback
   */
  removeStatusCallback(callback: (isOnline: boolean) => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  /**
   * Obține status-ul curent
   */
  getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Obține informații detaliate despre status
   */
  getStatusInfo(): {
    isOnline: boolean;
    lastSuccessfulTransmission: number;
    consecutiveFailures: number;
    timeSinceLastSuccess: number;
  } {
    return {
      isOnline: this.isOnline,
      lastSuccessfulTransmission: this.lastSuccessfulTransmission,
      consecutiveFailures: this.consecutiveFailures,
      timeSinceLastSuccess: Date.now() - this.lastSuccessfulTransmission
    };
  }
}

// Instanță singleton
export const networkStatusService = new NetworkStatusService();

// Export helper functions
export const reportGPSSuccess = () => networkStatusService.reportSuccessfulTransmission();
export const reportGPSError = (error: any) => networkStatusService.reportTransmissionError(error);
export const onNetworkStatusChange = (callback: (isOnline: boolean) => void) => 
  networkStatusService.onStatusChange(callback);
export const isNetworkOnline = () => networkStatusService.getStatus();
export const getNetworkStatusInfo = () => networkStatusService.getStatusInfo();