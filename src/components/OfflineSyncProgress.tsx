import React, { useState, useEffect } from 'react';
import { subscribeToSyncProgress, SyncProgress, hasOfflineGPSData, startOfflineSync } from '../services/offlineSyncStatus';
import { onNetworkStatusChange, isNetworkOnline, getNetworkStatusInfo } from '../services/networkStatus';

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
  const [isOnline, setIsOnline] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    // Check for offline data on mount
    checkOfflineData();

    // Subscribe to network status changes
    const unsubscribeNetwork = onNetworkStatusChange(async (online) => {
      setIsOnline(online);
      setNetworkInfo(getNetworkStatusInfo());
      console.log(`🌐 STATUS REȚEA SCHIMBAT: ${online ? 'ONLINE' : 'OFFLINE'}`);
      
      // EFICIENT: Când revine internetul, verifică și pornește sync automat
      if (online && !syncProgress.isActive) {
        const hasData = await hasOfflineGPSData();
        if (hasData) {
          console.log('🚀 Internet revenit - pornesc sincronizarea automată a datelor offline');
          await startOfflineSync();
        }
      }
    });

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
        console.error('Eroare sincronizare:', error);
        setSyncProgress(prev => ({ ...prev, lastError: error }));
      }
    });

    // Check more frequently for offline data for automatic sync
    const checkInterval = setInterval(checkOfflineData, 3000); // Every 3 seconds for immediate auto-sync

    return () => {
      unsubscribe();
      unsubscribeNetwork();
      clearInterval(checkInterval);
    };
  }, []);

  const checkOfflineData = async () => {
    try {
      const hasData = await hasOfflineGPSData();
      setHasOfflineData(hasData);
      
      if (hasData && !syncProgress.isActive && isOnline) {
        setShowProgress(true);
        // EFICIENT: Start sync DOAR când suntem online și avem date offline
        console.log('🔄 Date GPS offline detectate + ONLINE - se pornește sincronizarea automată');
        await startOfflineSync();
      } else if (hasData && !isOnline) {
        setShowProgress(true);
        console.log('💾 Date GPS offline detectate + OFFLINE - se afișează progress și așteaptă internetul');
      }
    } catch (error) {
      console.error('Eroare la verificarea datelor offline:', error);
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
                className={`progress-fill ${syncProgress.isActive ? 'syncing' : ''}`}
                style={{ 
                  width: `${syncProgress.percentage}%`,
                  willChange: syncProgress.isActive ? 'width' : 'auto'
                }}
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
        // Has offline data, not syncing - show real network status
        <div className="sync-pending">
          <div className="offline-indicator">
            <i className={`fas ${isOnline ? 'fa-cloud-upload-alt' : 'fa-wifi'} sync-icon-automatic`}></i>
            <div className="offline-info">
              <div className="offline-title">
                <span className={`network-status ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
                - Sincronizare Automată
              </div>
              <div className="offline-count">
                {syncProgress.remaining || syncProgress.totalToSync} coordonate GPS offline
              </div>
              <div className="auto-sync-note">
                <i className={`fas ${isOnline ? 'fa-cloud-upload-alt' : 'fa-pause-circle'}`} style={{marginRight: '4px'}}></i>
                {isOnline 
                  ? 'Se sincronizează automat acum...' 
                  : 'În așteptare - se va sincroniza când revine internetul'}
              </div>
              {networkInfo && !isOnline && (
                <div className="network-debug" style={{fontSize: '12px', opacity: 0.7, marginTop: '4px'}}>
                  {networkInfo.consecutiveFailures} eșecuri GPS • {Math.round(networkInfo.timeSinceLastSuccess / 1000)}s fără succes
                </div>
              )}
            </div>
          </div>
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