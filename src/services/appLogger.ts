/**
 * Serviciu Logger Aplicație
 * Capturează logurile din consolă și le stochează local pentru vizualizarea în AdminPanel
 */

import { Preferences } from "@capacitor/preferences";

export interface AppLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  category?: string;
}

class AppLoggerService {
  private readonly STORAGE_KEY = "app_logs";
  private readonly MAX_LOGS = 1000; // Redus pentru performanță
  // private readonly BATCH_SIZE = 50; // Pentru funcții viitoare de batch logging
  private readonly BATCH_INTERVAL = 30000; // Sau la fiecare 30 secunde
  private logs: AppLog[] = [];
  private pendingLogs: AppLog[] = [];
  private initialized = false;
  private saveTimer: NodeJS.Timeout | null = null;
  private isProductionMode = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Detectează environment pentru control logging
      this.isProductionMode = !import.meta.env.DEV && import.meta.env.MODE === 'production';
      
      // La instalare nouă, șterge logurile vechi
      await this.clearOldLogsOnNewInstall();
      
      // Încarcă logurile existente din stocare
      await this.loadLogs();

      // ACTIVEAZĂ logging întotdeauna pentru debugging GPS
      this.interceptConsole();
      
      // Pornește timer pentru salvare batch
      this.startBatchSaveTimer();

      this.initialized = true;
      this.log("INFO", `Logger inițializat - mode: ${this.isProductionMode ? 'PRODUCȚIE' : 'DEZVOLTARE'} (FORȚAT ACTIV)`, "SYSTEM");
    } catch (error) {
      console.error("Eroare inițializare Logger aplicație:", error);
    }
  }

  private async clearOldLogsOnNewInstall(): Promise<void> {
    try {
      // Verifică dacă este instalare nouă sau aplicația a fost reinstalată
      const appVersion = "v1.0.0"; // Poți modifica această versiune când faci update-uri
      const { value: storedVersion } = await Preferences.get({ key: "app_version" });
      
      if (!storedVersion || storedVersion !== appVersion) {
        // Este instalare nouă sau versiune diferită - șterge logurile vechi
        await Preferences.remove({ key: this.STORAGE_KEY });
        await Preferences.set({ key: "app_version", value: appVersion });
        this.logs = [];
        console.log("🧹 Loguri vechi șterse la instalare nouă/update aplicație");
      }
    } catch (error) {
      console.error("Eroare ștergere loguri vechi:", error);
    }
  }

  private async loadLogs(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value) {
        this.logs = JSON.parse(value);
      }
    } catch (error) {
      console.error("Eroare încărcare log-uri din stocare:", error);
      this.logs = [];
    }
  }

  private startBatchSaveTimer(): void {
    this.saveTimer = setInterval(() => {
      this.flushPendingLogs();
    }, this.BATCH_INTERVAL);
  }

  private async flushPendingLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    try {
      // Adaugă pending logs la logs principale
      this.logs.push(...this.pendingLogs);
      this.pendingLogs = [];

      // Păstrează doar logurile cele mai recente
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }

      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(this.logs),
      });
    } catch (error) {
      console.error("Eroare salvare batch log-uri:", error);
    }
  }

  private async saveLogs(): Promise<void> {
    // Folosit doar pentru clearLogs și cleanup final
    await this.flushPendingLogs();
  }

  private interceptConsole(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Throttling pentru a evita spam de loguri
    let lastLogTime = 0;
    const LOG_THROTTLE_MS = 100; // Maximum 10 logs per second

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      const now = Date.now();
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        this.log("INFO", args.join(" "), "APP");
        lastLogTime = now;
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      this.log("WARN", args.join(" "), "APP");
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      this.log("ERROR", args.join(" "), "APP");
    };
  }

  log(
    level: "INFO" | "WARN" | "ERROR" | "DEBUG",
    message: string,
    category: string = "APP",
  ): void {
    // LOGHEAZĂ TOATE NIVELURILE pentru debugging GPS (comentat pentru producție)
    // if (this.isProductionMode && level !== "ERROR") {
    //   return;
    // }

    const logEntry: AppLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
    };

    // Adaugă în pending batch și FLUSH IMEDIAT pentru debugging
    this.pendingLogs.push(logEntry);
    
    // FLUSH IMEDIAT pentru a vedea logurile instant
    this.flushPendingLogs();
  }

  async getLogs(): Promise<AppLog[]> {
    await this.loadLogs(); // Refresh from storage
    return [...this.logs].reverse(); // Most recent first
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    this.pendingLogs = [];
    await this.saveLogs();
    this.log("INFO", "Logs cleared", "SYSTEM");
  }

  // Cleanup pentru timer când aplicația se închide
  cleanup(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    // Flush toate logurile pending înainte de închidere
    this.flushPendingLogs();
  }

  async getLogsCount(): Promise<number> {
    await this.loadLogs();
    return this.logs.length;
  }

  // Helper methods for specific GPS logging
  logGPS(message: string): void {
    this.log("INFO", message, "GPS");
  }

  logGPSError(message: string): void {
    this.log("ERROR", message, "GPS");
  }



  logAPI(message: string): void {
    this.log("INFO", message, "API");
  }

  logAPIError(message: string): void {
    this.log("ERROR", message, "API");
  }
}

export const appLogger = new AppLoggerService();

// Auto-initialize when service is imported
appLogger.init();

// Export helper functions
export const logGPS = (message: string) => appLogger.logGPS(message);
export const logGPSError = (message: string) => appLogger.logGPSError(message);

export const logAPI = (message: string) => appLogger.logAPI(message);
export const logAPIError = (message: string) => appLogger.logAPIError(message);
export const getAppLogs = () => appLogger.getLogs();
export const clearAppLogs = () => appLogger.clearLogs();
