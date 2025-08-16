import React, { useState, useEffect } from 'react';

// Extend global Window interface for AndroidGPS
declare global {
  interface Window {
    AndroidGPS?: {
      getServiceStatus?: () => Promise<string>;
    };
  }
}

interface SimpleGPSIndicatorProps {
  className?: string;
}

const SimpleGPSIndicator: React.FC<SimpleGPSIndicatorProps> = ({ className = '' }) => {
  const [gpsStatus, setGpsStatus] = useState({
    isActive: false,
    activeCourses: 0,
    offlineCount: 0,
    networkStatus: true,
    lastTransmission: null as Date | null
  });

  useEffect(() => {
    // Funcție pentru a obține statusul real din SimpleGPSService
    const updateGPSStatus = async () => {
      try {
        if (window.AndroidGPS && window.AndroidGPS.getServiceStatus) {
          // Obține statusul direct din SimpleGPSService
          const statusJson = await window.AndroidGPS.getServiceStatus();
          const status = JSON.parse(statusJson);
          setGpsStatus({
            isActive: status.isActive || false,
            activeCourses: status.activeCourses || 0,
            offlineCount: status.offlineCount || 0,
            networkStatus: status.networkStatus !== false,
            lastTransmission: status.lastTransmission ? new Date(status.lastTransmission) : null
          });
        } else {
          // Browser mode - afișează status default
          setGpsStatus({
            isActive: false,
            activeCourses: 0,
            offlineCount: 0,
            networkStatus: true,
            lastTransmission: null
          });
        }
      } catch (error) {
        console.log('SimpleGPS status check failed (browser mode):', error);
      }
    };

    // Update inițial
    updateGPSStatus();

    // Update la fiecare 3 secunde pentru status real-time
    const interval = setInterval(updateGPSStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  // Nu afișa nimic dacă nu e activ
  if (!gpsStatus.isActive && gpsStatus.activeCourses === 0 && gpsStatus.offlineCount === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!gpsStatus.networkStatus) return 'danger';
    if (gpsStatus.isActive) return 'success';
    if (gpsStatus.offlineCount > 0) return 'warning';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (!gpsStatus.networkStatus) return '📶❌';
    if (gpsStatus.isActive) return '📍✅';
    if (gpsStatus.offlineCount > 0) return '💾⏳';
    return '📍⏸️';
  };

  const getStatusText = () => {
    if (!gpsStatus.networkStatus) return 'Offline';
    if (gpsStatus.isActive) return 'GPS Activ';
    if (gpsStatus.offlineCount > 0) return 'Date nesincronizate';
    return 'GPS Oprit';
  };

  return (
    <div className={`simple-gps-indicator d-flex align-items-center ${className}`}>
      <div className={`badge bg-${getStatusColor()} d-flex align-items-center gap-1`}>
        <span>{getStatusIcon()}</span>
        <small className="fw-bold">{getStatusText()}</small>
        
        {gpsStatus.activeCourses > 0 && (
          <span className="ms-1">
            <small>({gpsStatus.activeCourses} curse)</small>
          </span>
        )}
        
        {gpsStatus.offlineCount > 0 && (
          <span className="ms-1">
            <small>({gpsStatus.offlineCount} coord.)</small>
          </span>
        )}
      </div>
      
      {gpsStatus.lastTransmission && (
        <small className="text-muted ms-2">
          Ultima: {gpsStatus.lastTransmission.toLocaleTimeString('ro-RO')}
        </small>
      )}
    </div>
  );
};

export default SimpleGPSIndicator;