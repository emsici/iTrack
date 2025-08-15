import React, { useState, useEffect } from "react";
import { CapacitorHttp } from '@capacitor/core';
// Uses CapacitorHttp + fetch fallback for connectivity check
import { getOfflineGPSCount, syncOfflineGPS } from "../services/offlineGPS";
import { subscribeToSyncProgress } from "../services/offlineSyncStatus";

interface OfflineGPSMonitorProps {
  isOnline: boolean;
  coursesActive: boolean;
  currentTheme?: string;
  compactMode?: boolean;
}

const OfflineGPSMonitor: React.FC<OfflineGPSMonitorProps> = ({ 
  isOnline, 
  coursesActive,
  currentTheme = 'dark',
  compactMode = false
}) => {
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, failed: 0, total: 0 });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let syncSubscription: (() => void) | null = null;

    if (coursesActive) {
      // Monitor offline GPS count
      const updateStatus = async () => {
        try {
          const count = await getOfflineGPSCount();
          setOfflineCount(count);

          // Verificare detecție offline - optimizată fără spam
          const actuallyOnline = navigator.onLine && isOnline;
          
          // Test real network connection - log doar la schimbări
          let networkTest = false;
          try {
            // Test conectivitate cu CapacitorHttp
            try {
              await CapacitorHttp.get({
                url: 'https://www.google.com/favicon.ico',
                headers: {}
              });
            } catch {
              await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            }
            networkTest = true;
          } catch (error) {
            networkTest = false;
          }
          
          // Auto-sync when truly online and have offline coordinates
          if (actuallyOnline && networkTest && count > 0 && !syncInProgress) {
            console.log(`🔄 Auto-sync GPS: ${count} coordonate offline detectate`);
            try {
              setSyncInProgress(true);
              const result = await syncOfflineGPS();
              console.log(`✅ Sincronizare completă: ${result.success}/${result.total} coordonate transmise`);
            } catch (error) {
              console.error("❌ Eroare sync GPS:", error);
            } finally {
              setSyncInProgress(false);
            }
          }
        } catch (error) {
          console.error("Error monitoring offline GPS:", error);
        }
      };

      // Initial status check
      updateStatus();

      // Set up periodic monitoring - optimized for scroll performance
      interval = setInterval(updateStatus, 20000); // Increased to 20 seconds for better performance

      // Subscribe to sync progress updates
      syncSubscription = subscribeToSyncProgress({
        onProgressUpdate: (progress) => {
          setSyncInProgress(progress.isActive);
          setSyncProgress({
            synced: progress.synced,
            failed: progress.failed,
            total: progress.totalToSync
          });
        },
        onSyncComplete: () => {
          setSyncInProgress(false);
          console.log("✅ Sincronizare offline GPS completă");
        },
        onSyncError: (error) => {
          setSyncInProgress(false);
          console.error("❌ Eroare sincronizare:", error);
        }
      });

      return () => {
        clearInterval(interval);
        if (syncSubscription) {
          syncSubscription();
        }
      };
    }
  }, [coursesActive, isOnline, syncInProgress]);

  // Always show the central status indicator when courses are loaded
  if (!coursesActive) {
    return null;
  }

  const getStatusIcon = () => {
    if (syncInProgress) return 'fas fa-sync-alt';
    // Verificare dublă detecție offline
    const actuallyOffline = !navigator.onLine || !isOnline;
    if (actuallyOffline) return 'fas fa-wifi-slash';
    return 'fas fa-wifi';
  };

  const getStatusClass = () => {
    if (syncInProgress) return 'syncing';
    // Verificare strictă detecție offline
    const actuallyOffline = !navigator.onLine || !isOnline;
    if (actuallyOffline) return 'offline';
    return 'online';
  };

  const getMainStatusText = () => {
    if (syncInProgress) {
      return `🔄 Sincronizare GPS în curs...`;
    }
    // Verificare dublă detecție offline
    const actuallyOffline = !navigator.onLine || !isOnline;
    if (actuallyOffline) {
      return '📴 MODUL OFFLINE ACTIV';
    }
    if (offlineCount > 0) {
      return '📊 Date GPS în așteptare';
    }
    return '✅ GPS Activ & Online';
  };

  const getSubStatusText = () => {
    if (syncInProgress) {
      const percentage = syncProgress.total > 0 ? Math.round((syncProgress.synced / syncProgress.total) * 100) : 0;
      return `${syncProgress.synced}/${syncProgress.total} coordonate (${percentage}%)`;
    }
    // Verificare dublă detecție offline
    const actuallyOffline = !navigator.onLine || !isOnline;
    if (actuallyOffline) {
      if (offlineCount > 0) {
        return `${offlineCount} coordonate salvate local`;
      }
      return 'GPS se va salva local când cursele sunt active';
    }
    if (offlineCount === 0) {
      return 'Toate datele sincronizate';
    }
    if (offlineCount > 0) {
      return `${offlineCount} coordonate în așteptare sincronizare`;
    }
    return 'Gata pentru urmărire GPS';
  };

  return (
    <div className="offline-monitor-header-style">
      <div className="gps-status-header-style">
        <div className={`gps-status-icon-header ${getStatusClass()}`} style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: getStatusClass() === 'online' 
            ? '0 0 12px rgba(34, 197, 94, 0.4)' 
            : getStatusClass() === 'offline'
              ? '0 0 12px rgba(239, 68, 68, 0.4)'
              : '0 0 12px rgba(59, 130, 246, 0.4)',
          background: getStatusClass() === 'online' 
            ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
            : getStatusClass() === 'offline'
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white'
        }}>
          <i className={getStatusIcon()}></i>
        </div>
        
        <div className="gps-status-content-header">
          <div className="gps-status-main-header">
            {getMainStatusText()}
          </div>
          <div className="gps-status-detail-header">
            {getSubStatusText()}
          </div>
        </div>

        {offlineCount > 0 && !syncInProgress && (
          <div className="gps-offline-badge-header" style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            animation: 'pulse 2s infinite'
          }}>
            <i className="fas fa-database"></i>
            <span>{offlineCount}</span>
          </div>
        )}
      </div>

      {syncInProgress && syncProgress.total > 0 && (
        <div className="gps-sync-progress-header" style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div className="sync-progress-info-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span className="sync-progress-label-header" style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#3b82f6'
            }}>🔄 Sincronizare GPS</span>
            <span className="sync-progress-count-header" style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#1e40af'
            }}>{syncProgress.synced}/{syncProgress.total}</span>
          </div>
          <div className="sync-progress-bar-header" style={{
            height: '6px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div 
              className="sync-progress-fill-header" 
              style={{ 
                width: `${Math.round((syncProgress.synced / syncProgress.total) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                transition: 'width 0.3s ease',
                borderRadius: '3px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div className="sync-progress-shimmer-header" style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                animation: 'shimmer 2s infinite'
              }}></div>
            </div>
            <div className="sync-progress-percentage-header" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              fontWeight: '700',
              color: '#1e40af',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
            }}>
              {Math.round((syncProgress.synced / syncProgress.total) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineGPSMonitor;