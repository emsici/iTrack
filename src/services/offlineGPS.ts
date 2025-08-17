/**
 * Serviciu de gestionare coordonate GPS offline
 * Integrare cu BackgroundGPSService pentru sincronizare automată
 */

import { CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { API_BASE_URL } from './api';

export interface OfflineGPSCoordinate {
  id: string;
  uit: string;
  numar_inmatriculare: string;
  lat: number;
  lng: number;
  viteza: number;
  directie: number;
  altitudine: number;
  hdop: number;
  gsm_signal: number;
  baterie: number;
  status: number;
  timestamp: string;
  attempts: number;
  lastAttempt: string;
}

export interface OfflineSyncStats {
  totalOffline: number;
  totalSynced: number;
  syncInProgress: boolean;
  lastSyncAttempt: Date | null;
  syncErrors: number;
  currentBatch: number;
  totalBatches: number;
}

class OfflineGPSService {
  private static instance: OfflineGPSService;
  private readonly STORAGE_KEY = 'offline_gps_coordinates';
  private readonly MAX_BATCH_SIZE = 50;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private syncListeners: ((stats: OfflineSyncStats) => void)[] = [];
  private currentStats: OfflineSyncStats = {
    totalOffline: 0,
    totalSynced: 0,
    syncInProgress: false,
    lastSyncAttempt: null,
    syncErrors: 0,
    currentBatch: 0,
    totalBatches: 0
  };

  public static getInstance(): OfflineGPSService {
    if (!OfflineGPSService.instance) {
      OfflineGPSService.instance = new OfflineGPSService();
    }
    return OfflineGPSService.instance;
  }

  constructor() {
    this.loadStats();
    // Setup global bridge pentru BackgroundGPSService
    (window as any).saveOfflineGPS = this.saveOfflineCoordinate.bind(this);
  }

  // Salvează coordonate GPS când transmisia eșuează
  async saveOfflineCoordinate(gpsData: any): Promise<void> {
    try {
      const coordinate: OfflineGPSCoordinate = {
        id: Date.now().toString(),
        uit: gpsData.uit,
        numar_inmatriculare: gpsData.numar_inmatriculare,
        lat: gpsData.lat,
        lng: gpsData.lng,
        viteza: gpsData.viteza,
        directie: gpsData.directie,
        altitudine: gpsData.altitudine,
        hdop: gpsData.hdop,
        gsm_signal: gpsData.gsm_signal,
        baterie: gpsData.baterie,
        status: gpsData.status,
        timestamp: gpsData.timestamp,
        attempts: 0,
        lastAttempt: new Date().toISOString()
      };

      const offlineCoords = await this.getOfflineCoordinates();
      offlineCoords.push(coordinate);
      
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(offlineCoords)
      });

      console.log(`💾 GPS offline salvat: UIT ${coordinate.uit}, ${coordinate.lat}, ${coordinate.lng}`);
      this.updateStats();
    } catch (error) {
      console.error('❌ Eroare salvare GPS offline:', error);
    }
  }

  // Obține toate coordonatele offline
  async getOfflineCoordinates(): Promise<OfflineGPSCoordinate[]> {
    try {
      const result = await Preferences.get({ key: this.STORAGE_KEY });
      return result.value ? JSON.parse(result.value) : [];
    } catch (error) {
      console.error('❌ Eroare citire GPS offline:', error);
      return [];
    }
  }

  // Sincronizează coordonatele offline
  async syncOfflineCoordinates(authToken?: string): Promise<boolean> {
    if (this.currentStats.syncInProgress) {
      console.log('🔄 Sincronizare în curs, skip...');
      return false;
    }

    try {
      this.currentStats.syncInProgress = true;
      this.currentStats.syncErrors = 0;
      this.currentStats.lastSyncAttempt = new Date();
      this.notifyListeners();

      const offlineCoords = await this.getOfflineCoordinates();
      if (offlineCoords.length === 0) {
        console.log('📡 Nu există coordonate offline de sincronizat');
        this.currentStats.syncInProgress = false;
        this.notifyListeners();
        return true;
      }

      console.log(`📡 Încep sincronizarea ${offlineCoords.length} coordonate offline...`);

      // Împarte în batch-uri
      const batches = this.createBatches(offlineCoords);
      this.currentStats.totalBatches = batches.length;
      this.currentStats.currentBatch = 0;

      let syncedCount = 0;
      let failedCoords: OfflineGPSCoordinate[] = [];

      for (let i = 0; i < batches.length; i++) {
        this.currentStats.currentBatch = i + 1;
        this.notifyListeners();

        const batch = batches[i];
        console.log(`📤 Trimit batch ${i + 1}/${batches.length} (${batch.length} coordonate)`);

        for (const coord of batch) {
          try {
            const success = await this.transmitCoordinate(coord, authToken);
            if (success) {
              syncedCount++;
              this.currentStats.totalSynced++;
            } else {
              coord.attempts++;
              coord.lastAttempt = new Date().toISOString();
              if (coord.attempts < this.MAX_RETRY_ATTEMPTS) {
                failedCoords.push(coord);
              } else {
                console.log(`❌ Coordonata abandonată după ${this.MAX_RETRY_ATTEMPTS} încercări: ${coord.id}`);
                this.currentStats.syncErrors++;
              }
            }
          } catch (error) {
            console.error(`❌ Eroare transmisie coordonată ${coord.id}:`, error);
            coord.attempts++;
            coord.lastAttempt = new Date().toISOString();
            if (coord.attempts < this.MAX_RETRY_ATTEMPTS) {
              failedCoords.push(coord);
            } else {
              this.currentStats.syncErrors++;
            }
          }
        }

        // Pauză între batch-uri
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Salvează coordonatele care au eșuat pentru retry
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(failedCoords)
      });

      console.log(`✅ Sincronizare completă: ${syncedCount} succes, ${failedCoords.length} rămase, ${this.currentStats.syncErrors} abandon`);

      this.currentStats.syncInProgress = false;
      this.currentStats.totalOffline = failedCoords.length;
      this.notifyListeners();

      return syncedCount > 0;

    } catch (error) {
      console.error('❌ Eroare sincronizare GPS offline:', error);
      this.currentStats.syncInProgress = false;
      this.currentStats.syncErrors++;
      this.notifyListeners();
      return false;
    }
  }

  // Transmite o coordonată individual
  private async transmitCoordinate(coord: OfflineGPSCoordinate, authToken?: string): Promise<boolean> {
    try {
      // Folosește token-ul din parametru sau încearcă să obții din storage
      let token = authToken;
      if (!token) {
        const storedAuth = await Preferences.get({ key: 'auth_token' });
        token = storedAuth.value || '';
      }

      if (!token) {
        console.error('❌ Nu există token pentru sincronizare offline');
        return false;
      }

      const response = await CapacitorHttp.post({
        url: `${API_BASE_URL}gps.php`,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "User-Agent": "iTrack-OfflineSync/1.0"
        },
        data: {
          uit: coord.uit,
          numar_inmatriculare: coord.numar_inmatriculare,
          lat: coord.lat,
          lng: coord.lng,
          viteza: coord.viteza,
          directie: coord.directie,
          altitudine: coord.altitudine,
          hdop: coord.hdop,
          gsm_signal: coord.gsm_signal,
          baterie: coord.baterie,
          status: coord.status,
          timestamp: coord.timestamp
        }
      });

      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ Coordonată offline sincronizată: ${coord.id} → ${response.status}`);
        return true;
      } else {
        console.log(`❌ Eșec sincronizare coordonată ${coord.id}: ${response.status}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Eroare transmisie coordonată ${coord.id}:`, error);
      return false;
    }
  }

  // Creează batch-uri pentru sincronizare
  private createBatches(coords: OfflineGPSCoordinate[]): OfflineGPSCoordinate[][] {
    const batches: OfflineGPSCoordinate[][] = [];
    for (let i = 0; i < coords.length; i += this.MAX_BATCH_SIZE) {
      batches.push(coords.slice(i, i + this.MAX_BATCH_SIZE));
    }
    return batches;
  }

  // Actualizează statisticile
  private async updateStats(): Promise<void> {
    const offlineCoords = await this.getOfflineCoordinates();
    this.currentStats.totalOffline = offlineCoords.length;
    this.notifyListeners();
  }

  // Încarcă statisticile din storage
  private async loadStats(): Promise<void> {
    try {
      const result = await Preferences.get({ key: 'offline_gps_stats' });
      if (result.value) {
        const saved = JSON.parse(result.value);
        this.currentStats.totalSynced = saved.totalSynced || 0;
        this.currentStats.syncErrors = saved.syncErrors || 0;
        this.currentStats.lastSyncAttempt = saved.lastSyncAttempt ? new Date(saved.lastSyncAttempt) : null;
      }
      await this.updateStats();
    } catch (error) {
      console.error('❌ Eroare încărcare statistici offline:', error);
    }
  }

  // Salvează statisticile în storage
  private async saveStats(): Promise<void> {
    try {
      await Preferences.set({
        key: 'offline_gps_stats',
        value: JSON.stringify({
          totalSynced: this.currentStats.totalSynced,
          syncErrors: this.currentStats.syncErrors,
          lastSyncAttempt: this.currentStats.lastSyncAttempt?.toISOString()
        })
      });
    } catch (error) {
      console.error('❌ Eroare salvare statistici offline:', error);
    }
  }

  // Subscribe la schimbări de statistici
  onSyncStatsChange(callback: (stats: OfflineSyncStats) => void): () => void {
    this.syncListeners.push(callback);
    // Trimite statisticile curente imediat
    callback({ ...this.currentStats });

    // Returnează funcție de cleanup
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Notifică listeners despre schimbări
  private notifyListeners(): void {
    this.saveStats();
    this.syncListeners.forEach(callback => {
      callback({ ...this.currentStats });
    });
  }

  // Obține statisticile curente
  getStats(): OfflineSyncStats {
    return { ...this.currentStats };
  }

  // Curăță toate coordonatele offline (pentru debug)
  async clearOfflineCoordinates(): Promise<void> {
    await Preferences.remove({ key: this.STORAGE_KEY });
    this.currentStats.totalOffline = 0;
    this.notifyListeners();
    console.log('🗑️ Coordonate offline curățate');
  }
}

export const offlineGPSService = OfflineGPSService.getInstance();