/**
 * SHARED TIMESTAMP SERVICE
 * Garantează că toate serviciile GPS folosesc același timestamp pentru un ciclu
 */

class SharedTimestampService {
  private currentSharedTimestamp: Date | null = null;
  private lastResetTime: number = 0;
  private readonly TIMESTAMP_VALIDITY_MS = 4000; // 4 secunde validitate

  /**
   * Obține timestamp-ul partajat pentru ciclul curent
   * Dacă nu există sau e expirat, creează unul nou
   */
  getSharedTimestamp(): Date {
    const now = Date.now();
    
    // Dacă nu avem timestamp sau a expirat, creează unul nou
    if (!this.currentSharedTimestamp || (now - this.lastResetTime) > this.TIMESTAMP_VALIDITY_MS) {
      this.currentSharedTimestamp = new Date();
      this.lastResetTime = now;
      console.log(`🕒 NEW SHARED TIMESTAMP created: ${this.currentSharedTimestamp.toISOString()}`);
    }
    
    return this.currentSharedTimestamp;
  }

  /**
   * Forțează resetarea timestamp-ului pentru următorul ciclu
   */
  resetTimestamp(): void {
    this.currentSharedTimestamp = null;
    this.lastResetTime = 0;
    console.log(`🔄 SHARED TIMESTAMP reset for next cycle`);
  }

  /**
   * Obține timestamp-ul ca string ISO
   */
  getSharedTimestampISO(): string {
    return this.getSharedTimestamp().toISOString();
  }

  /**
   * Verifică dacă timestamp-ul curent e valid
   */
  isTimestampValid(): boolean {
    if (!this.currentSharedTimestamp) return false;
    const now = Date.now();
    return (now - this.lastResetTime) <= this.TIMESTAMP_VALIDITY_MS;
  }
}

// Export singleton instance
export const sharedTimestampService = new SharedTimestampService();