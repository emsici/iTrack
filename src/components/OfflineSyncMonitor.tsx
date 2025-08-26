/**
 * Monitor sincronizare GPS offline cu progres în timp real
 * Afișează statistici detaliate despre coordonatele offline
 */

import React, { useState, useEffect } from 'react';
import { offlineGPSService } from '../services/offlineGPS';

interface OfflineSyncStats {
  totalOffline: number;
  totalSynced: number;
  syncInProgress: boolean;
  lastSyncAttempt: Date | null;
  syncErrors: number;
  currentBatch: number;
  totalBatches: number;
}

interface OfflineSyncMonitorProps {
  isOnline: boolean;
  className?: string;
  currentTheme?: string;
}

const OfflineSyncMonitor: React.FC<OfflineSyncMonitorProps> = ({ isOnline, className = '', currentTheme = 'dark' }) => {
  const [stats, setStats] = useState<OfflineSyncStats>({
    totalOffline: 0,
    totalSynced: 0,
    syncInProgress: false,
    lastSyncAttempt: null,
    syncErrors: 0,
    currentBatch: 0,
    totalBatches: 0
  });
  const [expanded, setExpanded] = useState(false);

  // NU afișa componenta dacă suntem online ȘI nu avem coordonate offline
  if (isOnline && stats.totalOffline === 0 && !stats.syncInProgress) {
    return null;
  }

  useEffect(() => {
    // Subscribe to sync stats updates
    const unsubscribe = offlineGPSService.onSyncStatsChange((newStats) => {
      setStats(newStats);
    });

    return unsubscribe;
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && stats.totalOffline > 0 && !stats.syncInProgress) {
      console.log('🌐 Conexiune restabilită - încep sincronizarea automată...');
      offlineGPSService.syncOfflineCoordinates();
    }
  }, [isOnline, stats.totalOffline, stats.syncInProgress]);

  // Nu mai permitem sincronizare manuală - doar automată

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Niciodată';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Acum';
    if (minutes < 60) return `${minutes}m în urmă`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h în urmă`;
    const days = Math.floor(hours / 24);
    return `${days}z în urmă`;
  };

  const getProgressPercentage = () => {
    if (stats.totalBatches === 0) return 0;
    return Math.round((stats.currentBatch / stats.totalBatches) * 100);
  };


  const getSyncStatusIcon = () => {
    if (stats.syncInProgress) return '🔄';
    if (!isOnline) return '🔌';
    if (stats.totalOffline === 0) return '✅';
    if (stats.syncErrors > 0) return '⚠️';
    return '📡';
  };

  return (
    <div className={className} style={{ 
      background: !isOnline 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
        : stats.totalOffline > 0 
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.1) 100%)',
      border: !isOnline 
        ? '1px solid rgba(239, 68, 68, 0.3)'
        : stats.totalOffline > 0
          ? '1px solid rgba(245, 158, 11, 0.3)'
          : '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '16px',
      boxShadow: !isOnline 
        ? '0 4px 20px rgba(239, 68, 68, 0.2)'
        : stats.totalOffline > 0
          ? '0 4px 20px rgba(245, 158, 11, 0.2)'
          : '0 4px 20px rgba(34, 197, 94, 0.2)',
      backdropFilter: 'blur(10px)',
      margin: '16px',
      overflow: 'hidden'
    }}>
      <div 
        className="card-header d-flex justify-content-between align-items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{ 
          cursor: 'pointer',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '12px 16px'
        }}
      >
        <div className="d-flex align-items-center">
          <span className="me-2" style={{ 
            fontSize: '1.2em',
            filter: !isOnline ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' : stats.totalOffline > 0 ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' : 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
          }}>
            {getSyncStatusIcon()}
          </span>
          <h6 className="mb-0" style={{ 
            fontSize: '1rem', 
            fontWeight: '700',
            color: !isOnline ? '#ef4444' : stats.totalOffline > 0 ? '#f59e0b' : '#22c55e',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
          }}>
            {!isOnline ? 'OFFLINE - GPS se salvează local' : stats.totalOffline > 0 ? 'Sincronizare GPS' : 'GPS sincronizat'}
          </h6>
        </div>
        <div className="d-flex align-items-center">
          {stats.totalOffline > 0 && (
            <span className="badge me-2" style={{ 
              backgroundColor: 'rgba(255, 193, 7, 0.8)', 
              color: '#000',
              fontSize: '0.75rem',
              padding: '4px 8px'
            }}>
              {stats.totalOffline} coord.
            </span>
          )}
          <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: '0.9rem' }}></i>
        </div>
      </div>

      {expanded && (
        <div className="card-body" style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          {/* Statistici generale */}
          <div className="row mb-3">
            <div className="col-4">
              <div className="text-center">
                <div className="h5 mb-0 text-warning">{stats.totalOffline}</div>
                <small style={{ color: currentTheme === 'dark' ? '#94a3b8' : '#6b7280' }}>În așteptare</small>
              </div>
            </div>
            <div className="col-4">
              <div className="text-center">
                <div className="h5 mb-0 text-success">{stats.totalSynced}</div>
                <small style={{ color: currentTheme === 'dark' ? '#94a3b8' : '#6b7280' }}>Sincronizate</small>
              </div>
            </div>
            <div className="col-4">
              <div className="text-center">
                <div className="h5 mb-0 text-danger">{stats.syncErrors}</div>
                <small style={{ color: currentTheme === 'dark' ? '#94a3b8' : '#6b7280' }}>Erori</small>
              </div>
            </div>
          </div>

          {/* Progres sincronizare */}
          {stats.syncInProgress && (
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small style={{ color: currentTheme === 'dark' ? '#e2e8f0' : '#374151' }}>
                  Sincronizare în curs...
                </small>
                <small style={{ color: currentTheme === 'dark' ? '#e2e8f0' : '#374151' }}>
                  {stats.currentBatch}/{stats.totalBatches} loturi
                </small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                  role="progressbar" 
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Info ultima sincronizare */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small style={{ 
              color: currentTheme === 'dark' ? '#94a3b8' : '#6b7280' 
            }}>
              Ultima sincronizare: {formatLastSync(stats.lastSyncAttempt)}
            </small>
            <div className="d-flex align-items-center">
              <span className={`badge ${isOnline ? 'bg-success' : 'bg-danger'} me-2`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Info sincronizare automată */}
          <div style={{
            padding: '12px',
            background: currentTheme === 'dark' 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(34, 197, 94, 0.05)',
            border: `1px solid ${currentTheme === 'dark' 
              ? 'rgba(34, 197, 94, 0.3)' 
              : 'rgba(34, 197, 94, 0.2)'}`,
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <i className="bi bi-info-circle me-2" style={{ 
              color: currentTheme === 'dark' ? '#22c55e' : '#059669' 
            }}></i>
            <small style={{ 
              color: currentTheme === 'dark' ? '#e2e8f0' : '#374151',
              fontWeight: '500'
            }}>
              Sincronizare automată când revine internetul
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncMonitor;