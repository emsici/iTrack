import React, { useState } from 'react';

interface OfflineStatusIndicatorProps {
  isOnline: boolean;
  offlineCount: number;
  isSyncing?: boolean;
}

const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({ 
  isOnline, 
  offlineCount, 
  isSyncing = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="offline-status-indicator">
      <style>{`
        .offline-status-indicator {
          position: fixed;
          top: 130px;
          left: 10px;
          right: 10px;
          z-index: 999;
          max-width: calc(100vw - 20px);
        }

        .status-badge {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .status-badge:hover {
          background: rgba(15, 23, 42, 0.98);
          transform: translateY(-1px);
        }

        .status-icon {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: ${isSyncing ? 'pulse 1.5s infinite' : 'none'};
        }

        .status-icon.online {
          background: #10b981;
        }

        .status-icon.offline {
          background: #ef4444;
        }

        .status-icon.syncing {
          background: #f59e0b;
        }

        .status-text {
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
        }

        .offline-count {
          color: #f59e0b;
          font-size: 11px;
          background: rgba(245, 158, 11, 0.2);
          padding: 2px 6px;
          border-radius: 8px;
          margin-left: 4px;
        }

        .status-details {
          margin-top: 8px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          font-size: 11px;
          color: #cbd5e1;
          line-height: 1.4;
          animation: slideDown 0.3s ease;
        }

        .sync-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .sync-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(245, 158, 11, 0.3);
          border-top: 2px solid #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .offline-status-indicator {
            left: 50%;
            transform: translateX(-50%);
            max-width: calc(100vw - 20px);
          }
        }
      `}</style>

      <div 
        className="status-badge"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div 
          className={`status-icon ${
            isSyncing ? 'syncing' : isOnline ? 'online' : 'offline'
          }`}
        />
        <span className="status-text">
          {isSyncing ? 'Sincronizare...' : isOnline ? 'Online' : 'Offline'}
        </span>
        {offlineCount > 0 && (
          <span className="offline-count">{offlineCount}</span>
        )}
        <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'}`} style={{ 
          fontSize: '10px', 
          color: '#94a3b8',
          marginLeft: '4px'
        }}></i>
      </div>

      {showDetails && (
        <div className="status-details">
          <div><strong>Status conexiune:</strong> {isOnline ? 'Conectat' : 'Deconectat'}</div>
          <div><strong>GPS offline:</strong> {offlineCount} coordonate</div>
          {isSyncing && (
            <div className="sync-progress">
              <div className="sync-spinner"></div>
              <span>Se sincronizează datele GPS...</span>
            </div>
          )}
          {offlineCount > 0 && !isSyncing && (
            <div style={{ marginTop: '8px', color: '#f59e0b' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
              {offlineCount} coordonate vor fi trimise când conexiunea se restabilește
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;