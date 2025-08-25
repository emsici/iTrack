import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { courseAnalyticsService, CourseStatistics, GPSPoint } from '../services/courseAnalytics';
import RouteMapModal from './RouteMapModal';

interface CourseDetailsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  isOpen,
  onClose,
  currentTheme
}) => {
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [pausePoints, setPausePoints] = useState<GPSPoint[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen && showRouteMap && !courseStats) {
      loadCourseGPSData();
    }
  }, [isOpen, showRouteMap, course.id, course.status]); // CRITICAL FIX: Adaugă course.status pentru refresh la schimbarea status-ului
  
  const loadCourseGPSData = async () => {
    setLoading(true);
    try {
      const stats = await courseAnalyticsService.getCourseAnalytics(course.id);
      setCourseStats(stats);
      
      if (stats && stats.gpsPoints) {
        // Identifică punctele de pauză (viteza foarte mică și mai multe puncte consecutive)
        const pauses: GPSPoint[] = [];
        let slowPoints: GPSPoint[] = [];
        
        stats.gpsPoints.forEach((point) => {
          // Adaugă pauze manuale
          if (point.isManualPause) {
            pauses.push(point);
          }
          
          // Detectează opriri automate (viteză sub 2 km/h)
          if (point.speed < 2) { // Sub 2 km/h
            slowPoints.push(point);
          } else {
            // Dacă am avut mai mult de 3 puncte lente consecutive, e o oprire automată
            if (slowPoints.length >= 3) {
              pauses.push(slowPoints[Math.floor(slowPoints.length / 2)]); // Punctul din mijloc
            }
            slowPoints = [];
          }
        });
        
        // Verifică și ultimele puncte
        if (slowPoints.length >= 3) {
          pauses.push(slowPoints[Math.floor(slowPoints.length / 2)]);
        }
        
        setPausePoints(pauses);
      }
    } catch (error) {
      console.error('Eroare încărcare date GPS:', error);
    } finally {
      setLoading(false);
    }
  };

  // Încarcă statisticile imediat când se deschide modalul pentru a fi disponibile
  useEffect(() => {
    if (isOpen) {
      loadCourseGPSData();
    }
  }, [isOpen, course.id, course.status]); // CRITICAL FIX: Adaugă course.status pentru refresh la schimbarea status-ului
  
  if (!isOpen) return null;

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#3b82f6'; // Disponibilă - albastru
      case 2: return '#10b981'; // În progres - verde
      case 3: return '#f59e0b'; // Pauzată - galben
      case 4: return '#ef4444'; // Finalizată - roșu
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Disponibilă';
      case 2: return 'În progres';
      case 3: return 'Pauzată';
      case 4: return 'Finalizată';
      default: return 'Necunoscut';
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 999999,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '500px',
          maxHeight: 'calc(100vh - 40px)',
          background: currentTheme === 'dark' 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
            : currentTheme === 'light'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)'
              : currentTheme === 'driver'
                ? 'linear-gradient(135deg, rgba(28, 25, 23, 0.98) 0%, rgba(41, 37, 36, 0.98) 100%)'
                : currentTheme === 'business'
                  ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)'
                  : currentTheme === 'nature'
                    ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.98) 0%, rgba(6, 95, 70, 0.98) 100%)'
                    : currentTheme === 'night'
                      ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.98) 0%, rgba(49, 46, 129, 0.98) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          padding: '20px 20px',
          boxShadow: currentTheme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.5)'
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflowY: 'auto',
          transform: 'translateZ(0)'
        }}>
        {/* Close Button - EXACT CA ABOUTMODAL */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: currentTheme === 'dark' 
              ? '#94a3b8' 
              : currentTheme === 'light' || currentTheme === 'business'
                ? '#000000'
                : currentTheme === 'driver'
                  ? '#fed7aa'
                  : currentTheme === 'nature'
                    ? '#a7f3d0'
                    : currentTheme === 'night'
                      ? '#c7d2fe'
                      : '#000000',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = currentTheme === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Header - EXACT CA ABOUTMODAL */}
        <div style={{
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)'
          }}>
            <i className="fas fa-truck"></i>
          </div>
          <h2 style={{
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            Detalii Transport
          </h2>
          <p style={{
            color: currentTheme === 'dark' 
              ? '#94a3b8' 
              : currentTheme === 'light' || currentTheme === 'business'
                ? '#000000'
                : currentTheme === 'driver'
                  ? '#fed7aa'
                  : currentTheme === 'nature'
                    ? '#a7f3d0'
                    : currentTheme === 'night'
                      ? '#c7d2fe'
                      : '#000000',
            fontSize: '14px',
            margin: 0
          }}>
            Informații complete despre cursă și rută
          </p>
        </div>

        {/* Status și UIT */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            backgroundColor: getStatusColor(course.status),
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {getStatusText(course.status)}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000'
          }}>
            UIT: {course.uit}
          </div>
        </div>

        {/* SECȚIUNI COMPLETE CU TOATE DETALIILE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* SECȚIUNEA 1: Identificare Transport */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-id-card" style={{ color: '#0ea5e9' }}></i>
              Identificare Transport
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
              <div><strong>ikRoTrans:</strong> {course.ikRoTrans || 'N/A'}</div>
              <div><strong>UIT:</strong> {course.UIT || course.uit || 'N/A'}</div>
              <div><strong>Număr Vehicul:</strong> {course.nrVehicul || 'N/A'}</div>
              <div><strong>Data Transport:</strong> {course.dataTransport ? new Date(course.dataTransport).toLocaleDateString('ro-RO') : 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 2: Declarant */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-user-tie" style={{ color: '#0ea5e9' }}></i>
              Informații Declarant
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Cod Declarant:</strong> {course.codDeclarant || 'N/A'}</div>
              <div><strong>Denumire Declarant:</strong> {course.denumireDeclarant || 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 3: Locație Plecare */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }}></i>
              Locația de Plecare
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Vamă:</strong> {course.Vama || course.vama || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Birou Vamal:</strong> {course.BirouVamal || course.birouVamal || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Județ:</strong> {course.Judet || course.judet || 'N/A'}</div>
              <div><strong>Denumire Loc Start:</strong> {course.denumireLocStart || 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 4: Locație Sosire */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-flag-checkered" style={{ color: '#ef4444' }}></i>
              Locația de Sosire
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Vamă Stop:</strong> {course.VamaStop || course.vamaStop || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Birou Vamal Stop:</strong> {course.BirouVamalStop || course.birouVamalStop || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Județ Stop:</strong> {course.JudetStop || course.judetStop || 'N/A'}</div>
              <div><strong>Denumire Loc Stop:</strong> {course.denumireLocStop || 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 5: Statistici Cursă GPS */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-chart-line" style={{ color: '#10b981' }}></i>
              Statistici Cursă
            </h3>
            
            {courseStats && courseStats.gpsPoints && courseStats.gpsPoints.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {/* Distanță totală */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '4px'
                  }}>
                    {courseStats.totalDistance.toFixed(1)} km
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Distanță Totală
                  </div>
                </div>

                {/* Timp de conducere */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#3b82f6',
                    marginBottom: '4px'
                  }}>
                    {Math.floor(courseStats.drivingTime / 60)}h {Math.round(courseStats.drivingTime % 60)}m
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Timp Conducere
                  </div>
                </div>

                {/* Viteză maximă */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#ef4444',
                    marginBottom: '4px'
                  }}>
                    {courseStats.maxSpeed} km/h
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Viteză Maximă
                  </div>
                </div>

                {/* Viteză medie */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                    marginBottom: '4px'
                  }}>
                    {courseStats.averageSpeed.toFixed(1)} km/h
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Viteză Medie
                  </div>
                </div>

                {/* Puncte GPS */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                    marginBottom: '4px'
                  }}>
                    {courseStats.gpsPoints.length}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Puncte GPS
                  </div>
                </div>

                {/* Pauze manuale */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#ec4899',
                    marginBottom: '4px'
                  }}>
                    {courseStats.manualPauses || 0}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Pauze Manuale
                  </div>
                </div>

                {/* Opriri auto-detectate */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#22c55e',
                    marginBottom: '4px'
                  }}>
                    {courseStats.autoPauses || 0}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Opriri Auto-Detectate
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: currentTheme === 'dark' ? '#cbd5e0' : '#374151',
                fontSize: '14px'
              }}>
                <i className="fas fa-chart-line" style={{ 
                  fontSize: '24px', 
                  marginBottom: '8px', 
                  opacity: 0.5,
                  color: '#10b981'
                }}></i>
                <div>Nu există date GPS pentru această cursă</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                  Pornește GPS-ul pentru a vedea statisticile
                </div>
              </div>
            )}
          </div>

          {/* SECȚIUNEA 6: Harta cu Opriri GPS */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-route" style={{ color: '#f59e0b' }}></i>
              Traseu și Opriri
            </h3>
            <button
              onClick={() => setShowRouteMap(!showRouteMap)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <i className={`fas fa-${showRouteMap ? 'eye-slash' : 'map-marked-alt'}`}></i>
              {showRouteMap ? 'Ascunde Harta' : `Afișează Traseu cu Opriri ${pausePoints.length > 0 ? `(${pausePoints.length})` : ''}`}
            </button>
            
            {showRouteMap && (
              <div style={{
                marginTop: '16px',
                background: currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {loading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '40px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px' }}></i>
                    <span>Încărcare date GPS...</span>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <i className="fas fa-info-circle" style={{ color: '#3b82f6' }}></i>
                      <span style={{
                        fontSize: '14px',
                        color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                      }}>
                        Traseu: {pausePoints.length} opriri detectate
                      </span>
                    </div>

                    {courseStats && courseStats.gpsPoints && courseStats.gpsPoints.length > 0 ? (
                      <>
                        {/* Butoane pentru hărți */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginBottom: '16px',
                          flexWrap: 'wrap'
                        }}>
                          <button
                            onClick={() => setShowFullScreenMap(true)}
                            style={{
                              flex: '1',
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className="fas fa-external-link-alt"></i>
                            Hartă Leaflet Interactivă
                          </button>
                        </div>

                        {/* Harta dinamică cu opriri reale */}
                        <div style={{
                          position: 'relative',
                          height: '300px',
                          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid #d1d5db'
                        }}>
                          {/* Linia traseului - calculată din coordonatele GPS */}
                          <svg style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1
                          }}>
                            <path
                              d={generatePathFromGPSPoints(courseStats.gpsPoints)}
                              stroke="#ef4444"
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          {/* Punctul de start */}
                          {courseStats.gpsPoints.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              zIndex: 2
                            }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                background: '#10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                              }}>
                                S
                              </div>
                            </div>
                          )}

                          {/* Punctele de oprire reale - diferite culori pentru manual vs auto */}
                          {pausePoints.map((pause, index) => {
                            const position = calculatePointPosition(pause, courseStats.gpsPoints);
                            const isManual = pause.isManualPause;
                            return (
                              <div
                                key={index}
                                style={{
                                  position: 'absolute',
                                  top: `${position.y}%`,
                                  left: `${position.x}%`,
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 3
                                }}
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  background: isManual ? '#ec4899' : '#22c55e', // Roz pentru manual, verde pentru auto
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  border: '3px solid white',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}>
                                  {isManual ? 'P' : index + 1}
                                </div>
                              </div>
                            );
                          })}

                          {/* Punctul final */}
                          {courseStats.gpsPoints.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              bottom: '10px',
                              right: '10px',
                              zIndex: 2
                            }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                background: '#ef4444',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                              }}>
                                F
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Statistici GPS */}
                        <div style={{
                          marginTop: '16px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          fontSize: '12px'
                        }}>
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#10b981' }}>Puncte GPS</div>
                            <div style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>
                              {courseStats.gpsPoints.length}
                            </div>
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>Opriri</div>
                            <div style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>
                              {pausePoints.length}
                            </div>
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#ef4444' }}>Distanță</div>
                            <div style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>
                              {courseStats.totalDistance.toFixed(1)} km
                            </div>
                          </div>
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>Viteză Max</div>
                            <div style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>
                              {courseStats.maxSpeed} km/h
                            </div>
                          </div>
                        </div>

                        {/* Legenda */}
                        <div style={{
                          marginTop: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div>
                            <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>START</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '50%' }}></div>
                            <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>PAUZĂ MANUALĂ</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%' }}></div>
                            <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>OPRIRE AUTO</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></div>
                            <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>FINAL</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '16px', height: '2px', background: '#ef4444' }}></div>
                            <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>TRASEU</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                      }}>
                        <i className="fas fa-map-marked-alt" style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}></i>
                        <div>Nu există date GPS pentru această cursă</div>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                          Pornește GPS-ul pentru a înregistra traseul
                        </div>
                      </div>
                    )}

                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: currentTheme === 'dark' ? '#93c5fd' : '#1e40af'
                    }}>
                      <strong>Explicație:</strong> Harta arată traseul când cursa era pornită. Opriri detectate = locuri unde te-ai oprit în timpul transportului (viteza sub 2 km/h)
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Map Modal Full Screen */}
      {showFullScreenMap && courseStats && (
        <RouteMapModal
          isOpen={showFullScreenMap}
          onClose={() => setShowFullScreenMap(false)}
          courseData={courseStats}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
};

// Funcții helper pentru generarea traseului din coordonate GPS
const generatePathFromGPSPoints = (gpsPoints: GPSPoint[]): string => {
  if (gpsPoints.length < 2) return '';
  
  // Calculează bounding box pentru normalizare
  const lats = gpsPoints.map(p => p.lat);
  const lngs = gpsPoints.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Evită diviziunea cu zero
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lngRange = Math.max(maxLng - minLng, 0.001);
  
  // Convertește coordonatele GPS în poziții pe hartă (cu padding de 5%)
  const points = gpsPoints.map(point => {
    const x = 5 + ((point.lng - minLng) / lngRange) * 90; // 5% padding pe fiecare parte
    const y = 5 + ((maxLat - point.lat) / latRange) * 90; // Y inversat pentru SVG
    return { x: x * 4, y: y * 3 }; // Scale pentru dimensiunea hărții (400x300)
  });
  
  // Generează path SVG
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    if (i === 1) {
      path += ` L ${points[i].x} ${points[i].y}`;
    } else {
      // Folosește curbe smooth pentru un traseu mai natural
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const cp1x = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5;
      const cp1y = prevPoint.y;
      const cp2x = currentPoint.x - (currentPoint.x - prevPoint.x) * 0.5;
      const cp2y = currentPoint.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currentPoint.x} ${currentPoint.y}`;
    }
  }
  
  return path;
};

const calculatePointPosition = (targetPoint: GPSPoint, allPoints: GPSPoint[]) => {
  if (allPoints.length === 0) return { x: 50, y: 50 };
  
  // Calculează bounding box
  const lats = allPoints.map(p => p.lat);
  const lngs = allPoints.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lngRange = Math.max(maxLng - minLng, 0.001);
  
  // Convertește coordonata targetPoint în poziție pe hartă
  const x = 5 + ((targetPoint.lng - minLng) / lngRange) * 90;
  const y = 5 + ((maxLat - targetPoint.lat) / latRange) * 90;
  
  return { x, y };
};

export default CourseDetailsModal;
