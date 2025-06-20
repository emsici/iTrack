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
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '280px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {!isOnline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: offlineCount > 0 || syncInProgress ? '8px' : '0'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#dc2626',
            borderRadius: '50%'
          }}></div>
          <span>Offline - GPS salvat local</span>
        </div>
      )}
      
      {offlineCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#0f172a',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: syncInProgress ? '8px' : '0'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#f59e0b',
            borderRadius: '50%'
          }}></div>
          <span>{offlineCount} coordonate GPS salvate</span>
        </div>
      )}

      {syncInProgress && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#0f172a',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10b981',
            borderRadius: '50%'
          }}></div>
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