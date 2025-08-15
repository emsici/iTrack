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
  }, [syncProgress.isActive, isOnline]);

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
    <div className={`offline-sync-progress ${className}`} style={{
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      borderRadius: '20px',
      background: syncProgress.isActive 
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)'
        : hasOfflineData && !isOnline
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)'
          : hasOfflineData && isOnline
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)'
            : 'transparent',
      border: syncProgress.isActive || hasOfflineData 
        ? `2px solid ${
            syncProgress.isActive 
              ? 'rgba(34, 197, 94, 0.4)'
              : !isOnline
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(59, 130, 246, 0.4)'
          }`
        : 'none',
      backdropFilter: (syncProgress.isActive || hasOfflineData) ? 'blur(15px)' : 'none',
      boxShadow: (syncProgress.isActive || hasOfflineData) 
        ? '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)'
        : 'none',
      transition: 'all 0.3s ease-in-out'
    }}>
      {syncProgress.isActive ? (
        // Active sync progress
        <div className="sync-active">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite'
            }}>
              <i className="fas fa-sync-alt" style={{ 
                color: 'white', 
                fontSize: '24px',
                animation: 'spin 1s linear infinite'
              }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: '5px'
              }}>
                🔄 Sincronizare GPS în curs...
              </div>
              <div style={{
                fontSize: '16px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                {syncProgress.synced}/{syncProgress.totalToSync} coordonate trimise ({syncProgress.percentage}%)
              </div>
            </div>
          </div>
          
          <div style={{
            marginBottom: '15px'
          }}>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(148, 163, 184, 0.2)',
              borderRadius: '6px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${syncProgress.percentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #22c55e 0%, #10b981 50%, #059669 100%)',
                borderRadius: '6px',
                transition: 'width 0.5s ease-out',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite'
                }}></div>
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#22c55e',
              marginTop: '8px'
            }}>
              {syncProgress.percentage}% completat
            </div>
          </div>
          
          {syncProgress.estimatedTimeRemaining && (
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '10px'
            }}>
              ⏱️ Timp rămas: {syncProgress.estimatedTimeRemaining}
            </div>
          )}
          
          {syncProgress.failed > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              color: '#ef4444',
              textAlign: 'center'
            }}>
              ⚠️ {syncProgress.failed} coordonate eșuate - se reîncearcă
            </div>
          )}
        </div>
      ) : syncProgress.totalToSync > 0 && syncProgress.synced === syncProgress.totalToSync ? (
        // Sync completed successfully
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '15px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '2px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fas fa-check" style={{ 
              color: 'white', 
              fontSize: '20px'
            }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#22c55e',
              marginBottom: '3px'
            }}>
              ✅ Sincronizare completă!
            </div>
            <div style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              {syncProgress.synced} coordonate GPS trimise cu succes
            </div>
          </div>
        </div>
      ) : hasOfflineData ? (
        // Has offline data, not syncing - show real network status
        <div className="sync-pending">
          <div className="offline-indicator" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '10px 0'
          }}>
            <div style={{
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: isOnline 
                ? 'rgba(34, 197, 94, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              border: `2px solid ${isOnline ? '#22c55e' : '#ef4444'}`
            }}>
              <i className={`fas ${isOnline ? 'fa-cloud-upload-alt' : 'fa-wifi'}`} 
                 style={{ color: isOnline ? '#22c55e' : '#ef4444' }}></i>
            </div>
            <div className="offline-info" style={{ flex: 1 }}>
              <div className="offline-title" style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '5px',
                color: isOnline ? '#22c55e' : '#ef4444'
              }}>
                {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'} - Sincronizare Automată
              </div>
              <div className="offline-count" style={{
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '5px',
                color: '#64748b'
              }}>
                📍 {syncProgress.remaining || syncProgress.totalToSync} coordonate GPS salvate offline
              </div>
              <div className="auto-sync-note" style={{
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#9ca3af'
              }}>
                <i className={`fas ${isOnline ? 'fa-sync-alt' : 'fa-pause-circle'}`}></i>
                {isOnline 
                  ? 'Se pornește sincronizarea automată...' 
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