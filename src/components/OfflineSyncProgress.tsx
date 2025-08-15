import React, { useState, useEffect } from 'react';
import { subscribeToSyncProgress, SyncProgress, hasOfflineGPSData, startOfflineSync } from '../services/offlineSyncStatus';
import { onNetworkStatusChange, getNetworkStatusInfo } from '../services/networkStatus';

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
  const [showProgress] = useState(true); // ALWAYS SHOW!
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribeNetwork = onNetworkStatusChange(async (online) => {
      setIsOnline(online);
      console.log(`🌐 Network status schimbat la: ${online ? 'ONLINE' : 'OFFLINE'}`);
      
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
        // Always show when there's progress
      },
      onSyncComplete: () => {
        console.log('✅ Sincronizare offline completată cu succes');
        setTimeout(() => {
          setHasOfflineData(false);
          // Keep showing for a moment to display success
        }, 3000); // Show success for 3 seconds
      },
      onSyncError: (error: string) => {
        console.error('❌ Eroare sincronizare offline:', error);
        setSyncProgress(prev => ({ ...prev, lastError: error }));
      }
    });

    // Check for offline data frequently for immediate display
    const checkOfflineData = async () => {
      try {
        const hasData = await hasOfflineGPSData();
        setHasOfflineData(hasData);
        
        if (hasData && !syncProgress.isActive && isOnline) {
          console.log('🔄 Date GPS offline detectate + ONLINE - se pornește sincronizarea automată');
          await startOfflineSync();
        } else if (hasData) {
          console.log(`💾 Date GPS offline detectate - Status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        }
      } catch (error) {
        console.error('❌ Eroare la verificarea datelor offline:', error);
      }
    };

    // Initial check
    checkOfflineData();

    // Check every 3 seconds for immediate offline detection
    const checkInterval = setInterval(checkOfflineData, 3000);

    return () => {
      unsubscribe();
      unsubscribeNetwork();
      clearInterval(checkInterval);
    };
  }, [syncProgress.isActive, isOnline]);

  // ALWAYS RENDER: Show status whether online, offline, syncing, or idle
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
              <div className="sync-title">🟢 ONLINE - Sincronizare GPS Offline</div>
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
          
          {syncProgress.lastError && (
            <div className="error-message">
              ⚠️ {syncProgress.lastError}
            </div>
          )}
        </div>
      ) : (
        // Status display - ALWAYS VISIBLE
        <div className="sync-pending">
          <div className="sync-header">
            <div className="sync-icon">
              <i className={`fas ${hasOfflineData ? 'fa-cloud-upload-alt' : isOnline ? 'fa-satellite-dish' : 'fa-wifi-slash'}`}></i>
            </div>
            <div className="sync-info">
              <div className="sync-title">
                {hasOfflineData 
                  ? 'GPS Offline - Sincronizare Automată' 
                  : isOnline 
                    ? 'GPS Online - Monitorizare Activă'
                    : 'GPS Offline - În Așteptare'
                }
              </div>
              <div className="sync-stats">
                {syncProgress.totalToSync > 0 
                  ? `${syncProgress.totalToSync} coordonate GPS offline`
                  : hasOfflineData 
                    ? 'Coordonate offline detectate'
                    : isOnline
                      ? 'Toate coordonatele sunt sincronizate'
                      : 'Coordonatele se salvează offline'
                }
              </div>
            </div>
          </div>
          
          <div className="offline-status">
            <span className={`network-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </span>
            <div className="auto-sync-note">
              {hasOfflineData 
                ? isOnline 
                  ? '🔄 Se va sincroniza automat în câteva secunde...'
                  : '📡 Se va sincroniza când revine internetul'
                : isOnline
                  ? '✅ GPS funcționează normal - coordonatele se transmit direct'
                  : '⏳ Coordonatele se salvează offline pentru sincronizare ulterioară'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncProgress;