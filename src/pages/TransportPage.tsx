import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Geolocation } from '@capacitor/geolocation';
import { App as CapApp } from '@capacitor/app';
import GpsTracking from '../lib/gps-bridge';
import type { GPSData } from '../../shared/schema';

interface Transport {
  id: string;
  vehicleNumber: string;
  uit: string;
  company: string;
  driver: string;
  route: string;
  status: 'active' | 'inactive' | 'tracking';
  lastUpdate?: Date;
  coordinates?: { lat: number; lng: number };
}

export default function TransportPage() {
  const [transports, setTransports] = useState<Transport[]>([
    {
      id: '1',
      vehicleNumber: 'CT01ZZZ',
      uit: '5C3W1A7A0W0V7165',
      company: 'Transport Express SRL',
      driver: 'Popescu Ion',
      route: 'București - Constanța',
      status: 'inactive'
    },
    {
      id: '2',
      vehicleNumber: 'B102ABC',
      uit: '7F4D2B8C9A1E3456',
      company: 'Rapid Cargo SA',
      driver: 'Marinescu Maria',
      route: 'Cluj - Timișoara',
      status: 'inactive'
    }
  ]);
  
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{transportId: string, field: string} | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const watchId = useRef<string | null>(null);
  const backgroundService = useRef<boolean>(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ro-RO');
    setLogs(prev => [`${timestamp} - ${message}`, ...prev.slice(0, 9)]);
    console.log(message);
  };

  const updateTransportField = (transportId: string, field: string, value: string) => {
    setTransports(prev => prev.map(transport => 
      transport.id === transportId 
        ? { ...transport, [field]: value }
        : transport
    ));
    setEditingField(null);
  };

  const toggleTransportStatus = (transportId: string) => {
    const transport = transports.find(t => t.id === transportId);
    if (!transport) return;

    if (transport.status === 'tracking') {
      stopGPSTracking(transportId);
    } else {
      startBackgroundGPS(transportId);
    }
  };

  // GPS credentials mutation
  const credentialsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/gps/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configured: true })
      });
      return response.json();
    }
  });

  // GPS transmission mutation
  const gpsMutation = useMutation({
    mutationFn: async (data: GPSData) => {
      addLog(`Transmit coordonate GPS: ${JSON.stringify(data)}`);
      const response = await fetch('/api/gps/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('GPS transmission failed');
      return response.json();
    },
    onSuccess: (result) => {
      addLog(`Răspuns transmisie GPS: ${JSON.stringify(result)}`);
    },
    onError: (error) => {
      addLog(`Eroare transmisie GPS: ${error.message}`);
    }
  });

  // Start native background GPS tracking
  const startBackgroundGPS = async (transportId: string) => {
    try {
      const transport = transports.find(t => t.id === transportId);
      if (!transport) return;

      addLog(`Inițiez urmărirea GPS pentru ${transport.vehicleNumber}...`);

      // Request location permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        addLog("Permisiuni locație refuzate");
        return;
      }

      // Update transport status
      setTransports(prev => prev.map(t => 
        t.id === transportId 
          ? { ...t, status: 'tracking' as const, lastUpdate: new Date() }
          : t
      ));

      // Use native GPS plugin
      try {
        addLog("Pornesc serviciul GPS nativ în fundal");
        await GpsTracking.startBackgroundTracking({
          interval: 60000, // 1 minute
          enableWakeLock: true,
          notificationTitle: "FleetTracker Pro GPS",
          notificationText: `Urmărire ${transport.vehicleNumber} în curs...`
        });
        
        // Listen for location updates from native plugin
        await GpsTracking.addListener('locationUpdate', (location) => {
          const newGpsData: GPSData = {
            vehicleNumber: transport.vehicleNumber,
            uit: transport.uit,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date(location.timestamp).toISOString(),
            status: 2
          };
          
          setGpsData(newGpsData);
          
          // Update transport coordinates
          setTransports(prev => prev.map(t => 
            t.id === transportId 
              ? { ...t, coordinates: { lat: location.latitude, lng: location.longitude }, lastUpdate: new Date() }
              : t
          ));
          
          gpsMutation.mutate(newGpsData);
        });
        
        backgroundService.current = true;
        addLog(`✅ GPS pornit pentru ${transport.vehicleNumber}`);
      } catch (nativeError) {
        addLog("Eroare serviciu nativ, folosesc Capacitor Geolocation");
        // Fallback to Capacitor Geolocation with high accuracy
        watchId.current = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }, (position, err) => {
          if (err) {
            addLog(`Eroare GPS: ${err.message}`);
            return;
          }
          
          if (position) {
            const newGpsData: GPSData = {
              vehicleNumber: transport.vehicleNumber,
              uit: transport.uit,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString(),
              status: 2
            };
            
            setGpsData(newGpsData);
            setTransports(prev => prev.map(t => 
              t.id === transportId 
                ? { ...t, coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }, lastUpdate: new Date() }
                : t
            ));
            gpsMutation.mutate(newGpsData);
          }
        });
      }

      addLog(`Transmisie GPS activă pentru ${transport.vehicleNumber}`);
      
    } catch (error) {
      addLog(`Eroare pornire transport: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    }
  };

  // Stop GPS tracking
  const stopGPSTracking = async () => {
    try {
      if (backgroundService.current) {
        await GpsTracking.stopBackgroundTracking();
        backgroundService.current = false;
        addLog("Serviciu GPS nativ oprit");
      }
      
      if (watchId.current) {
        await Geolocation.clearWatch({ id: watchId.current });
        watchId.current = null;
        addLog("Urmărire Capacitor oprită");
      }
      
      setIsTracking(false);
      addLog("Urmărire GPS oprită");
    } catch (error) {
      addLog(`Eroare oprire GPS: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    }
  };

  // Handle app state changes for background GPS
  useEffect(() => {
    const handleAppStateChange = (state: { isActive: boolean }) => {
      if (!state.isActive && isTracking) {
        addLog("Aplicația este în fundal - GPS continuă să funcționeze");
      } else if (state.isActive && isTracking) {
        addLog("Aplicația este activă - GPS funcționează normal");
      }
    };

    CapApp.addListener('appStateChange', handleAppStateChange);
    
    return () => {
      CapApp.removeAllListeners();
    };
  }, [isTracking]);

  // Initialize GPS credentials on mount
  useEffect(() => {
    credentialsMutation.mutate();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopGPSTracking();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-lg leading-6 font-medium text-gray-900">
            Urmărire Transport GPS
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Urmărire în timp real cu funcționare în fundal
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Vehicle Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informații Vehicul
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Număr Vehicul
                  </label>
                  <input
                    type="text"
                    value={vehicleData.vehicleNumber}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={isTracking}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    UIT
                  </label>
                  <input
                    type="text"
                    value={vehicleData.uit}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, uit: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={isTracking}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GPS Control Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Control GPS
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isTracking ? 'Urmărirea GPS este activă' : 'Urmărirea GPS este oprită'}
                  </p>
                </div>
                <div className="flex space-x-3">
                  {!isTracking ? (
                    <button
                      onClick={startBackgroundGPS}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pornește GPS
                    </button>
                  ) : (
                    <button
                      onClick={stopGPSTracking}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
                      </svg>
                      Oprește GPS
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* GPS Status Card */}
          {gpsData && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Ultimele Coordonate GPS
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Latitudine</dt>
                    <dd className="mt-1 text-sm text-gray-900">{gpsData.latitude.toFixed(6)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Longitudine</dt>
                    <dd className="mt-1 text-sm text-gray-900">{gpsData.longitude.toFixed(6)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(gpsData.timestamp).toLocaleString('ro-RO')}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Jurnal Activitate
              </h3>
              <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Nu există activitate înregistrată</p>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <p key={index} className="text-xs font-mono text-gray-700">
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}