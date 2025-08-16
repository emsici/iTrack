import React, { useState, useEffect } from 'react';

// SimpleGPSService handles offline sync natively - simplified stub component
interface SyncProgress {
  isActive: boolean;
  totalToSync: number;
  synced: number;
  failed: number;
  remaining: number;
  percentage: number;
  startTime: Date | null;
  estimatedTimeRemaining: number | null;
  lastError: string | null;
}

interface OfflineSyncProgressProps {
  className?: string;
}

const OfflineSyncProgress: React.FC<OfflineSyncProgressProps> = ({ className = '' }) => {
  // SimpleGPSService handles all sync natively - this is just a UI stub
  const [isOnline] = useState(true);
  const [hasOfflineData] = useState(false);
  const [showProgress] = useState(false);

  // Don't render anything - SimpleGPSService handles sync in background
  if (!hasOfflineData && !showProgress) {
    return null;
  }

  return (
    <div className={`offline-sync-progress ${className}`}>
      <div className="d-flex align-items-center">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span className="visually-hidden">Sincronizare...</span>
        </div>
        <small className="text-muted">
          SimpleGPSService gestionează sincronizarea în background
        </small>
      </div>
    </div>
  );
};

export default OfflineSyncProgress;