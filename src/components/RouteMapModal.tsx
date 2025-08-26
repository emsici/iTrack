import React, { useState, useEffect, useRef } from 'react';
import { CourseStatistics } from '../services/courseAnalytics';

// Import Leaflet dynamically to avoid SSR issues
let L: any = null;

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: CourseStatistics;
  currentTheme: string;
}

const RouteMapModal: React.FC<RouteMapModalProps> = ({ isOpen, onClose, courseData, currentTheme }) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapStats, setMapStats] = useState({
    totalPoints: 0,
    displayedPoints: 0,
    distance: 0,
    duration: 0
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && !L) {
      loadLeaflet();
    }
  }, [isOpen]);

  // CLEANUP pentru interval la unmount
  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
    };
  }, []);

  const loadLeaflet = async () => {
    try {
      // Dynamically import Leaflet
      const leaflet = await import('leaflet');
      L = leaflet.default;

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Fix marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      setIsLoading(false);
      initializeMap();
    } catch (err) {
      setError('Eroare la încărcarea hărții');
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !L || !courseData.gpsPoints.length) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const points = courseData.gpsPoints;
    
    // Optimize points - sample every N points based on total
    const sampleRate = Math.max(1, Math.floor(points.length / 1000)); // Max 1000 points displayed
    const sampledPoints = points.filter((_, index) => index % sampleRate === 0);
    
    setMapStats({
      totalPoints: points.length,
      displayedPoints: sampledPoints.length,
      distance: courseData.totalDistance,
      duration: courseData.drivingTime
    });

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Create polyline for route
    const routeCoords = sampledPoints.map(point => [point.lat, point.lng]);
    const polyline = L.polyline(routeCoords, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8
    }).addTo(map);

    // Add start marker (green)
    if (sampledPoints.length > 0) {
      const startPoint = sampledPoints[0];
      L.marker([startPoint.lat, startPoint.lng], {
        icon: L.divIcon({
          html: '<div style="background: #22c55e; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">S</div>',
          className: 'custom-marker',
          iconSize: [20, 20]
        })
      }).bindPopup(`
        <strong>START</strong><br>
        Timp: ${new Date(startPoint.timestamp).toLocaleString('ro-RO')}<br>
        Coordonate: ${startPoint.lat.toFixed(6)}, ${startPoint.lng.toFixed(6)}
      `).addTo(map);
    }

    // Add end marker (red)
    if (sampledPoints.length > 1) {
      const endPoint = sampledPoints[sampledPoints.length - 1];
      L.marker([endPoint.lat, endPoint.lng], {
        icon: L.divIcon({
          html: '<div style="background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">F</div>',
          className: 'custom-marker',
          iconSize: [20, 20]
        })
      }).bindPopup(`
        <strong>FINAL</strong><br>
        Timp: ${new Date(endPoint.timestamp).toLocaleString('ro-RO')}<br>
        Coordonate: ${endPoint.lat.toFixed(6)}, ${endPoint.lng.toFixed(6)}
      `).addTo(map);
    }

    // Add speed-colored segments (optional - only if performance allows)
    if (sampledPoints.length < 500) {
      for (let i = 1; i < sampledPoints.length; i++) {
        const speed = sampledPoints[i].speed || 0;
        let color = '#6b7280'; // Gray for 0 speed
        
        if (speed > 0 && speed <= 30) color = '#22c55e'; // Green for slow
        else if (speed > 30 && speed <= 60) color = '#f59e0b'; // Orange for medium  
        else if (speed > 60) color = '#ef4444'; // Red for fast

        L.polyline([
          [sampledPoints[i-1].lat, sampledPoints[i-1].lng],
          [sampledPoints[i].lat, sampledPoints[i].lng]
        ], {
          color,
          weight: 3,
          opacity: 0.7
        }).addTo(map);
      }
    }

    // Fit map to route
    if (routeCoords.length > 0) {
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }

    mapInstanceRef.current = map;
  };

  const startReplay = () => {
    if (!courseData.gpsPoints.length || isReplaying) return;
    
    setIsReplaying(true);
    setReplayProgress(0);
    
    const points = courseData.gpsPoints;
    const totalTime = 5000 / playbackSpeed; // 5 seconds per point, adjusted by speed
    const intervalTime = totalTime / points.length;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= points.length) {
        clearInterval(interval);
        replayIntervalRef.current = null;
        setIsReplaying(false);
        setReplayProgress(100);
        return;
      }
      
      const progress = (currentIndex / points.length) * 100;
      setReplayProgress(progress);
      
      // Update map view to follow current point
      if (mapInstanceRef.current && points[currentIndex]) {
        const point = points[currentIndex];
        mapInstanceRef.current.setView([point.lat, point.lng], 15);
        
        // Add temporary marker for current position
        if (currentIndex > 0) {
          L.marker([point.lat, point.lng], {
            icon: L.divIcon({
              html: '<div style="background: #8b5cf6; color: white; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; font-size: 10px;">•</div>',
              className: 'replay-marker',
              iconSize: [15, 15]
            })
          }).addTo(mapInstanceRef.current);
        }
      }
      
      currentIndex++;
    }, intervalTime);
    
    replayIntervalRef.current = interval;
  };

  const exportGPX = () => {
    const points = courseData.gpsPoints;
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="iTrack">
  <trk>
    <name>UIT ${courseData.uit} - ${courseData.vehicleNumber}</name>
    <trkseg>
${points.map(point => `      <trkpt lat="${point.lat}" lon="${point.lng}">
        <time>${point.timestamp}</time>
        <extensions>
          <speed>${point.speed}</speed>
          <accuracy>${point.accuracy}</accuracy>
        </extensions>
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itrack_${courseData.uit}_${courseData.vehicleNumber}_${new Date().toISOString().split('T')[0]}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        width: '95%',
        height: '90%',
        maxWidth: '1200px',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Traseu GPS - UIT {courseData.uit}
            </h3>
            <p style={{
              margin: '5px 0 0 0',
              color: currentTheme === 'dark' ? '#9ca3af' : '#64748b',
              fontSize: '14px'
            }}>
              Vehicul: {courseData.vehicleNumber} • {mapStats.totalPoints} puncte GPS
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: currentTheme === 'dark' ? '#9ca3af' : '#64748b'
            }}>
              <span>📍 {mapStats.displayedPoints} puncte</span>
              <span>📏 {mapStats.distance.toFixed(1)} km</span>
              <span>⏱️ {mapStats.duration} min</span>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: currentTheme === 'dark' ? '#9ca3af' : '#64748b',
                padding: '8px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          padding: '16px 20px',
          borderBottom: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={startReplay}
            disabled={isReplaying || !courseData.gpsPoints.length}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: isReplaying ? '#6b7280' : '#3b82f6',
              color: 'white',
              cursor: isReplaying ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {isReplaying ? 'Redare...' : 'Redă Traseu'}
          </button>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            disabled={isReplaying}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
              background: currentTheme === 'dark' ? '#374151' : '#ffffff',
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              fontSize: '12px'
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
          </select>

          <button
            onClick={exportGPX}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
              background: 'transparent',
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            📥 Export GPX
          </button>

          {isReplaying && (
            <div style={{
              flex: 1,
              maxWidth: '200px',
              background: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              height: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${replayProgress}%`,
                height: '100%',
                background: '#3b82f6',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative' }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: currentTheme === 'dark' ? '#9ca3af' : '#64748b'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(59, 130, 246, 0.2)',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                Încărcare hartă...
              </div>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#ef4444'
            }}>
              {error}
            </div>
          ) : (
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '0 0 16px 16px'
              }}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default RouteMapModal;