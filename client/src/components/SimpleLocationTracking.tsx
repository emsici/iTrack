import { useEffect, useState } from "react";
import { useTransport } from "@/context/TransportContext";

export default function SimpleLocationTracking() {
  const { 
    transportStatus, 
    setGpsCoordinates, 
    setLastGpsUpdateTime,
    gpsCoordinates 
  } = useTransport();
  
  const [localCoordinates, setLocalCoordinates] = useState<any>(null);
  const [deviceBattery, setDeviceBattery] = useState(100);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [gpsErrorCount, setGpsErrorCount] = useState(0);
  const [lastGpsErrorTime, setLastGpsErrorTime] = useState<Date | null>(null);
  const [lastValidCoordinates, setLastValidCoordinates] = useState<any>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Citire GPS pentru UI când transportul este activ
  useEffect(() => {
    if (transportStatus !== 'active') return;
    
    const getCurrentLocation = () => {
      if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString(),
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0,
              altitude: position.coords.altitude || 0
            };
            
            setLocalCoordinates(coords);
            setGpsCoordinates(coords);
            setLastGpsUpdateTime(new Date().toISOString());
            setLastValidCoordinates(coords);
            
            if (gpsErrorCount > 0) {
              setGpsErrorCount(0);
              setRetryAttempt(0);
            }
          },
          (error) => {
            console.log("GPS temporar indisponibil");
            setGpsErrorCount(prev => prev + 1);
            setLastGpsErrorTime(new Date());
            setRetryAttempt(prev => prev + 1);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    };
    
    getCurrentLocation();
    const interval = setInterval(getCurrentLocation, 30000);
    return () => clearInterval(interval);
  }, [transportStatus, gpsErrorCount, setGpsCoordinates, setLastGpsUpdateTime]);

  // Verificăm periodic conexiunea la internet
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Obținem nivelul bateriei
  useEffect(() => {
    const getBatteryLevel = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          setDeviceBattery(Math.round(battery.level * 100));
        } else {
          setDeviceBattery(100);
        }
      } catch (error) {
        setDeviceBattery(100);
      }
    };
    
    getBatteryLevel();
    const interval = setInterval(getBatteryLevel, 60000);
    return () => clearInterval(interval);
  }, []);

  const isGpsActive = transportStatus === 'active' && localCoordinates;

  // Nu afișăm erori GPS când transportul funcționează corect
  const shouldShowGpsError = transportStatus === 'active' && 
    gpsErrorCount > 5 && 
    (!lastValidCoordinates || (Date.now() - new Date(lastValidCoordinates.timestamp).getTime()) > 300000);

  if (!isGpsActive && transportStatus !== 'active') {
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-600">
        <div className="flex justify-between">
          <span>GPS Status:</span>
          <span className={isGpsActive ? "text-green-600" : "text-red-600"}>
            {isGpsActive ? "Activ" : "Inactiv"}
          </span>
        </div>
        
        {gpsCoordinates && (
          <>
            <div className="flex justify-between">
              <span>Latitudine:</span>
              <span>{gpsCoordinates.latitude?.toFixed(6) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitudine:</span>
              <span>{gpsCoordinates.longitude?.toFixed(6) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Viteză:</span>
              <span>{gpsCoordinates.speed || 0} km/h</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between">
          <span>Conexiune:</span>
          <span className={isConnected ? "text-green-600" : "text-red-600"}>
            {isConnected ? "Online" : "Offline"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Baterie:</span>
          <span className={deviceBattery > 20 ? "text-green-600" : "text-red-600"}>
            {deviceBattery}%
          </span>
        </div>
      </div>
      
      {shouldShowGpsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          GPS indisponibil pentru o perioadă îndelungată
        </div>
      )}
    </div>
  );
}