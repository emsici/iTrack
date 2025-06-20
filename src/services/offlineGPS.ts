/**
 * Offline GPS Coordinate Storage and Sync Service
 * Handles GPS coordinate caching when offline and batch transmission when online
 */

import { Preferences } from '@capacitor/preferences';
import { GPSData } from './api';

export interface OfflineGPSCoordinate {
  id: string;
  courseId: string;
  vehicleNumber: string;
  uit: string;
  token: string;
  status: number;
  lat: number;
  lng: number;
  timestamp: string;  // ISO string
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  hdop: string;
  gsm_signal: string;
  retryCount: number;
  savedAt: string;  // When saved to offline storage
}

class OfflineGPSService {
  private readonly STORAGE_KEY = 'offline_gps_coordinates';
  private readonly MAX_COORDINATES = 1000; // Maximum coordinates to store offline
  private readonly MAX_RETRY_COUNT = 3;
  private syncInProgress = false;

  /**
   * Save GPS coordinate to offline storage
   */
  async saveCoordinate(gpsData: GPSData, courseId: string, vehicleNumber: string, token: string, status: number): Promise<void> {
    try {
      const coordinate: OfflineGPSCoordinate = {
        id: `${courseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId,
        vehicleNumber,
        uit: gpsData.uit,
        token,
        status,
        lat: gpsData.lat,
        lng: gpsData.lng,
        timestamp: gpsData.timestamp,
        viteza: gpsData.viteza,
        directie: gpsData.directie,
        altitudine: gpsData.altitudine,
        baterie: gpsData.baterie,
        hdop: gpsData.hdop,
        gsm_signal: gpsData.gsm_signal,
        retryCount: 0,
        savedAt: new Date().toISOString()
      };

      const existingCoordinates = await this.getOfflineCoordinates();
      const updatedCoordinates = [...existingCoordinates, coordinate];

      // Keep only the most recent coordinates if we exceed limit
      if (updatedCoordinates.length > this.MAX_COORDINATES) {
        updatedCoordinates.splice(0, updatedCoordinates.length - this.MAX_COORDINATES);
      }

      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(updatedCoordinates)
      });

      console.log(`🔄 Coordinate saved offline: ${coordinate.id} (Total: ${updatedCoordinates.length})`);
    } catch (error) {
      console.error('❌ Error saving coordinate offline:', error);
    }
  }

  /**
   * Get all offline coordinates
   */
  async getOfflineCoordinates(): Promise<OfflineGPSCoordinate[]> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('❌ Error loading offline coordinates:', error);
      return [];
    }
  }

  /**
   * Get count of offline coordinates
   */
  async getOfflineCount(): Promise<number> {
    const coordinates = await this.getOfflineCoordinates();
    return coordinates.length;
  }

  /**
   * Attempt to sync offline coordinates to server
   */
  async syncOfflineCoordinates(): Promise<{ success: number; failed: number; total: number }> {
    if (this.syncInProgress) {
      console.log('🔄 Sync already in progress...');
      return { success: 0, failed: 0, total: 0 };
    }

    this.syncInProgress = true;
    console.log('🚀 Starting offline GPS coordinate sync...');

    try {
      const coordinates = await this.getOfflineCoordinates();
      if (coordinates.length === 0) {
        console.log('✅ No offline coordinates to sync');
        return { success: 0, failed: 0, total: 0 };
      }

      console.log(`📡 Syncing ${coordinates.length} offline coordinates...`);

      let successCount = 0;
      let failedCount = 0;
      const remainingCoordinates: OfflineGPSCoordinate[] = [];

      // Process coordinates in batches of 5 to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < coordinates.length; i += batchSize) {
        const batch = coordinates.slice(i, i + batchSize);
        
        for (const coordinate of batch) {
          try {
            const success = await this.transmitCoordinate(coordinate);
            if (success) {
              successCount++;
              console.log(`✅ Synced coordinate: ${coordinate.id}`);
            } else {
              // Increment retry count and keep for later if under max retries
              coordinate.retryCount++;
              if (coordinate.retryCount <= this.MAX_RETRY_COUNT) {
                remainingCoordinates.push(coordinate);
                console.log(`⚠️ Retry ${coordinate.retryCount}/${this.MAX_RETRY_COUNT} for: ${coordinate.id}`);
              } else {
                console.log(`❌ Max retries exceeded for: ${coordinate.id}`);
              }
              failedCount++;
            }
          } catch (error) {
            console.error(`❌ Error syncing coordinate ${coordinate.id}:`, error);
            coordinate.retryCount++;
            if (coordinate.retryCount <= this.MAX_RETRY_COUNT) {
              remainingCoordinates.push(coordinate);
            }
            failedCount++;
          }
        }

        // Small delay between batches to prevent server overload
        if (i + batchSize < coordinates.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update storage with remaining coordinates (failed ones for retry)
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(remainingCoordinates)
      });

      console.log(`🎯 Sync complete: ${successCount} success, ${failedCount} failed, ${remainingCoordinates.length} remaining`);
      
      const totalProcessed = coordinates.length;
      return { 
        success: successCount, 
        failed: failedCount, 
        total: totalProcessed 
      };

    } catch (error) {
      console.error('❌ Error during offline sync:', error);
      return { success: 0, failed: 0, total: 0 };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Transmit a single coordinate to the server
   */
  private async transmitCoordinate(coordinate: OfflineGPSCoordinate): Promise<boolean> {
    try {
      const gpsData: GPSData = {
        lat: coordinate.lat,
        lng: coordinate.lng,
        timestamp: coordinate.timestamp,
        viteza: coordinate.viteza,
        directie: coordinate.directie,
        altitudine: coordinate.altitudine,
        baterie: coordinate.baterie,
        numar_inmatriculare: coordinate.vehicleNumber,
        uit: coordinate.uit,
        status: coordinate.status.toString(),
        hdop: coordinate.hdop,
        gsm_signal: coordinate.gsm_signal
      };

      const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${coordinate.token}`,
          'Accept': 'application/json',
          'User-Agent': 'iTrack-Android-GPS/1.0'
        },
        body: JSON.stringify(gpsData)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Network error transmitting coordinate:', error);
      return false;
    }
  }

  /**
   * Clear all offline coordinates (use with caution)
   */
  async clearOfflineCoordinates(): Promise<void> {
    try {
      await Preferences.remove({ key: this.STORAGE_KEY });
      console.log('🗑️ All offline coordinates cleared');
    } catch (error) {
      console.error('❌ Error clearing offline coordinates:', error);
    }
  }

  /**
   * Get sync status information
   */
  async getSyncInfo(): Promise<{
    offlineCount: number;
    syncInProgress: boolean;
    oldestCoordinate: string | null;
    newestCoordinate: string | null;
  }> {
    const coordinates = await this.getOfflineCoordinates();
    return {
      offlineCount: coordinates.length,
      syncInProgress: this.syncInProgress,
      oldestCoordinate: coordinates.length > 0 ? coordinates[0].savedAt : null,
      newestCoordinate: coordinates.length > 0 ? coordinates[coordinates.length - 1].savedAt : null
    };
  }
}

// Export singleton instance
export const offlineGPSService = new OfflineGPSService();

// Convenience functions
export const saveGPSCoordinateOffline = (
  gpsData: GPSData, 
  courseId: string, 
  vehicleNumber: string, 
  token: string, 
  status: number
) => offlineGPSService.saveCoordinate(gpsData, courseId, vehicleNumber, token, status);

export const syncOfflineGPS = () => offlineGPSService.syncOfflineCoordinates();

export const getOfflineGPSCount = () => offlineGPSService.getOfflineCount();

export const getOfflineGPSInfo = () => offlineGPSService.getSyncInfo();

export const clearOfflineGPS = () => offlineGPSService.clearOfflineCoordinates();