/**
 * ANDROID GPS CALLBACK HANDLER
 * Primește notificări de la serviciul Android GPS despre statusul transmisiilor
 * CRITICAL pentru detectarea corectă a statusului online/offline
 */

import { reportGPSSuccess, reportGPSError } from './networkStatus';
import { logAPI } from './appLogger';

class AndroidGPSCallbackService {
  
  constructor() {
    this.setupAndroidCallback();
  }

  /**
   * Configurează callback-urile pentru serviciul Android GPS
   */
  private setupAndroidCallback(): void {
    // Adaugă callback-ul global pentru Android GPS
    (window as any).AndroidGPSCallback = {
      onTransmissionSuccess: () => {
        logAPI('✅ ANDROID GPS SUCCESS - raporting la network status service');
        reportGPSSuccess();
      },
      
      onTransmissionError: (httpStatus: number) => {
        logAPI(`❌ ANDROID GPS ERROR ${httpStatus} - raporting la network status service`);
        reportGPSError(`Android GPS transmission failed with status ${httpStatus}`, httpStatus);
      }
    };

    logAPI('🔗 AndroidGPSCallback configurat - serviciul Android va raporta statusul transmisiilor');
  }

  /**
   * Verifică dacă callback-ul este configurat corect
   */
  isCallbackReady(): boolean {
    return !!(window as any).AndroidGPSCallback;
  }
}

// Export singleton instance
export const androidGPSCallbackService = new AndroidGPSCallbackService();

// Export helper pentru verificare
export const isAndroidGPSCallbackReady = () => androidGPSCallbackService.isCallbackReady();