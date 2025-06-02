import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTransport } from "@/context/TransportContext";
import { Icon, divIcon } from "leaflet";
import { useAuth } from "@/context/AuthContext";

// Fixăm iconițele care nu se încarcă corect în Leaflet
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Stiluri pentru hartă
const mapStyle = {
  height: "400px",
  width: "100%",
  borderRadius: "16px",
  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
  border: "2px solid rgba(59, 130, 246, 0.1)",
  overflow: "hidden",
  position: "relative" as const,
  zIndex: 1,
};

// Iconițe personalizate pentru marcaje
const customIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2559/2559338.png", // Icoană camion
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Iconițe pentru început și sfârșit traseu
const startIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7418/7418232.png", // Icoană steag verde
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const endIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/5610/5610944.png", // Icoană steag roșu
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

type GpsPoint = {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
};

export default function TransportMap() {
  const {
    gpsCoordinates,
    transportStatus,
    currentActiveUit,
    lastGpsUpdateTime,
    isGpsActive,
  } = useTransport();
  const { vehicleInfo } = useAuth();

  // Istoric de coordonate pentru traseu
  const [routeHistory, setRouteHistory] = useState<GpsPoint[]>([]);
  const [center, setCenter] = useState<[number, number]>([44.4268, 26.1025]); // București default
  const [showMap, setShowMap] = useState<boolean>(true);

  // Adaugă coordonatele curente la istoric
  useEffect(() => {
    // Considerăm coordonatele chiar dacă transportul este în pauză
    // Acest lucru ne permite să menținem o urmărire continuă
    if (gpsCoordinates && (transportStatus === "active" || transportStatus === "paused")) {
      // Forțăm persistența transportului activ dacă avem coordonate
      if (transportStatus === "active") {
        try {
          const { forceTransportActive } = require('@/lib/transportHelper');
          forceTransportActive();
        } catch (e) {
          console.error("Eroare la forțarea transportului activ:", e);
        }
      }
      
      setRouteHistory((prev) => {
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
            speed: gpsCoordinates.viteza,
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

  // Dacă nu există un transport activ sau date GPS, nu afișăm nimic
  if (
    (transportStatus !== "active" && transportStatus !== "paused") ||
    !gpsCoordinates
  ) {
    return null;
  }

  // Eliminăm variabila nefolosită
  
  return (
    <div className="relative mb-6">
      {/* Header hartă */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <h3 className="font-semibold text-blue-900">Urmărire în timp real</h3>
        </div>
        <div className="flex justify-between items-center text-sm">
          <h3 className="text-base font-medium text-gray-700">
            Traseu Transport
          </h3>
          <div className="flex items-center gap-2">
            {currentActiveUit && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                UIT: {currentActiveUit.uit}
              </span>
            )}
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              {showMap ? "Ascunde harta" : "Arată harta"}
            </button>
          </div>
        </div>

        {currentActiveUit && (
          <div className="text-xs text-gray-500 flex items-center mt-1">
            <span>{currentActiveUit.start_locatie}</span>
            <div className="mx-2 text-gray-400">→</div>
            <span>{currentActiveUit.stop_locatie}</span>
          </div>
        )}
      </div>

      {/* Afișăm harta conform stării showMap */}
      {showMap && (
        <MapContainer
          center={center}
          zoom={14}
          style={{...mapStyle, minHeight: "400px"}}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marker pentru poziția curentă */}
          {gpsCoordinates && (
            <Marker
              position={[gpsCoordinates.lat, gpsCoordinates.lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-medium">Poziția curentă</p>
                  <p className="text-xs text-gray-600">
                    Lat: {gpsCoordinates.lat.toFixed(6)}, Lng:{" "}
                    {gpsCoordinates.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Viteză: {gpsCoordinates.viteza.toFixed(1)} km/h
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {lastGpsUpdateTime}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Polyline pentru traseu */}
          {routeHistory.length > 1 && (
            <Polyline
              positions={routeHistory.map((point) => [point.lat, point.lng])}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}

          {/* Marker pentru punctul de start */}
          {routeHistory.length > 0 && (
            <Marker
              position={[routeHistory[0].lat, routeHistory[0].lng]}
              icon={startIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-medium">Punct de start</p>
                  <p className="text-xs text-gray-600">
                    Lat: {routeHistory[0].lat.toFixed(6)}, Lng:{" "}
                    {routeHistory[0].lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(routeHistory[0].timestamp).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      )}

      {showMap && gpsCoordinates && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 flex justify-between items-center text-sm">
          <span className="text-gray-600">
            <span className="font-medium">Ultima actualizare:</span>{" "}
            {lastGpsUpdateTime}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600">Baterie:</span>
            <div className="relative flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${gpsCoordinates.baterie > 20 ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: `${gpsCoordinates.baterie}%` }}
                ></div>
              </div>
              <span className="text-sm">
                {gpsCoordinates.baterie}%
              </span>
            </div>
          </div>
        </div>
      )}

      {showMap && routeHistory.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 p-2 rounded-lg">
            <p className="text-xs text-blue-700">Distanță</p>
            <p className="font-medium text-blue-900">
              {calculateDistance(routeHistory).toFixed(2)} km
            </p>
          </div>
          <div className="bg-green-50 p-2 rounded-lg">
            <p className="text-xs text-green-700">Viteză</p>
            <p className="font-medium text-green-900">
              {gpsCoordinates?.viteza.toFixed(1) || 0} km/h
            </p>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg">
            <p className="text-xs text-purple-700">Durată</p>
            <p className="font-medium text-purple-900">
              {calculateTravelTime(routeHistory)}
            </p>
          </div>
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
      currPoint.lng,
    );
  }

  return totalDistance;
}

// Calculează distanța între două puncte GPS folosind formula Haversine
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raza Pământului în km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
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
