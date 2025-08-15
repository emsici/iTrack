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
  
  // Configurări pentru detectare precisă - OPTIMIZAT pentru serviciul Android independent
  private readonly OFFLINE_THRESHOLD_MS = 120000; // 120 secunde (2 min) - mai mult timp pentru Android GPS independent
  private readonly MAX_CONSECUTIVE_FAILURES = 5; // 5 eșecuri consecutive = offline (mai tolerant)
  // Removed unused ONLINE_CONFIRMATION_DELAY
  private readonly STATUS_CHECK_INTERVAL = 10000; // Verificare la 10 secunde (mai puțin agresiv)

  constructor() {
    logAPI('🌐 Serviciu status rețea inițializat - detectare bazată pe transmisiile GPS reale');
    
    // Verificare periodică rapidă pentru detectare imediată
    setInterval(() => {
      this.checkNetworkStatus();
    }, this.STATUS_CHECK_INTERVAL); // La 3 secunde pentru răspuns rapid
  }

  /**
   * Raportează o transmisie GPS reușită - EFICIENȚĂ MAXIMĂ
   */
  reportSuccessfulTransmission(): void {
    const wasOffline = !this.isOnline;
    
    this.lastSuccessfulTransmission = Date.now();
    this.consecutiveFailures = 0;
    
    // EFICIENT: Dacă era offline și acum primim 200 de la GPS, suntem online
    if (wasOffline) {
      this.setOnlineStatus(true);
      logAPI('🟢 INTERNET REVENIT - confirmat prin gps.php răspuns 200');
    } else if (!this.isOnline) {
      this.setOnlineStatus(true);
      logAPI('🟢 Internet confirmat ONLINE prin gps.php răspuns 200');
    }
  }

  /**
   * Raportează o eroare de transmisie GPS - EFICIENȚĂ MAXIMĂ
   * Verifică direct status HTTP de la gps.php
   */
  reportTransmissionError(error: any, httpStatus?: number): void {
    this.consecutiveFailures++;
    
    console.error(`❌ Eroare transmisie GPS (#${this.consecutiveFailures}): ${error}`);
    
    // EFICIENT: Dacă gps.php nu returnează 200, probabil suntem offline
    if (httpStatus && httpStatus !== 200) {
      logAPI(`🔴 GPS.PHP STATUS ${httpStatus} - posibil offline (eșecuri: ${this.consecutiveFailures})`);
      
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.setOnlineStatus(false);
        logAPI('🔴 INTERNET PIERDUT - confirmat prin gps.php status non-200');
      }
    } else if (this.isNetworkError(error)) {
      // Fallback pentru alte erori de rețea
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
   * FIX: Resetare forțată la offline când nu există internet real
   */
  private checkNetworkStatus(): void {
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulTransmission;
    
    // FORȚARE OFFLINE dacă nu există conexiune browser
    if (!navigator.onLine && this.isOnline) {
      this.setOnlineStatus(false);
      logAPI('🔴 INTERNET PIERDUT - navigator.onLine false');
      return;
    }
    
    if (timeSinceLastSuccess > this.OFFLINE_THRESHOLD_MS && this.isOnline) {
      logAPI(`⚠️ ${timeSinceLastSuccess}ms fără transmisie GPS reușită - verificăm dacă Android GPS funcționează`);
      
      // MODIFICAT: Nu declara offline doar pentru că nu avem transmisii
      // Serviciul Android poate trimite direct fără să raporteze în frontend
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.setOnlineStatus(false);
        logAPI('🔴 INTERNET PIERDUT - multiple eșecuri confirmate de transmisie');
      } else {
        logAPI('🟡 Timeout transmisie dar fără eșecuri - serviciul Android poate funcționa independent');
      }
    }
    
    // ELIMINAT: Test ping suplimentar - gps.php este suficient pentru verificare
  }
  
  /**
   * ELIMINAT: Test suplimentar de conectivitate
   * MOTIVAȚIE: gps.php răspunsul este cea mai eficientă verificare
   */

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

// OPTIMIZAT: Export helper functions cu verificare eficientă prin HTTP status
export const reportGPSSuccess = () => networkStatusService.reportSuccessfulTransmission();
export const reportGPSError = (error: any, httpStatus?: number) => networkStatusService.reportTransmissionError(error, httpStatus);
export const onNetworkStatusChange = (callback: (isOnline: boolean) => void) => 
  networkStatusService.onStatusChange(callback);
export const isNetworkOnline = () => networkStatusService.getStatus();
export const getNetworkStatusInfo = () => networkStatusService.getStatusInfo();