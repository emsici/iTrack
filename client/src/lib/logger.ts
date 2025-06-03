// Logger pentru debugging GPS și funcționalități aplicație
class ApplicationLogger {
  private logs: string[] = [];
  private maxLogs = 1000;

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ` - ${JSON.stringify(data)}` : ''}`;
    
    this.logs.push(logEntry);
    console.log(logEntry);
    
    // Păstrează doar ultimele 1000 de loguri
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Salvează în localStorage pentru persistență
    localStorage.setItem('app_detailed_logs', JSON.stringify(this.logs));
  }

  error(message: string, error?: any) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    this.log(`ERROR: ${message}`, errorData);
  }

  gps(message: string, position?: any) {
    this.log(`GPS: ${message}`, position);
  }

  transport(message: string, data?: any) {
    this.log(`TRANSPORT: ${message}`, data);
  }

  permission(message: string, result?: any) {
    this.log(`PERMISSION: ${message}`, result);
  }

  getAllLogs(): string[] {
    return [...this.logs];
  }

  exportLogs(): string {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };

    const export_data = [
      '=== EXPORT LOGURI iTrack ===',
      `Export creat: ${systemInfo.timestamp}`,
      '',
      '=== INFORMAȚII SISTEM ===',
      JSON.stringify(systemInfo, null, 2),
      '',
      '=== LOGURI APLICAȚIE ===',
      ...this.logs
    ];

    return export_data.join('\n');
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_detailed_logs');
    this.log('Loguri curățate');
  }

  // Încarcă logurile salvate la pornirea aplicației
  loadSavedLogs() {
    try {
      const savedLogs = localStorage.getItem('app_detailed_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
        console.log(`Încărcate ${this.logs.length} loguri salvate`);
      }
    } catch (error) {
      console.error('Eroare la încărcarea logurilor salvate:', error);
    }
  }
}

export const logger = new ApplicationLogger();

// Încarcă logurile salvate la import
logger.loadSavedLogs();
logger.log('Logger inițializat');