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
      console.error('Eroare la încărcarea statisticilor cursei:', error);
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
      case 'resume':
        newStatus = 2;
        break;
      case 'finish':
        newStatus = 4;
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
      case 2: // In progress
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
              className="action-btn-compact btn-finish-compact"
              onClick={() => handleAction('finish')}
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
              className="action-btn-compact btn-finish-compact"
              onClick={() => handleAction('finish')}
              disabled={isLoading}
            >
              <i className="fas fa-stop"></i>
              Stop
            </button>
          </>
        );
      case 4: // Completed - NICIUN BUTON, cursă terminată
        return (
          <span className="badge bg-secondary">
            <i className="fas fa-check me-1"></i>
            TERMINAT
          </span>
        );
      
      default:
        return null;
    }
  };



  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#3b82f6'; // Available - Blue
      case 2: return '#10b981'; // In Progress - Green
      case 3: return '#f59e0b'; // Paused - Orange
      case 4: return '#ef4444'; // Stopped - Red
      default: return '#6b7280';
    }
  };



  return (
    <div className={`course-card-compact ${showDetails ? 'expanded' : ''}`}>
      <style>{`
        .course-card-compact {
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(20px);
          border: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(148, 163, 184, 0.2)'};
          border-radius: 12px;
          padding: 16px 20px;
          margin: 0 auto 16px auto;
          overflow: visible;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          position: relative;
          width: 96%;
          max-width: 96%;
          box-sizing: border-box;
          z-index: ${showDetails ? '999' : '1'};
          isolation: isolate;
        }

        .course-card-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .course-card-compact::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: ${getStatusColor(course.status)};
          transition: all 0.3s ease;
        }

        .course-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          width: 100%;
          flex-wrap: nowrap;
        }

        .uit-priority {
          color: ${currentTheme === 'light' 
            ? '#000000'  /* BLACK text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#ffffff'  /* White text for Dark theme only */
          };
          font-size: 1rem;
          font-weight: 600;
          flex: 1;
        }

        .toggle-details-btn {
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(241, 245, 249, 0.9)'};
          border: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(148, 163, 184, 0.25)'};
          color: ${currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'night'
            ? '#ffffff'  /* WHITE text for Dark/Driver/Night themes only */
            : '#000000'  /* BLACK text for Light/Business/Nature themes */
          };
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.85rem;
          margin-bottom: 12px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 2;
        }

        .toggle-details-btn:hover {
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(226, 232, 240, 0.9)'};
          color: ${currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'night'
            ? '#ffffff'  /* WHITE text for Dark/Driver/Night themes only */
            : '#000000'  /* BLACK text for Light/Business/Nature themes */
          };
          transform: scale(1.02);
        }

        /* Fix layering conflicts when multiple courses are expanded */
        .course-card-compact:focus-within {
          z-index: 1001;
        }
        
        /* Ensure expanded cards always stay on top */
        .course-card-compact.expanded {
          z-index: 1002 !important;
        }

        .course-details-enhanced {
          transform-style: preserve-3d;
        }

        .course-preview {
          margin-bottom: 12px;
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(248, 250, 252, 0.8)'};
          border-radius: 8px;
          padding: 12px;
          border: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(203, 213, 225, 0.4)'};
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(203, 213, 225, 0.3)'};
          min-height: 24px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          color: ${currentTheme === 'light' 
            ? '#1e293b'  /* Dark text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#94a3b8'  /* Gray text for Dark theme only */
          };
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 90px;
          flex-shrink: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-value {
          color: ${currentTheme === 'light' 
            ? '#000000'  /* BLACK text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#e2e8f0'  /* Light text for Dark theme only */
          };
          font-size: 0.9rem;
          font-weight: 600;
          text-align: right;
          flex: 1;
          margin-left: 8px;
          word-break: break-word;
          line-height: 1.3;
        }
        
        /* Enhanced visibility for destination (Sosire) */
        .preview-row:nth-child(2) .preview-label {
          color: #10b981;
          font-weight: 700;
        }
        
        .preview-row:nth-child(2) .preview-value {
          color: #34d399;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .course-title-compact {
          color: ${currentTheme === 'light' 
            ? '#000000'  /* BLACK text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#ffffff'  /* White text for Dark theme only */
          };
          font-size: 0.85rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          padding-right: 8px;
        }

        .status-badge-compact {
          background: ${getStatusColor(course.status)};
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.65rem;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: auto;
        }

        .toggle-btn-enhanced {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .toggle-btn-enhanced:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .course-details-enhanced {
          margin-top: 12px;
          background: ${currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(248, 250, 252, 0.95)'};
          border-radius: 12px;
          border: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(203, 213, 225, 0.4)'};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: relative;
          z-index: ${showDetails ? '1000' : '1'};
          box-shadow: ${showDetails ? (currentTheme === 'dark' ? '0 12px 40px rgba(0, 0, 0, 0.8)' : '0 12px 40px rgba(0, 0, 0, 0.2)') : 'none'};
          margin-bottom: 16px;
          isolation: isolate;
          display: block;
          padding: 20px;
        }

        .details-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .detail-section-enhanced {
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'};
          border: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(203, 213, 225, 0.3)'};
          border-radius: 12px;
          padding: 16px;
        }

        .section-title-enhanced {
          color: ${currentTheme === 'light' 
            ? '#000000'  /* BLACK text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#ffffff'  /* White text for Dark theme only */
          };
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-item-enhanced {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(203, 213, 225, 0.2)'};
        }

        .detail-item-enhanced:last-child {
          border-bottom: none;
        }

        .detail-label-enhanced {
          color: ${currentTheme === 'light' 
            ? '#1e293b'  /* Dark text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#94a3b8'  /* Gray text for Dark theme only */
          };
          font-size: 0.8rem;
          font-weight: 500;
        }

        .detail-value-enhanced {
          color: ${currentTheme === 'light' 
            ? '#000000'  /* BLACK text for Light theme */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#e2e8f0'  /* Light text for Dark theme only */
          };
          font-size: 0.85rem;
          font-weight: 500;
          text-align: right;
        }

        .course-actions-enhanced {
          padding: 20px;
          background: rgba(0, 0, 0, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-buttons-enhanced {
          display: flex;
          gap: 12px;
        }

        .action-btn-compact {
          flex: 1;
          padding: 6px 8px;
          border: none;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: white;
          min-height: 32px;
          max-width: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .action-btn-enhanced:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-enhanced:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .btn-start-compact {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-pause-compact {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .btn-resume-compact {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-finish-compact {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .loading-enhanced {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        .spinner-enhanced {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes slideDown {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 500px;
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            max-height: 500px;
            opacity: 1;
          }
          to {
            max-height: 0;
            opacity: 0;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .course-card-enhanced {
            width: calc(100% - 20px);
          }
          
          .details-grid-enhanced {
            grid-template-columns: 1fr;
          }
          
          .action-buttons-enhanced {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="course-header-compact">
        <div className="uit-priority">
          <strong>UIT: {course.uit}</strong>
        </div>
        <span className="status-badge-compact">
          {getStatusText(course.status)}
        </span>
      </div>


      
      <div className="course-preview">
        <div className="preview-row">
          <span className="preview-label">Plecare:</span>
          <span className="preview-value">
            {course.denumireLocStart || course.BirouVamal || course.birouVamal || (course.vama !== 'Local' ? course.vama : course.Vama) || 'Nespecificat'}
          </span>
        </div>
        
        <div className="preview-row">
          <span className="preview-label">Sosire:</span>
          <span className="preview-value">
            {course.denumireLocStop || course.BirouVamalStop || course.birouVamalStop || (course.vamaStop !== 'Local' ? course.vamaStop : course.VamaStop) || 'Nespecificat'}
          </span>
        </div>
        
        <div className="preview-row">
          <span className="preview-label">Județ plecare:</span>
          <span className="preview-value">
            {course.Judet || course.judet || 'N/A'}
          </span>
        </div>
        
        <div className="preview-row">
          <span className="preview-label">Județ sosire:</span>
          <span className="preview-value">
            {course.JudetStop || course.judetStop || 'N/A'}
          </span>
        </div>
        
        <div className="preview-row">
          <span className="preview-label">Declarant:</span>
          <span className="preview-value">{course.denumireDeclarant || 'N/A'}</span>
        </div>
        
        <div className="preview-row">
          <span className="preview-label">Data Transport:</span>
          <span className="preview-value">
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
      
      <button 
        className="toggle-details-btn"
        onClick={() => {
          const newState = !showDetails;
          console.log(`🔍 Toggle details for course ${course.id}: ${newState ? 'EXPAND' : 'COLLAPSE'}`);
          setShowDetails(newState);
          console.log(`✅ Course ${course.id} state updated to: ${newState}`);
        }}
      >
        <i className={`fas ${showDetails ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        {showDetails ? 'Ascunde detalii' : 'Detalii complete'}
      </button>

      {showDetails && (
        <div className="course-details-enhanced">
          <div className="details-grid-enhanced">
            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-info-circle"></i>
                Informații Complete Transport
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">ID Transport (ikRoTrans):</span>
                <span className="detail-value-enhanced">{course.ikRoTrans || 'N/A'}</span>
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
                <span className="detail-label-enhanced">Vama Plecare:</span>
                <span className="detail-value-enhanced">{course.vama || course.Vama || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Birou Vamal Plecare:</span>
                <span className="detail-value-enhanced">{course.birouVamal || course.BirouVamal || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Județ Plecare:</span>
                <span className="detail-value-enhanced">{course.judet || course.Judet || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Denumire Loc Start:</span>
                <span className="detail-value-enhanced">{course.denumireLocStart || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Vama Stop:</span>
                <span className="detail-value-enhanced">{course.vamaStop || course.VamaStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Birou Vamal Stop:</span>
                <span className="detail-value-enhanced">{course.birouVamalStop || course.BirouVamalStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Județ Stop:</span>
                <span className="detail-value-enhanced">{course.judetStop || course.JudetStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Denumire Loc Stop:</span>
                <span className="detail-value-enhanced">{course.denumireLocStop || 'N/A'}</span>
              </div>

            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-map-marker-alt"></i>
                Destinație și Transport
              </h6>
              
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Data Transport (Sistem):</span>
                <span className="detail-value-enhanced" style={{
                  color: currentTheme === 'dark' ? '#9ca3af' : '#64748b',
                  fontSize: '12px'
                }}>
                  <i className="fas fa-database" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                  {course.dataTransport ? 
                    new Date(course.dataTransport).toLocaleDateString('ro-RO', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    }) : 'N/A'
                  }
                </span>
              </div>
              
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">UIT:</span>
                <span className="detail-value-enhanced">{course.uit}</span>
              </div>
            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-tachometer-alt"></i>
                Statistici GPS Live
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