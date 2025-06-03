import { useEffect, useState, useRef, useCallback } from 'react';
import { useTransport } from '@/context/TransportContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, BarChart3, Activity, Battery, Truck } from 'lucide-react';

interface TransportStatistics {
  distanceTraveled: number;
  averageSpeed: number;
  maxSpeed: number;
  travelTime: number; // în minute
  batteryLevel: number;
  status: string;
  speedHistory?: number[]; // Adăugat pentru a evita dependența externă
}

export default function TransportStats() {
  const { gpsCoordinates, transportStatus, currentActiveUit, battery } = useTransport();
  
  const [stats, setStats] = useState<TransportStatistics>({
    distanceTraveled: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    travelTime: 0,
    batteryLevel: battery || 100,
    status: transportStatus || 'inactive',
    speedHistory: [],
  });
  
  // Referințe pentru calcule statistici care nu trebuie să declanșeze re-renderări
  const startTimeRef = useRef<Date | null>(null);
  const previousCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const speedHistoryRef = useRef<number[]>([]);
  
  // Actualizăm starea când se modifică statusul transportului
  useEffect(() => {
    // Când începe transportul
    if (transportStatus === 'active' && !startTimeRef.current) {
      startTimeRef.current = new Date();
    } 
    // Când se oprește/resetează transportul
    else if (transportStatus === 'inactive') {
      // Resetăm toate datele
      startTimeRef.current = null;
      previousCoordsRef.current = null;
      speedHistoryRef.current = [];
      
      setStats({
        distanceTraveled: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        travelTime: 0,
        batteryLevel: battery || 100,
        status: 'inactive',
        speedHistory: []
      });
    }
    
    // Actualizăm statusul în statistici
    setStats(prev => ({
      ...prev,
      status: transportStatus || 'inactive',
      batteryLevel: battery || prev.batteryLevel
    }));
  }, [transportStatus, battery]);
  
  // Actualizează statisticile când se primesc noi coordonate GPS
  // Funcție pentru procesarea statisticilor de transport
  const processTransportStats = useCallback(() => {
    // IMPORTANT: Verificăm explicit că avem GPS coordonate și transportul este activ
    if (!gpsCoordinates || transportStatus !== 'active') return;
    
    // Preluăm valorile necesare pentru calcule
    const newSpeed = gpsCoordinates.viteza;
    const newCoords = { lat: gpsCoordinates.lat, lng: gpsCoordinates.lng };
    
    // Calculează distanța doar dacă avem coordonate anterioare
    let distanceToAdd = 0;
    if (previousCoordsRef.current) {
      distanceToAdd = calculateDistance(
        previousCoordsRef.current.lat,
        previousCoordsRef.current.lng,
        newCoords.lat,
        newCoords.lng
      );
    }
    
    // Calculează timpul de călătorie
    const travelTimeMinutes = startTimeRef.current 
      ? Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / (1000 * 60)) 
      : 0;
    
    // Construim noul istoric de viteză
    const newSpeedHistoryArray = [...speedHistoryRef.current, newSpeed];
    
    // Calcul statistici
    const avgSpeed = newSpeedHistoryArray.length > 0 
      ? newSpeedHistoryArray.reduce((a, b) => a + b, 0) / newSpeedHistoryArray.length 
      : 0;
    
    const maxSpeed = newSpeedHistoryArray.length > 0 
      ? Math.max(...newSpeedHistoryArray) 
      : 0;
    
    // Actualizăm valorile în referințe fără a declanșa re-renderări
    speedHistoryRef.current = newSpeedHistoryArray;
    previousCoordsRef.current = newCoords;
    
    // Actualizăm statisticile o singură dată
    setStats(prevStats => ({
      ...prevStats,
      distanceTraveled: prevStats.distanceTraveled + distanceToAdd,
      averageSpeed: avgSpeed,
      maxSpeed: maxSpeed,
      travelTime: travelTimeMinutes,
      batteryLevel: gpsCoordinates.baterie,
      status: transportStatus,
      speedHistory: newSpeedHistoryArray
    }));
  }, [gpsCoordinates, transportStatus, calculateDistance]);
  
  // Efect pentru procesarea statisticilor când se schimbă coordonatele GPS
  useEffect(() => {
    if (gpsCoordinates && transportStatus === 'active') {
      processTransportStats();
    }
  }, [gpsCoordinates, transportStatus, processTransportStats]);
  
  // Formatare timp de călătorie
  const formatTravelTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minute`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ore ${mins} minute`;
  };
  
  // Formatare distanță
  const formatDistance = (km: number) => {
    return km < 1 
      ? `${Math.round(km * 1000)} m` 
      : `${km.toFixed(2)} km`;
  };
  
  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'finished': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Statistici Transport</span>
          <Badge className={getStatusColor(stats.status)}>
            {stats.status === 'active' ? 'În desfășurare' : 
             stats.status === 'paused' ? 'Pauză' : 
             stats.status === 'finished' ? 'Finalizat' : 'Inactiv'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(
          <Tabs defaultValue="overview">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="overview" className="flex-1">Sumar</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Detalii</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">Distanță</p>
                  </div>
                  <p className="text-xl font-bold">{formatDistance(stats.distanceTraveled)}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium">Viteză medie</p>
                  </div>
                  <p className="text-xl font-bold">{stats.averageSpeed.toFixed(1)} km/h</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium">Timp</p>
                  </div>
                  <p className="text-xl font-bold">{formatTravelTime(stats.travelTime)}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Battery className="mr-2 h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium">Baterie</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={stats.batteryLevel} className="h-2" />
                    <span className="text-sm font-medium">{stats.batteryLevel}%</span>
                  </div>
                </div>
              </div>
              
              {currentActiveUit && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Transport</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{currentActiveUit.start_locatie}</span>
                    <span>→</span>
                    <span>{currentActiveUit.stop_locatie}</span>
                  </div>
                  <p className="text-xs mt-1 font-medium">UIT: {currentActiveUit.uit}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4 text-blue-500" />
                    Detalii deplasare
                  </h4>
                  <ul className="mt-2 space-y-2">
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-500">Distanță totală:</span>
                      <span className="font-medium">{formatDistance(stats.distanceTraveled)}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-500">Viteză maximă:</span>
                      <span className="font-medium">{stats.maxSpeed.toFixed(1)} km/h</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-500">Viteză medie:</span>
                      <span className="font-medium">{stats.averageSpeed.toFixed(1)} km/h</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-500">Durată:</span>
                      <span className="font-medium">{formatTravelTime(stats.travelTime)}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-500">Timp efectiv de conducere:</span>
                      <span className="font-medium">{formatTravelTime(stats.travelTime)}</span>
                    </li>
                  </ul>
                </div>
                
                {gpsCoordinates && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Poziție curentă</h4>
                    <div className="bg-gray-50 p-2 rounded-md text-xs">
                      <p>Lat: {gpsCoordinates?.lat ? gpsCoordinates.lat.toFixed(6) : '--'}, Lng: {gpsCoordinates?.lng ? gpsCoordinates.lng.toFixed(6) : '--'}</p>
                      <p>Altitudine: {gpsCoordinates.altitudine}m</p>
                      <p>Direcție: {gpsCoordinates.directie}°</p>
                      <p>Ultima actualizare: {new Date(gpsCoordinates.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// Calculează distanța între două puncte GPS folosind formula Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raza Pământului în km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}