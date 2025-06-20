/**
 * Application Logger Service
 * Captures console logs and stores them locally for AdminPanel viewing
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
  private readonly MAX_LOGS = 10000; // Maximum logs to store
  private logs: AppLog[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing logs from storage
      await this.loadLogs();

      // Override console methods to capture logs
      this.interceptConsole();

      this.initialized = true;
      this.log("INFO", "AppLogger initialized", "SYSTEM");
    } catch (error) {
      console.error("Failed to initialize AppLogger:", error);
    }
  }

  private async loadLogs(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value) {
        this.logs = JSON.parse(value);
      }
    } catch (error) {
      console.error("Failed to load logs from storage:", error);
      this.logs = [];
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      // Keep only the most recent logs
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }

      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(this.logs),
      });
    } catch (error) {
      console.error("Failed to save logs to storage:", error);
    }
  }

  private interceptConsole(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      this.log("INFO", args.join(" "), "APP");
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
    const logEntry: AppLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
    };

    this.logs.push(logEntry);
    this.saveLogs(); // Save immediately for persistence
  }

  async getLogs(): Promise<AppLog[]> {
    await this.loadLogs(); // Refresh from storage
    return [...this.logs].reverse(); // Most recent first
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    await this.saveLogs();
    this.log("INFO", "Logs cleared", "SYSTEM");
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

  logOfflineSync(message: string): void {
    this.log("INFO", message, "OFFLINE_SYNC");
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
export const logOfflineSync = (message: string) =>
  appLogger.logOfflineSync(message);
export const logAPI = (message: string) => appLogger.logAPI(message);
export const logAPIError = (message: string) => appLogger.logAPIError(message);
export const getAppLogs = () => appLogger.getLogs();
export const clearAppLogs = () => appLogger.clearLogs();
