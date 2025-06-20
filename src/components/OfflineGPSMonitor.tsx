import React, { useState, useEffect } from "react";
import { getOfflineGPSCount, syncOfflineGPS } from "../services/offlineGPS";
import { subscribeToSyncProgress } from "../services/offlineSyncStatus";

interface OfflineGPSMonitorProps {
  isOnline: boolean;
  coursesActive: boolean;
}

const OfflineGPSMonitor: React.FC<OfflineGPSMonitorProps> = ({ isOnline, coursesActive }) => {
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

          // Debug logging pentru detecția offline
          console.log(`📊 Status GPS: online=${isOnline}, navigator.onLine=${navigator.onLine}, count=${count}`);
          
          // Auto-sync when online and have offline coordinates
          if (isOnline && navigator.onLine && count > 0 && !syncInProgress) {
            console.log(`🔄 Auto-sync GPS: ${count} coordonate offline`);
            try {
              const result = await syncOfflineGPS();
              console.log(`✅ Sincronizare: ${result.success}/${result.total} coordonate`);
            } catch (error) {
              console.error("❌ Eroare sync GPS:", error);
            }
          }
        } catch (error) {
          console.error("Error monitoring offline GPS:", error);
        }
      };

      // Initial status check
      updateStatus();

      // Set up periodic monitoring
      interval = setInterval(updateStatus, 3000);

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
    // Verificare dublă detecție offline
    const actuallyOffline = !navigator.onLine || !isOnline;
    if (actuallyOffline) return 'offline';
    return 'online';
  };

  const getMainStatusText = () => {
    if (syncInProgress) {
      return `Sincronizare GPS în curs...`;
    }
    // Verificare dublă detecție offline
    const actuallyOffline = !navigator.onLine || !isOnline;
    if (actuallyOffline) {
      return 'MODUL OFFLINE ACTIV';
    }
    if (offlineCount > 0) {
      return 'Date GPS în așteptare';
    }
    return 'GPS Activ';
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
        <div className={`gps-status-icon-header ${getStatusClass()}`}>
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
          <div className="gps-offline-badge-header">
            <i className="fas fa-database"></i>
            <span>{offlineCount}</span>
          </div>
        )}
      </div>

      {syncInProgress && syncProgress.total > 0 && (
        <div className="gps-sync-progress-header">
          <div className="sync-progress-info-header">
            <span className="sync-progress-label-header">Sincronizare GPS</span>
            <span className="sync-progress-count-header">{syncProgress.synced}/{syncProgress.total}</span>
          </div>
          <div className="sync-progress-bar-header">
            <div 
              className="sync-progress-fill-header" 
              style={{ 
                width: `${Math.round((syncProgress.synced / syncProgress.total) * 100)}%` 
              }}
            >
              <div className="sync-progress-shimmer-header"></div>
            </div>
            <div className="sync-progress-percentage-header">
              {Math.round((syncProgress.synced / syncProgress.total) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineGPSMonitor;