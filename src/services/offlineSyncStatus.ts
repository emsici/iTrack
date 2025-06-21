/**
 * Offline GPS Sync Status Monitor
 * Tracks and displays real-time sync progress to user
 */

import { offlineGPSService, getOfflineGPSCount } from './offlineGPS';

export interface SyncProgress {
  isActive: boolean;
  totalToSync: number;
  synced: number;
  failed: number;
  remaining: number;
  percentage: number;
  startTime: string | null;
  estimatedTimeRemaining: string | null;
  lastError: string | null;
}

export interface SyncStatusCallback {
  onProgressUpdate: (progress: SyncProgress) => void;
  onSyncComplete: () => void;
  onSyncError: (error: string) => void;
}

class OfflineSyncStatusService {
  private callbacks: SyncStatusCallback[] = [];
  private currentProgress: SyncProgress = {
    isActive: false,
    totalToSync: 0,
    synced: 0,
    failed: 0,
    remaining: 0,
    percentage: 0,
    startTime: null,
    estimatedTimeRemaining: null,
    lastError: null
  };

  private syncCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Register callback for sync progress updates
   */
  onSyncProgress(callback: SyncStatusCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Start monitoring sync status
   */
  async startSyncMonitoring(): Promise<void> {
    try {
      const offlineCount = await getOfflineGPSCount();
      
      if (offlineCount === 0) {
        console.log('📊 GPS sync: Nu există coordonate offline de sincronizat');
        return;
      }

      console.log(`📊 GPS sync: Începe sincronizarea pentru ${offlineCount} coordonate`);
      
      this.currentProgress = {
        isActive: true,
        totalToSync: offlineCount,
        synced: 0,
        failed: 0,
        remaining: offlineCount,
        percentage: 0,
        startTime: new Date().toISOString(),
        estimatedTimeRemaining: 'Calculating...',
        lastError: null
      };

      this.notifyCallbacks();
      this.startProgressTracking();

      // Start the actual sync process
      const result = await offlineGPSService.syncOfflineCoordinates();
      
      this.currentProgress = {
        ...this.currentProgress,
        isActive: false,
        synced: result.success,
        failed: result.failed,
        remaining: Math.max(0, result.total - result.success),
        percentage: result.total > 0 ? Math.round((result.success / result.total) * 100) : 100,
        estimatedTimeRemaining: null
      };

      this.notifyCallbacks();

      if (result.success === result.total) {
        this.notifyComplete();
      } else if (result.failed > 0) {
        this.notifyError(`${result.failed} coordinates failed to sync`);
      }

    } catch (error) {
      console.error('❌ Error starting sync monitoring:', error);
      this.currentProgress.isActive = false;
      this.currentProgress.lastError = error instanceof Error ? error.message : 'Unknown sync error';
      this.notifyError(this.currentProgress.lastError);
    }
  }

  /**
   * Start periodic progress tracking during sync
   */
  private startProgressTracking(): void {
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
    }

    this.syncCheckInterval = setInterval(async () => {
      if (!this.currentProgress.isActive) {
        if (this.syncCheckInterval) {
          clearInterval(this.syncCheckInterval);
          this.syncCheckInterval = null;
        }
        return;
      }

      try {
        const currentOfflineCount = await getOfflineGPSCount();
        const synced = this.currentProgress.totalToSync - currentOfflineCount;
        
        if (synced !== this.currentProgress.synced) {
          const startTime = this.currentProgress.startTime ? new Date(this.currentProgress.startTime) : new Date();
          const elapsed = Date.now() - startTime.getTime();
          const rate = synced / (elapsed / 1000); // coordinates per second
          const remaining = currentOfflineCount;
          const estimatedSeconds = rate > 0 ? Math.ceil(remaining / rate) : 0;
          
          this.currentProgress = {
            ...this.currentProgress,
            synced,
            remaining: currentOfflineCount,
            percentage: this.currentProgress.totalToSync > 0 ? 
              Math.round((synced / this.currentProgress.totalToSync) * 100) : 100,
            estimatedTimeRemaining: estimatedSeconds > 0 ? 
              this.formatDuration(estimatedSeconds) : 'Almost done...'
          };

          this.notifyCallbacks();
          
          console.log(`📊 Sync progress: ${synced}/${this.currentProgress.totalToSync} (${this.currentProgress.percentage}%) | Remaining: ${currentOfflineCount}`);
        }
      } catch (error) {
        console.error('❌ Error tracking sync progress:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Format duration in seconds to human readable format
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Get current sync progress
   */
  getCurrentProgress(): SyncProgress {
    return { ...this.currentProgress };
  }

  /**
   * Check if there are offline coordinates waiting to sync
   */
  async hasOfflineData(): Promise<boolean> {
    const count = await getOfflineGPSCount();
    return count > 0;
  }

  /**
   * Get offline coordinates count
   */
  async getOfflineCount(): Promise<number> {
    return await getOfflineGPSCount();
  }

  /**
   * Notify all registered callbacks of progress update
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback.onProgressUpdate(this.currentProgress);
      } catch (error) {
        console.error('❌ Error in sync progress callback:', error);
      }
    });
  }

  /**
   * Notify all registered callbacks of sync completion
   */
  private notifyComplete(): void {
    this.callbacks.forEach(callback => {
      try {
        callback.onSyncComplete();
      } catch (error) {
        console.error('❌ Error in sync complete callback:', error);
      }
    });
  }

  /**
   * Notify all registered callbacks of sync error
   */
  private notifyError(error: string): void {
    this.callbacks.forEach(callback => {
      try {
        callback.onSyncError(error);
      } catch (error) {
        console.error('❌ Error in sync error callback:', error);
      }
    });
  }

  /**
   * Stop sync monitoring
   */
  stopMonitoring(): void {
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
      this.syncCheckInterval = null;
    }
    
    this.currentProgress.isActive = false;
    this.notifyCallbacks();
  }

  /**
   * Reset sync status
   */
  reset(): void {
    this.stopMonitoring();
    this.currentProgress = {
      isActive: false,
      totalToSync: 0,
      synced: 0,
      failed: 0,
      remaining: 0,
      percentage: 0,
      startTime: null,
      estimatedTimeRemaining: null,
      lastError: null
    };
    this.notifyCallbacks();
  }
}

// Export singleton instance
export const offlineSyncStatusService = new OfflineSyncStatusService();

// Convenience functions
export const startOfflineSync = () => offlineSyncStatusService.startSyncMonitoring();
export const getOfflineSyncProgress = () => offlineSyncStatusService.getCurrentProgress();
export const hasOfflineGPSData = () => offlineSyncStatusService.hasOfflineData();
export const subscribeToSyncProgress = (callback: SyncStatusCallback) => offlineSyncStatusService.onSyncProgress(callback);