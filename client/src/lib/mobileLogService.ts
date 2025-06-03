// Serviciu pentru gestionarea logurilor de pe dispozitivele mobile
import { LogEntry, addLog } from './logService';
import { isNativePlatform } from './capacitorService';
import { Capacitor } from '@capacitor/core';

// Prefixuri pentru identificarea logurilor din aplicația mobilă
const MOBILE_LOG_PREFIX = 'MOBILE_LOG:';

// Expresie regulată pentru a extrage date structurate din logurile mobile
const MOBILE_LOG_REGEX = /File: .* - Line \d+ - Msg: (.*)/;

// Funcție pentru analiza și extragerea informațiilor din logurile mobile
export const parseMobileLog = (log: string): { message: string, source: string } => {
  try {
    // Încercăm să extragem mesajul din log folosind regex-ul
    const match = log.match(MOBILE_LOG_REGEX);
    
    if (match && match[1]) {
      const message = match[1];
      
      // Încercăm să determinăm sursa log-ului
      const source = message.includes('GPS') ? 'gps' : 
                    message.includes('Transport') ? 'transport' :
                    message.includes('Conectivitate') ? 'conectivitate' :
                    message.includes('Baterie') ? 'baterie' :
                    message.includes('Eroare') ? 'error' :
                    'mobile';
      
      return { message, source };
    }
    
    // Dacă nu reușim să extragem formatul standard, returnăm logul așa cum este
    return { message: log, source: 'mobile-raw' };
  } catch (error) {
    console.error('Eroare la parsarea logului mobil:', error);
    return { message: log, source: 'mobile-error' };
  }
};

// Funcție pentru a procesa logurile primite de la dispozitive mobile
export const processMobileLog = (log: string): void => {
  try {
    // Verificăm dacă logul este pentru aplicația mobilă
    if (log.includes('Capacitor/Console') || log.includes('File:')) {
      const { message, source } = parseMobileLog(log);
      
      // Determinăm nivelul log-ului
      const level = source === 'error' ? 'error' : 
                  log.toLowerCase().includes('eroare') ? 'error' :
                  log.toLowerCase().includes('avertizare') ? 'warn' :
                  log.toLowerCase().includes('debug') ? 'debug' :
                  'info';
      
      // Adăugăm în sistemul de log
      addLog(message, level, 'mobile-' + source);
    }
  } catch (error) {
    console.error('Eroare la procesarea logului mobil:', error);
  }
};

// Funcție pentru a procesa fișiere de log primite de la dispozitivele mobile
export const processMobileLogFile = (content: string): LogEntry[] => {
  try {
    // Separăm conținutul pe linii
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const logs: LogEntry[] = [];
    
    // Procesăm fiecare linie
    for (const line of lines) {
      const { message, source } = parseMobileLog(line);
      
      // Determinăm nivelul log-ului
      const level = source === 'error' ? 'error' : 
                  line.toLowerCase().includes('eroare') ? 'error' :
                  line.toLowerCase().includes('avertizare') ? 'warn' :
                  line.toLowerCase().includes('debug') ? 'debug' :
                  'info';
      
      // Creăm intrarea de log
      const logEntry: LogEntry = {
        message,
        timestamp: new Date().toISOString(), // Folosim timestamp actual, dar ideal am extrage din log
        level: level as 'debug' | 'info' | 'warn' | 'error',
        source: 'mobile-' + source,
        details: line
      };
      
      // Adăugăm în lista de loguri
      logs.push(logEntry);
      
      // Opțional, adăugăm și în sistemul de log local
      addLog(message, level as 'debug' | 'info' | 'warn' | 'error', 'mobile-' + source, line);
    }
    
    return logs;
  } catch (error) {
    console.error('Eroare la procesarea fișierului de log mobil:', error);
    return [];
  }
};

// Funcție pentru a determina dacă device-ul curent este mobil
export const isMobileDevice = (): boolean => {
  return isNativePlatform() && (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios');
};

// Funcție pentru a trimite loguri către un server central (viitor)
export const sendLogsToServer = async (logs: LogEntry[]): Promise<boolean> => {
  try {
    // Implementare viitoare pentru trimiterea logurilor la un server central
    console.log(`[Mobile Logs] Loguri pregătite pentru trimitere: ${logs.length}`);
    return true;
  } catch (error) {
    console.error('Eroare la trimiterea logurilor către server:', error);
    return false;
  }
};