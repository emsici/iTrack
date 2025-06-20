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

          // Auto-sync when online and have offline coordinates
          if (isOnline && count > 0 && !syncInProgress) {
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
    if (!isOnline) return 'fas fa-wifi-slash';
    return 'fas fa-wifi';
  };

  const getStatusClass = () => {
    if (syncInProgress) return 'syncing';
    if (!isOnline) return 'offline';
    return 'online';
  };

  const getMainStatusText = () => {
    if (syncInProgress) {
      return `Sincronizare GPS în curs...`;
    }
    if (!isOnline || !navigator.onLine) {
      return 'Modul Offline Activ';
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
    if (!isOnline && offlineCount > 0) {
      return `${offlineCount} coordonate salvate local`;
    }
    if (isOnline && offlineCount === 0) {
      return 'Toate datele sincronizate';
    }
    return 'Gata pentru urmărire GPS';
  };

  return (
    <div className="offline-monitor">
      <div className="offline-status-display">
        <div className={`status-indicator-icon ${getStatusClass()}`}>
          <i className={getStatusIcon()}></i>
        </div>
        
        <div className="status-text-group">
          <div className="status-main-text">
            {getMainStatusText()}
          </div>
          <div className="status-sub-text">
            {getSubStatusText()}
          </div>
        </div>
      </div>

      {offlineCount > 0 && !syncInProgress && (
        <div className={`offline-counter ${offlineCount < 50 ? 'low-count' : ''}`}>
          <i className="fas fa-database"></i>
          <span>{offlineCount}</span>
        </div>
      )}

      {syncInProgress && syncProgress.total > 0 && (
        <div className="sync-progress-container">
          <div 
            className="sync-progress-bar" 
            style={{ 
              width: `${Math.round((syncProgress.synced / syncProgress.total) * 100)}%` 
            }}
          ></div>
          <div className="sync-progress-text">
            {Math.round((syncProgress.synced / syncProgress.total) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineGPSMonitor;