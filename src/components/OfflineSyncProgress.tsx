import React, { useState, useEffect } from 'react';
import { subscribeToSyncProgress, SyncProgress, hasOfflineGPSData, startOfflineSync } from '../services/offlineSyncStatus';

interface OfflineSyncProgressProps {
  className?: string;
}

const OfflineSyncProgress: React.FC<OfflineSyncProgressProps> = ({ className = '' }) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isActive: false,
    totalToSync: 0,
    synced: 0,
    failed: 0,
    remaining: 0,
    percentage: 0,
    startTime: null,
    estimatedTimeRemaining: null,
    lastError: null
  });
  
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    // Check for offline data on mount
    checkOfflineData();

    // Subscribe to sync progress updates
    const unsubscribe = subscribeToSyncProgress({
      onProgressUpdate: (progress: SyncProgress) => {
        setSyncProgress(progress);
        setShowProgress(progress.isActive || progress.totalToSync > 0);
      },
      onSyncComplete: () => {
        setTimeout(() => {
          setShowProgress(false);
          setHasOfflineData(false);
        }, 3000); // Hide after 3 seconds
      },
      onSyncError: (error: string) => {
        console.error('Sync error:', error);
        setSyncProgress(prev => ({ ...prev, lastError: error }));
      }
    });

    // Check periodically for offline data
    const checkInterval = setInterval(checkOfflineData, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, []);

  const checkOfflineData = async () => {
    try {
      const hasData = await hasOfflineGPSData();
      setHasOfflineData(hasData);
      
      if (hasData && !syncProgress.isActive) {
        setShowProgress(true);
      }
    } catch (error) {
      console.error('Error checking offline data:', error);
    }
  };

  const handleStartSync = async () => {
    try {
      await startOfflineSync();
    } catch (error) {
      console.error('Error starting sync:', error);
    }
  };

  // Don't render if no offline data and no active sync
  if (!hasOfflineData && !showProgress) {
    return null;
  }

  return (
    <div className={`offline-sync-progress ${className}`}>
      {syncProgress.isActive ? (
        // Active sync progress
        <div className="sync-active">
          <div className="sync-header">
            <div className="sync-icon">
              <i className="fas fa-sync-alt spinning"></i>
            </div>
            <div className="sync-info">
              <div className="sync-title">Sincronizare GPS Offline</div>
              <div className="sync-stats">
                {syncProgress.synced}/{syncProgress.totalToSync} coordonate trimise ({syncProgress.percentage}%)
              </div>
            </div>
          </div>
          
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${syncProgress.percentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {syncProgress.percentage}%
            </div>
          </div>
          
          {syncProgress.estimatedTimeRemaining && (
            <div className="time-estimate">
              Timp rămas: {syncProgress.estimatedTimeRemaining}
            </div>
          )}
          
          {syncProgress.failed > 0 && (
            <div className="sync-failed">
              {syncProgress.failed} coordonate eșuate
            </div>
          )}
        </div>
      ) : syncProgress.totalToSync > 0 && syncProgress.synced === syncProgress.totalToSync ? (
        // Sync completed successfully
        <div className="sync-completed">
          <div className="sync-success">
            <i className="fas fa-check-circle"></i>
            <span>Sincronizare completă! {syncProgress.synced} coordonate trimise</span>
          </div>
        </div>
      ) : hasOfflineData ? (
        // Has offline data, not syncing
        <div className="sync-pending">
          <div className="offline-indicator">
            <i className="fas fa-wifi-slash"></i>
            <div className="offline-info">
              <div className="offline-title">Date GPS Offline</div>
              <div className="offline-count">
                {syncProgress.remaining || syncProgress.totalToSync} coordonate în așteptare
              </div>
            </div>
          </div>
          <button 
            className="sync-button"
            onClick={handleStartSync}
            title="Pornește sincronizarea"
          >
            <i className="fas fa-cloud-upload-alt"></i>
            <span>SINCRONIZEAZĂ</span>
          </button>
        </div>
      ) : null}

      {syncProgress.lastError && (
        <div className="sync-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{syncProgress.lastError}</span>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncProgress;