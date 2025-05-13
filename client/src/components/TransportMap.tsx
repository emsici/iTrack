import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTransport } from '@/context/TransportContext';
import { Icon, divIcon } from 'leaflet';
import { useAuth } from '@/context/AuthContext';

// Stiluri pentru hartă
const mapStyle = {
  height: '400px',
  width: '100%',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

// Iconițe personalizate pentru marcaje
const customIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2559/2559338.png', // Icoană camion
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Iconițe pentru început și sfârșit traseu
const startIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7418/7418232.png', // Icoană steag verde
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const endIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5610/5610944.png', // Icoană steag roșu
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

type GpsPoint = {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
};

export default function TransportMap() {
  const { gpsCoordinates, transportStatus, currentActiveUit } = useTransport();
  const { vehicleInfo } = useAuth();
  
  // Istoric de coordonate pentru traseu
  const [routeHistory, setRouteHistory] = useState<GpsPoint[]>([]);
  const [center, setCenter] = useState<[number, number]>([44.4268, 26.1025]); // București default
  
  // Adaugă coordonatele curente la istoric
  useEffect(() => {
    if (gpsCoordinates && transportStatus === "active") {
      setRouteHistory(prev => {
        // Adăugăm noul punct numai dacă este diferit de ultimul
        const lastPoint = prev[prev.length - 1];
        if (
          !lastPoint || 
          Math.abs(lastPoint.lat - gpsCoordinates.lat) > 0.0001 || 
          Math.abs(lastPoint.lng - gpsCoordinates.lng) > 0.0001
        ) {
          const newPoint = {
            lat: gpsCoordinates.lat,
            lng: gpsCoordinates.lng,
            timestamp: gpsCoordinates.timestamp,
            speed: gpsCoordinates.viteza
          };
          
          // Centrăm harta pe noile coordonate
          setCenter([gpsCoordinates.lat, gpsCoordinates.lng]);
          
          // Limităm istoricul la 1000 de puncte pentru performanță
          const newHistory = [...prev, newPoint];
          if (newHistory.length > 1000) {
            return newHistory.slice(-1000);
          }
          return newHistory;
        }
        return prev;
      });
    }
  }, [gpsCoordinates, transportStatus]);
  
  // Resetăm istoricul când transportul s-a terminat
  useEffect(() => {
    if (transportStatus === "inactive" || transportStatus === "finished") {
      setRouteHistory([]);
    }
  }, [transportStatus]);
  
  // Nu afișăm harta dacă nu există un transport activ sau date GPS
  if (transportStatus !== "active" && transportStatus !== "paused") {
    return (
      <div className="p-4 bg-gray-100 rounded-lg shadow-sm text-center">
        <h3 className="text-lg font-medium">Hartă Transport</h3>
        <p className="text-gray-500 mt-2">Începeți un transport pentru a vedea traseul pe hartă.</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-3">
        Traseu Transport
        {currentActiveUit && <span className="text-sm text-blue-600 ml-2">UIT: {currentActiveUit.uit}</span>}
      </h3>
      
      <MapContainer 
        center={center} 
        zoom={14} 
        style={mapStyle}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Punctul curent */}
        {gpsCoordinates && (
          <Marker 
            position={[gpsCoordinates.lat, gpsCoordinates.lng]} 
            icon={customIcon}
          >
            <Popup>
              <div>
                <strong>Vehicul: {vehicleInfo?.nr || 'N/A'}</strong><br />
                <strong>UIT: {currentActiveUit?.uit || 'N/A'}</strong><br />
                <span>Viteză: {gpsCoordinates.viteza.toFixed(1)} km/h</span><br />
                <span>Baterie: {gpsCoordinates.baterie}%</span><br />
                <span>Timp: {new Date(gpsCoordinates.timestamp).toLocaleTimeString()}</span>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Traseu - linie care conectează punctele */}
        {routeHistory.length > 1 && (
          <Polyline 
            positions={routeHistory.map(point => [point.lat, point.lng])} 
            color="blue" 
            weight={4} 
            opacity={0.7}
          />
        )}
        
        {/* Punct de start (primul punct din istoric) */}
        {routeHistory.length > 0 && (
          <Marker 
            position={[routeHistory[0].lat, routeHistory[0].lng]} 
            icon={startIcon}
          >
            <Popup>
              <div>
                <strong>Punct de plecare</strong><br />
                <span>Timp: {new Date(routeHistory[0].timestamp).toLocaleString()}</span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {routeHistory.length > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <p>Distanța estimată: {calculateDistance(routeHistory).toFixed(2)} km</p>
          <p>Viteză curentă: {gpsCoordinates?.viteza.toFixed(1) || 0} km/h</p>
          <p>Timpul de deplasare: {calculateTravelTime(routeHistory)}</p>
        </div>
      )}
    </div>
  );
}

// Funcție pentru calcularea distanței totale în km
function calculateDistance(points: GpsPoint[]): number {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currPoint = points[i];
    totalDistance += getDistanceFromLatLonInKm(
      prevPoint.lat, 
      prevPoint.lng, 
      currPoint.lat, 
      currPoint.lng
    );
  }
  
  return totalDistance;
}

// Calculează distanța între două puncte GPS folosind formula Haversine
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Formatează timpul de călătorie
function calculateTravelTime(points: GpsPoint[]): string {
  if (points.length < 2) return "0 minute";
  
  const startTime = new Date(points[0].timestamp).getTime();
  const endTime = new Date(points[points.length - 1].timestamp).getTime();
  const totalMinutes = Math.floor((endTime - startTime) / (1000 * 60));
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minute`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} ore și ${minutes} minute`;
}