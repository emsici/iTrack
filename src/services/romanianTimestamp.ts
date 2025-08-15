/**
 * Serviciu pentru timestamp-uri locale românești
 * GMT+2 (iarnă) / GMT+3 (vară) - Europe/Bucharest
 */

/**
 * Generează timestamp în formatul corect pentru România
 * Format: YYYY-MM-DD HH:mm:ss (ora locală României)
 */
export function getRomanianTimestamp(): string {
  const now = new Date();
  
  // Folosește Intl.DateTimeFormat pentru format precis cu Europe/Bucharest
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const timestamp = `${parts[0].value}-${parts[2].value}-${parts[4].value} ${parts[6].value}:${parts[8].value}:${parts[10].value}`;
  
  console.log(`🕒 TIMESTAMP ROMÂNIA: ${timestamp} (Europe/Bucharest)`);
  return timestamp;
}

/**
 * Obține data și ora curentă în România pentru debug
 */
export function getRomanianTimeInfo(): {
  timestamp: string;
  date: string;
  time: string;
  timezone: string;
} {
  const timestamp = getRomanianTimestamp();
  const date = timestamp.split(' ')[0];
  const time = timestamp.split(' ')[1];
  
  return {
    timestamp,
    date,
    time,
    timezone: 'Europe/Bucharest (GMT+2/+3)'
  };
}

/**
 * Verifică dacă România este în perioada de vară (GMT+3) sau iarnă (GMT+2)
 */
export function isRomanianSummerTime(): boolean {
  // România folosește GMT+3 în perioada de vară (martie-octombrie)
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 3 && month <= 10;
}