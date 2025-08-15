import React, { useState, useEffect } from 'react';
import { subscribeToSyncProgress, SyncProgress, hasOfflineGPSData, startOfflineSync } from '../services/offlineSyncStatus';
import { onNetworkStatusChange } from '../services/networkStatus';

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
  // Remove unused showProgress state
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
    <div 
      className={`offline-sync-progress ${className}`}
      style={{
        width: '100%',
        background: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      {syncProgress.isActive ? (
        // Active sync progress - Professional design
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#10b981' }}>
              <i className="fas fa-sync-alt" style={{ animation: 'spin 1s linear infinite' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                🟢 SINCRONIZARE OFFLINE
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {syncProgress.synced}/{syncProgress.totalToSync} coordonate ({syncProgress.percentage}%)
              </div>
            </div>
          </div>
          <div style={{ 
            minWidth: '60px', 
            textAlign: 'right', 
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {syncProgress.estimatedTimeRemaining || `${syncProgress.percentage}%`}
          </div>
        </div>
      ) : (
        // Status display - Professional and clean
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              color: hasOfflineData ? '#f59e0b' : isOnline ? '#10b981' : '#ef4444' 
            }}>
              <i className={`fas ${hasOfflineData ? 'fa-cloud-upload-alt' : isOnline ? 'fa-satellite-dish' : 'fa-wifi-slash'}`}></i>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>
                {hasOfflineData 
                  ? '🟡 COORDONATE OFFLINE' 
                  : isOnline 
                    ? '🟢 GPS ONLINE'
                    : '🔴 GPS OFFLINE'
                }
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {syncProgress.totalToSync > 0 
                  ? `${syncProgress.totalToSync} coordonate în așteptare`
                  : hasOfflineData 
                    ? 'Se vor sincroniza automat'
                    : isOnline
                      ? 'Transmisie normală activă'
                      : 'Se salvează offline'
                }
              </div>
            </div>
          </div>
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.7,
            textAlign: 'right',
            maxWidth: '100px'
          }}>
            {hasOfflineData 
              ? isOnline ? 'Pornind sync...' : 'La revenire'
              : isOnline ? 'În funcțiune' : 'În așteptare'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncProgress;