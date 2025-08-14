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
   * Generează timestamp în formatul DD-MM-YYYY HH:mm:ss.mmm pentru România (cu sutimi)
   */
  getSharedTimestampRomania(): string {
    const timestamp = this.getSharedTimestamp();
    
    // Convertește la timezone-ul României (EET/EEST)
    const romaniaTime = new Date(timestamp.toLocaleString("en-US", {timeZone: "Europe/Bucharest"}));
    
    const day = String(romaniaTime.getDate()).padStart(2, '0');
    const month = String(romaniaTime.getMonth() + 1).padStart(2, '0');
    const year = romaniaTime.getFullYear();
    const hours = String(romaniaTime.getHours()).padStart(2, '0');
    const minutes = String(romaniaTime.getMinutes()).padStart(2, '0');
    const seconds = String(romaniaTime.getSeconds()).padStart(2, '0');
    const milliseconds = String(romaniaTime.getMilliseconds()).padStart(3, '0');
    
    const formattedTimestamp = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    
    console.log(`🕒 Generated Romania timestamp with milliseconds: ${formattedTimestamp}`);
    return formattedTimestamp;
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