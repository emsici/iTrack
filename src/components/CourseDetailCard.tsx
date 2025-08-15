import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { courseAnalyticsService, CourseStatistics } from '../services/courseAnalytics';
import RouteMapModal from './RouteMapModal';

interface CourseDetailCardProps {
  course: Course;
  onStatusUpdate: (courseId: string, newStatus: number) => void;
  isLoading: boolean;
  currentTheme?: string;
}

const CourseDetailCard: React.FC<CourseDetailCardProps> = ({ 
  course, 
  onStatusUpdate,
  isLoading,
  currentTheme = 'dark'
}) => {
  // Each course has independent state using course.id as key
  const [showDetails, setShowDetails] = useState(false);
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(false);

  // Load course statistics when component mounts or course changes
  useEffect(() => {
    loadCourseStatistics();
  }, [course.id, course.status]);

  const loadCourseStatistics = async () => {
    try {
      const stats = await courseAnalyticsService.getCourseAnalytics(course.id);
      setCourseStats(stats);
    } catch (error) {
      console.error('Error loading course statistics:', error);
    }
  };

  // Independent expand/collapse for each course - each component manages its own state

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Disponibilă';
      case 2: return 'În progres';
      case 3: return 'Pauzată';
      case 4: return 'Finalizată';
      default: return 'Necunoscut';
    }
  };

  // Removed getStatusColor - using CSS classes instead

  const handleAction = (action: string) => {
    let newStatus: number;
    
    switch (action) {
      case 'start':
        newStatus = 2;
        break;
      case 'pause':
        newStatus = 3;
        break;
      case 'stop':
        newStatus = 4;
        break;
      case 'resume':
        newStatus = 2;
        break;
      default:
        return;
    }
    
    onStatusUpdate(course.id, newStatus);
  };

  const renderActionButtons = () => {
    switch (course.status) {
      case 1: // Available
        return (
          <button 
            className="action-btn-compact btn-start-compact"
            onClick={() => handleAction('start')}
            disabled={isLoading}
          >
            <i className="fas fa-play"></i>
            Start
          </button>
        );
      
      case 2: // In Progress
        return (
          <>
            <button 
              className="action-btn-compact btn-pause-compact"
              onClick={() => handleAction('pause')}
              disabled={isLoading}
            >
              <i className="fas fa-pause"></i>
              Pauză
            </button>
            <button 
              className="action-btn-compact btn-stop-compact"
              onClick={() => handleAction('stop')}
              disabled={isLoading}
            >
              <i className="fas fa-stop"></i>
              Stop
            </button>
          </>
        );
      
      case 3: // Paused
        return (
          <>
            <button 
              className="action-btn-compact btn-resume-compact"
              onClick={() => handleAction('resume')}
              disabled={isLoading}
            >
              <i className="fas fa-play"></i>
              Resume
            </button>
            <button 
              className="action-btn-compact btn-stop-compact"
              onClick={() => handleAction('stop')}
              disabled={isLoading}
            >
              <i className="fas fa-stop"></i>
              Stop
            </button>
          </>
        );
      
      case 4: // Completed
        return (
          <span className="status-completed-compact">
            <i className="fas fa-check-circle"></i>
            Finalizată
          </span>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="course-card-enhanced" style={{ marginBottom: '16px' }}>
      {/* Header with UIT and Status */}
      <div className="course-header-modern">
        <div className="uit-display">
          UIT: {course.uit}
        </div>
        <div className={`status-pill status-${course.status}`}>
          {getStatusText(course.status)}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="course-info-card">
        <div className="info-row">
          <span className="info-label">PLECARE:</span>
          <span className="info-value">{course.vama || 'ADR'}</span>
        </div>
        <div className="info-row sosire">
          <span className="info-label">SOSIRE:</span>
          <span className="info-value">{course.vamaStop || 'ADR'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">JUDEȚ PLECARE:</span>
          <span className="info-value">{course.Judet || course.judet || 'TM'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">JUDEȚ SOSIRE:</span>
          <span className="info-value">HD</span>
        </div>
        <div className="info-row declarant">
          <span className="info-label">DECLARANT:</span>
          <span className="info-value">{course.denumireDeclarant || 'REELE ELECTRICE ROMANIA S.A.'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="course-actions-modern">
        <button 
          className="details-btn-modern"
          onClick={() => setShowDetails(!showDetails)}
        >
          <i className={`fas ${showDetails ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
          Detalii complete
        </button>
        
        <div className="start-button-container">
          {renderActionButtons()}
        </div>
      </div>

      {showDetails && (
        <div className="course-details-enhanced">
          <div className="details-grid-enhanced">
            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-info-circle"></i>
                Informații Transport
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">ID Transport:</span>
                <span className="detail-value-enhanced">{course.ikRoTrans || course.id}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Cod Declarant:</span>
                <span className="detail-value-enhanced">{course.codDeclarant || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Denumire Declarant:</span>
                <span className="detail-value-enhanced">{course.denumireDeclarant || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Nr. Vehicul:</span>
                <span className="detail-value-enhanced">{course.nrVehicul || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Data Transport:</span>
                <span className="detail-value-enhanced">
                  {course.dataTransport ? 
                    new Date(course.dataTransport).toLocaleDateString('ro-RO', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    }) : 'N/A'
                  }
                </span>
              </div>
            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-map-marker-alt"></i>
                Plecare
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Vamă:</span>
                <span className="detail-value-enhanced">{course.vama || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Birou Vamal:</span>
                <span className="detail-value-enhanced">{course.BirouVamal || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Județ:</span>
                <span className="detail-value-enhanced">{course.Judet || course.judet || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Loc Start:</span>
                <span className="detail-value-enhanced">{course.denumireLocStart || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-tachometer-alt"></i>
                Statistici GPS - UIT {course.uit}
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Distanță Parcursă:</span>
                <span className="detail-value-enhanced" style={{
                  color: '#3b82f6',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-route" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {courseStats ? `${courseStats.totalDistance.toFixed(2)} km` : '0.0 km'}
                </span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Viteză Curentă:</span>
                <span className="detail-value-enhanced" style={{
                  color: course.status === 2 ? '#10b981' : '#6b7280',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-tachometer-alt" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {course.status === 2 && courseStats && courseStats.gpsPoints.length > 0
                    ? `${courseStats.gpsPoints[courseStats.gpsPoints.length - 1].speed.toFixed(0)} km/h`
                    : '0 km/h (Oprit)'}
                </span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Viteză Maximă:</span>
                <span className="detail-value-enhanced" style={{
                  color: '#f59e0b',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-gauge-high" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {courseStats ? `${courseStats.maxSpeed.toFixed(0)} km/h` : '0 km/h'}
                </span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Viteză Medie:</span>
                <span className="detail-value-enhanced" style={{
                  color: '#06b6d4',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-chart-line" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {courseStats ? `${courseStats.averageSpeed.toFixed(1)} km/h` : '0.0 km/h'}
                </span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Timp în Mișcare:</span>
                <span className="detail-value-enhanced" style={{
                  color: '#8b5cf6',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-clock" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {courseStats ? `${courseStats.drivingTime} min` : '0 min'}
                </span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Coordonate GPS Colectate:</span>
                <span className="detail-value-enhanced" style={{
                  color: '#10b981',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-map-pin" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {courseStats ? (
                    <>
                      {courseStats.gpsPoints.length} coordonate
                      {courseStats.isActive && courseStats.gpsPoints.length > 0 && (
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#22c55e',
                          marginLeft: '8px',
                          display: 'inline-block'
                        }}>
                          • ACTIV (la fiecare 5 sec)
                        </span>
                      )}
                    </>
                  ) : '0 coordonate'}
                </span>
              </div>

              {/* Explicație rapidă pentru utilizatori */}
              {courseStats && courseStats.gpsPoints.length > 0 && (
                <div style={{
                  background: currentTheme === 'dark' 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'rgba(16, 185, 129, 0.03)',
                  border: currentTheme === 'dark' 
                    ? '1px solid rgba(16, 185, 129, 0.2)' 
                    : '1px solid rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginTop: '8px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme === 'dark' ? '#10b981' : '#059669',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className="fas fa-info-circle" style={{ fontSize: '10px' }}></i>
                    Fiecare coordonată = locația camionului la un moment dat (lat, lng, viteză, timp)
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: currentTheme === 'dark' ? '#6ee7b7' : '#047857',
                    marginTop: '2px'
                  }}>
                    {courseStats.isActive 
                      ? 'GPS activ: Se salvează automat o coordonată la fiecare 5 secunde'
                      : `Cursă finalizată: ${courseStats.gpsPoints.length} coordonate colectate în total`
                    }
                  </div>
                </div>
              )}

              {courseStats && courseStats.gpsPoints.length === 0 && (
                <div style={{
                  background: currentTheme === 'dark' 
                    ? 'rgba(251, 146, 60, 0.05)' 
                    : 'rgba(251, 146, 60, 0.03)',
                  border: currentTheme === 'dark' 
                    ? '1px solid rgba(251, 146, 60, 0.2)' 
                    : '1px solid rgba(251, 146, 60, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginTop: '8px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: currentTheme === 'dark' ? '#fb923c' : '#ea580c',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '10px' }}></i>
                    Nicio coordonată GPS colectată încă
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: currentTheme === 'dark' ? '#fdba74' : '#c2410c',
                    marginTop: '2px'
                  }}>
                    Pentru traseu pe hartă sunt necesare minimum 2 coordonate GPS
                  </div>
                </div>
              )}

              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Status GPS:</span>
                <span className="detail-value-enhanced" style={{
                  color: course.status === 2 ? '#22c55e' : '#ef4444',
                  fontWeight: '700'
                }}>
                  <i className={`fas ${course.status === 2 ? 'fa-satellite-dish' : 'fa-pause-circle'}`} style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  {course.status === 2 ? 'ACTIV - Transmite coordonate' : 'OPRIT - Nu transmite'}
                </span>
              </div>

              {/* Timp Total Cursă */}
              {courseStats && courseStats.startTime && (
                <div className="detail-item-enhanced">
                  <span className="detail-label-enhanced">Timp Total Cursă:</span>
                  <span className="detail-value-enhanced" style={{
                    color: '#e11d48',
                    fontWeight: '700'
                  }}>
                    <i className="fas fa-hourglass-half" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                    {(() => {
                      const start = new Date(courseStats.startTime);
                      const end = courseStats.endTime ? new Date(courseStats.endTime) : new Date();
                      const totalMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
                    })()}
                  </span>
                </div>
              )}
              
              {/* Route Map Button */}
              <div className="detail-item-enhanced" style={{
                borderTop: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                paddingTop: '12px',
                marginTop: '12px'
              }}>
                <button
                  onClick={() => setShowRouteMap(true)}
                  disabled={!courseStats || courseStats.gpsPoints.length < 2}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (!courseStats || courseStats.gpsPoints.length < 2)
                      ? '#6b7280'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!courseStats || courseStats.gpsPoints.length < 2) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    opacity: (!courseStats || courseStats.gpsPoints.length < 2) ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (courseStats && courseStats.gpsPoints.length >= 2) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (courseStats && courseStats.gpsPoints.length >= 2) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <i className="fas fa-map-marked-alt"></i>
                  {(!courseStats || courseStats.gpsPoints.length < 2)
                    ? 'Traseu Indisponibil (Min. 2 coordonate)'
                    : `Vezi Traseu pe Hartă (${courseStats.gpsPoints.length} coordonate)`}
                </button>
              </div>
            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-flag-checkered"></i>
                Destinație
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Vamă Stop:</span>
                <span className="detail-value-enhanced">{course.vamaStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Birou Vamal Stop:</span>
                <span className="detail-value-enhanced">{course.BirouVamalStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Județ Stop:</span>
                <span className="detail-value-enhanced">{course.JudetStop || course.judetStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Loc Stop:</span>
                <span className="detail-value-enhanced">{course.denumireLocStop || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="course-actions-enhanced">
        {isLoading ? (
          <div className="loading-enhanced">
            <div className="spinner-enhanced"></div>
            Se încarcă...
          </div>
        ) : (
          <div className="action-buttons-enhanced">
            {renderActionButtons()}
          </div>
        )}
      </div>

      {/* Route Map Modal */}
      {showRouteMap && courseStats && (
        <RouteMapModal
          isOpen={showRouteMap}
          onClose={() => setShowRouteMap(false)}
          courseData={courseStats}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
};

export default CourseDetailCard;