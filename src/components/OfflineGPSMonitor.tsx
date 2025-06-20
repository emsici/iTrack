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
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let syncSubscription: (() => void) | null = null;

    if (coursesActive) {
      // Monitor offline GPS count
      const updateStatus = async () => {
        try {
          const count = await getOfflineGPSCount();
          setOfflineCount(count);
          setShowStatus(count > 0 || !isOnline);

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

      // Subscribe to sync progress
      if (subscribeToSyncProgress) {
        syncSubscription = subscribeToSyncProgress({
          onProgressUpdate: (progress) => {
            setSyncProgress({
              synced: progress.synced,
              failed: progress.failed,
              total: progress.totalToSync
            });
            setSyncInProgress(progress.isActive);
            console.log(`🔄 Progres: ${progress.synced}/${progress.totalToSync} (${progress.percentage}%)`);
          },
          onSyncComplete: () => {
            console.log("✅ Sincronizare GPS completă");
            setSyncInProgress(false);
            setShowStatus(false);
          },
          onSyncError: (error) => {
            console.error("❌ Eroare sync:", error);
            setSyncInProgress(false);
          }
        });
      }

      updateStatus();
      interval = setInterval(updateStatus, 3000);

      return () => {
        clearInterval(interval);
        if (syncSubscription) {
          syncSubscription();
        }
      };
    }
  }, [coursesActive, isOnline, syncInProgress]);

  if (!showStatus) return null;

  return (
    <div className="offline-gps-status">
      {!isOnline && (
        <div className="offline-indicator">
          <i className="fas fa-wifi-slash"></i>
          <span>Offline - GPS salvat local</span>
        </div>
      )}
      
      {offlineCount > 0 && (
        <div className="offline-count">
          <i className="fas fa-database"></i>
          <span>{offlineCount} coordonate GPS offline</span>
        </div>
      )}

      {syncInProgress && (
        <div className="sync-progress">
          <i className="fas fa-sync fa-spin"></i>
          <span>
            Sincronizare: {syncProgress.synced}/{syncProgress.total}
            {syncProgress.failed > 0 && ` (${syncProgress.failed} eșecuri)`}
          </span>
        </div>
      )}
    </div>
  );
};

export default OfflineGPSMonitor;