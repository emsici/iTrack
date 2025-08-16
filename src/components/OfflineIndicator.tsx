import React, { useState, useEffect } from 'react';
// SimpleGPSService handles network detection natively
// SimpleGPSService handles offline GPS natively - no separate service needed
const getOfflineGPSCount = () => Promise.resolve(0);

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    // Ascultă schimbări de status rețea
    // SimpleGPSService handles network detection through GPS transmissions
    setIsOnline(true); // Default online status

    // Actualizează numărul de coordonate offline
    const updateOfflineCount = async () => {
      try {
        const count = await getOfflineGPSCount();
        setOfflineCount(count);
      } catch (error) {
        console.error('Error getting offline count:', error);
      }
    };

    // Actualizare inițială
    updateOfflineCount();

    // Actualizare periodică la fiecare 5 secunde
    const interval = setInterval(updateOfflineCount, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (isOnline && offlineCount === 0) {
    return null; // Nu afișa nimic când totul e OK
  }

  return (
    <div className={`offline-indicator ${className}`}>
      {!isOnline && (
        <div className="alert alert-warning d-flex align-items-center mb-2" role="alert">
          <i className="bi bi-wifi-off me-2"></i>
          <div>
            <strong>Offline</strong> - Coordonatele GPS se salvează local
          </div>
        </div>
      )}
      
      {offlineCount > 0 && (
        <div className="alert alert-info d-flex align-items-center mb-2" role="alert">
          <i className="bi bi-cloud-upload me-2"></i>
          <div>
            <strong>{offlineCount}</strong> coordonate în așteptare pentru sincronizare
            {!isOnline && <span className="text-muted ms-2">(se vor trimite când revine internetul)</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;