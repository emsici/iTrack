// Serviciu pentru gestionarea și vizualizarea logurilor

// Interfață pentru formatul logurilor
export interface LogEntry {
  message: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  details?: any;
}

// Stocăm logurile în localStorage pentru a putea fi accesate
const LOGS_STORAGE_KEY = 'itrack_logs';
const MAX_LOGS = 1000; // Numărul maxim de loguri stocate pentru a evita umplerea memoriei

// Salvăm referințele către metodele originale ale consolei
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  info: console.info
};

// Funcție pentru adăugarea unui log
export const addLog = (
  message: string, 
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  source: string = 'app',
  details?: any
): void => {
  try {
    // Creăm intrarea de log
    const logEntry: LogEntry = {
      message,
      timestamp: new Date().toISOString(),
      level,
      source,
      details: details ? JSON.stringify(details) : undefined
    };
    
    // Obținem logurile existente
    const existingLogs = getLogs();
    
    // Adăugăm noul log
    existingLogs.push(logEntry);
    
    // Păstrăm doar ultimele MAX_LOGS loguri
    const trimmedLogs = existingLogs.slice(-MAX_LOGS);
    
    // Salvăm logurile actualizate
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));
    
    // Afișăm și în consolă pentru debugging direct
    const logMethod = level === 'error' ? originalConsole.error : 
                     level === 'warn' ? originalConsole.warn : 
                     level === 'debug' ? originalConsole.debug : 
                     originalConsole.log;
    
    logMethod(`[${source}] ${message}`, details || '');
  } catch (error) {
    originalConsole.error('Eroare la adăugarea logului:', error);
  }
};

// Funcție pentru a intercepta toate apelurile console.* și a le stoca în localStorage
export const setupConsoleInterceptor = (): void => {
  // Înlocuim console.log
  console.log = function(...args: any[]) {
    // Apelăm metoda originală pentru a vedea output-ul în consolă
    originalConsole.log.apply(console, args);
    
    // Transformăm argumentele într-un mesaj text
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    // Adăugăm în log
    addLog(message, 'info', 'console');
  };
  
  // Înlocuim console.error
  console.error = function(...args: any[]) {
    originalConsole.error.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    addLog(message, 'error', 'console');
  };
  
  // Înlocuim console.warn
  console.warn = function(...args: any[]) {
    originalConsole.warn.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    addLog(message, 'warn', 'console');
  };
  
  // Înlocuim console.debug
  console.debug = function(...args: any[]) {
    originalConsole.debug.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    addLog(message, 'debug', 'console');
  };
  
  // Înlocuim console.info
  console.info = function(...args: any[]) {
    originalConsole.info.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    addLog(message, 'info', 'console');
  };
  
  // Adăugăm un handler pentru erorile globale
  window.addEventListener('error', (event) => {
    addLog(`Eroare globală: ${event.message}`, 'error', 'window', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });
  
  // Adăugăm un handler pentru promise-uri negestionate
  window.addEventListener('unhandledrejection', (event) => {
    addLog(`Promise respins netratat: ${event.reason}`, 'error', 'promise', {
      reason: String(event.reason),
      stack: event.reason?.stack
    });
  });
  
  addLog('Interceptor pentru consolă instalat', 'info', 'system');
};

// Funcție pentru obținerea tuturor logurilor
export const getLogs = (): LogEntry[] => {
  try {
    const logsJson = localStorage.getItem(LOGS_STORAGE_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error('Eroare la obținerea logurilor:', error);
    return [];
  }
};

// Funcție pentru ștergerea tuturor logurilor
export const clearLogs = (): void => {
  localStorage.removeItem(LOGS_STORAGE_KEY);
};

// Funcție pentru filtrarea logurilor după nivel
export const filterLogsByLevel = (level: 'debug' | 'info' | 'warn' | 'error'): LogEntry[] => {
  const logs = getLogs();
  return logs.filter(log => log.level === level);
};

// Funcție pentru filtrarea logurilor după sursă
export const filterLogsBySource = (source: string): LogEntry[] => {
  const logs = getLogs();
  return logs.filter(log => log.source === source);
};

// Funcție pentru exportul logurilor ca JSON
export const exportLogsAsJson = (): string => {
  const logs = getLogs();
  return JSON.stringify(logs, null, 2);
};

// Funcție pentru verificarea dacă utilizatorul are drepturi de admin
export const isAdminUser = (email: string, password: string): boolean => {
  // Credențialele pentru utilizatorul admin - într-o aplicație reală acestea ar fi stocate securizat
  const ADMIN_EMAIL = 'admin@itrack.app';
  const ADMIN_PASSWORD = 'admin123';
  
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
};