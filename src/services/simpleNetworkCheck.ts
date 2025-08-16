/**
 * SIMPLE NETWORK CHECK - Ping la server-ul utilizatorului
 * Înlocuiește networkStatus.ts complex cu verificare simplă
 */

class SimpleNetworkCheck {
  private isOnline: boolean = true;
  private callbacks: ((isOnline: boolean) => void)[] = [];
  private checkInterval: any = null;
  private readonly CHECK_INTERVAL_MS = 45000; // 45 secunde - evită conflictul cu GPS la 30s
  private readonly PING_URL = 'https://euscagency.com/etsm_prod/js/forms.js';

  constructor() {
    console.log('🌐 Simple Network Check inițializat - optimizat pentru GPS');
    this.startChecking();
  }

  /**
   * Pornește verificarea periodică de internet - OPTIMIZAT pentru GPS
   */
  private startChecking(): void {
    // OPTIMIZAT - verificare inițială după 10 secunde
    setTimeout(() => {
      this.checkConnection();
    }, 10000);
    
    // Verificare periodică la 45 secunde (evită conflictul cu GPS la 30s)
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Verificare simplă de conectivitate prin ping - SILENȚIOASĂ
   */
  private async checkConnection(): Promise<void> {
    try {
      // Log silențios pentru a nu interfera cu GPS logs
      
      // Ping simplu la server cu timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network check timeout')), 10000);
      });
      
      await Promise.race([
        fetch(this.PING_URL, {
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        }),
        timeoutPromise
      ]);
      
      // Dacă ajungem aici, avem internet
      if (!this.isOnline) {
        console.log('🟢 INTERNET RESTORED - server răspunde');
        this.setOnlineStatus(true);
      }
      
    } catch (error) {
      // Nu avem internet
      if (this.isOnline) {
        console.log('🔴 INTERNET LOST - server nu răspunde:', error);
        this.setOnlineStatus(false);
      }
    }
  }

  /**
   * Actualizează status-ul și notifică callback-urile
   */
  private setOnlineStatus(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      console.log(`📡 Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
      
      // Notifică toate callback-urile
      this.callbacks.forEach(callback => {
        try {
          callback(online);
        } catch (error) {
          console.error('Error in network callback:', error);
        }
      });
    }
  }

  /**
   * Înregistrează callback pentru schimbări de status
   */
  public onStatusChange(callback: (isOnline: boolean) => void): void {
    this.callbacks.push(callback);
    // Apelează imediat cu status-ul curent
    callback(this.isOnline);
  }

  /**
   * Obține status-ul curent
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Forțează o verificare imediată
   */
  public async forceCheck(): Promise<void> {
    await this.checkConnection();
  }

  /**
   * Oprește verificarea
   */
  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.callbacks = [];
  }
}

// Export singleton instance
export const simpleNetworkCheck = new SimpleNetworkCheck();