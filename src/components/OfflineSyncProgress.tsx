import React, { useState } from 'react';

// BackgroundGPSService handles offline sync natively - simplified stub component

interface OfflineSyncProgressProps {
  className?: string;
}

const OfflineSyncProgress: React.FC<OfflineSyncProgressProps> = ({ className = '' }) => {
  // BackgroundGPSService handles all sync natively - this is just a UI stub
  const [hasOfflineData] = useState(false);
  const [showProgress] = useState(false);

  // Don't render anything - BackgroundGPSService handles sync in background
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
          BackgroundGPSService gestionează sincronizarea în background
        </small>
      </div>
    </div>
  );
};

export default OfflineSyncProgress;