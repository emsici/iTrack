import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { courseAnalyticsService, CourseStatistics } from '../services/courseAnalytics';
import RouteMapModal from './RouteMapModal';
import CourseDetailsModal from './CourseDetailsModal';

interface CourseDetailCardProps {
  course: Course;
  onStatusUpdate: (courseId: string, courseUit: string, newStatus: number, action?: string) => void;
  onDetailsClick?: (course: Course) => void;
  isLoading: boolean;
  currentTheme?: string;
}

const CourseDetailCard: React.FC<CourseDetailCardProps> = ({ 
  course, 
  onStatusUpdate,
  onDetailsClick,
  isLoading,
  currentTheme = 'dark'
}) => {
  // Clean state management
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Disponibilă';
      case 2: return 'În progres';
      case 3: return 'Pauzată';
      case 4: return 'Finalizată';
      default: return 'Necunoscut';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#10b981'; // Available - verde
      case 1: return '#3b82f6'; // Active - albastru  
      case 2: return '#f59e0b'; // Pause - galben
      case 3: return '#ef4444'; // Stopped - roșu
      default: return '#6b7280'; // Unknown - gri
    }
  };

  const handleAction = (action: string) => {
    if (isLoading) {
      return; // Prevent double submission
    }
    
    let newStatus: number;
    
    switch (action) {
      case 'start':
        newStatus = 1; // Available -> Active
        break;
      case 'pause':
        newStatus = 2; // Active -> Pause
        break;
      case 'resume':
        newStatus = 1; // Pause -> Active  
        break;
      case 'finish':
        newStatus = 3; // Any -> Stopped
        break;
      default:
        return;
    }
    
    onStatusUpdate(course.id, course.uit, newStatus, action);
  };

  const renderActionButtons = () => {
    switch (course.status) {
      case 0: // Available
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

      case 1: // Active
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
              Finalizează
            </button>
          </>
        );

      case 2: // Paused
        return (
          <>
            <button
              className="action-btn-compact btn-resume-compact"
              onClick={() => handleAction('resume')}
              disabled={isLoading}
            >
              <i className="fas fa-play"></i>
              Reia
            </button>
            <button
              className="action-btn-compact btn-finish-compact"
              onClick={() => handleAction('finish')}
              disabled={isLoading}
            >
              <i className="fas fa-stop"></i>
              Finalizează
            </button>
          </>
        );

      case 3: // Finished
      default:
        return (
          <div style={{
            color: currentTheme === 'light' ? '#6b7280' : '#9ca3af',
            fontSize: '12px',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            Cursă finalizată
          </div>
        );
    }
  };

  return (
    <div className="course-card-enhanced">
      <style>{`
        .course-card-enhanced {
          background: ${
            currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.85)' :
            currentTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' :
            currentTheme === 'business' ? 'rgba(248, 250, 252, 0.95)' :
            currentTheme === 'driver' ? 'rgba(28, 25, 23, 0.85)' :
            currentTheme === 'nature' ? 'rgba(6, 78, 59, 0.85)' :
            currentTheme === 'night' ? 'rgba(30, 27, 75, 0.85)' :
            'rgba(255, 255, 255, 0.98)'
          };
          border: ${
            currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : 
            currentTheme === 'light' ? '1px solid rgba(100, 116, 139, 0.3)' :
            currentTheme === 'business' ? '1px solid rgba(59, 130, 246, 0.2)' :
            currentTheme === 'driver' ? '1px solid rgba(249, 115, 22, 0.3)' :
            currentTheme === 'nature' ? '1px solid rgba(16, 185, 129, 0.3)' :
            currentTheme === 'night' ? '1px solid rgba(139, 92, 246, 0.3)' :
            '1px solid rgba(148, 163, 184, 0.2)'
          };
          border-radius: 12px;
          padding: 16px 20px;
          margin: 0 auto 16px auto;
          overflow: visible;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: ${currentTheme === 'light' 
            ? '0 4px 16px rgba(0, 0, 0, 0.1)'
            : '0 4px 16px rgba(0, 0, 0, 0.2)'
          };
          position: relative;
          width: 96%;
          max-width: 96%;
          box-sizing: border-box;
          isolation: isolate;
        }

        .course-card-enhanced:hover {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          transition: box-shadow 0.1s ease;
        }

        .course-card-compact::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: ${getStatusColor(course.status)};
          transition: none;
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
          color: ${
            currentTheme === 'dark' ? '#ffffff' :
            currentTheme === 'light' ? '#000000' :
            currentTheme === 'business' ? '#1e293b' :
            currentTheme === 'driver' ? '#ffffff' :
            currentTheme === 'nature' ? '#ffffff' :
            currentTheme === 'night' ? '#ffffff' :
            '#000000'
          };
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          flex: 1;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
        }

        .status-badge-compact {
          background: ${getStatusColor(course.status)};
          color: ${
            currentTheme === 'dark' ? '#ffffff' :
            currentTheme === 'light' ? '#000000' :
            currentTheme === 'business' ? '#1e293b' :
            currentTheme === 'driver' ? '#ffffff' :
            currentTheme === 'nature' ? '#ffffff' :
            currentTheme === 'night' ? '#ffffff' :
            '#000000'
          };
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .course-preview {
          margin-bottom: 16px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: ${
            currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' :
            currentTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' :
            currentTheme === 'business' ? '1px solid rgba(59, 130, 246, 0.1)' :
            currentTheme === 'driver' ? '1px solid rgba(249, 115, 22, 0.1)' :
            currentTheme === 'nature' ? '1px solid rgba(16, 185, 129, 0.1)' :
            currentTheme === 'night' ? '1px solid rgba(139, 92, 246, 0.1)' :
            '1px solid rgba(148, 163, 184, 0.1)'
          };
          gap: 12px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          color: ${currentTheme === 'light' 
            ? '#000000'
            : currentTheme === 'business'
              ? '#000000'
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'
                : '#94a3b8'
          };
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 100px;
          flex-shrink: 0;
        }

        .preview-value {
          color: ${
            currentTheme === 'dark' ? '#e2e8f0' :
            currentTheme === 'light' ? '#000000' :
            currentTheme === 'business' ? '#1e293b' :
            currentTheme === 'driver' ? '#ffffff' :
            currentTheme === 'nature' ? '#ffffff' :
            currentTheme === 'night' ? '#ffffff' :
            '#1e293b'
          };
          font-size: 0.85rem;
          font-weight: 500;
          text-align: right;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.3;
        }

        .details-button {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          fontSize: 14px;
          fontWeight: 600;
          cursor: pointer;
          display: flex;
          alignItems: center;
          justifyContent: center;
          gap: 8px;
          transition: all 0.2s ease;
          margin-bottom: 16px;
        }

        .details-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .course-actions-enhanced {
          padding: 16px 0 0 0;
          border-top: ${
            currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' :
            currentTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' :
            '1px solid rgba(255, 255, 255, 0.1)'
          };
        }

        .action-buttons-enhanced {
          display: flex;
          gap: 12px;
        }

        .action-btn-compact {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: white;
          min-height: 40px;
        }

        .btn-start-compact {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-pause-compact {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
          padding: 10px 18px;
          font-size: 0.9rem;
          font-weight: 700;
          transform: scale(1.05);
        }

        .btn-resume-compact {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-finish-compact {
          background: linear-gradient(135deg, #ef4444, #dc2626);
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .course-card-enhanced {
            width: calc(100% - 20px);
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
      
      {/* BUTON FRUMOS PENTRU MODAL */}
      <button 
        className="details-button"
        onClick={() => {
          if (onDetailsClick) {
            onDetailsClick(course);
          } else {
            setShowDetailsModal(true);
          }
        }}
      >
        <i className="fas fa-info-circle"></i>
        📋 Detalii Complete
      </button>

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

      {/* MODAL FRUMOS PENTRU DETALII */}
      <CourseDetailsModal
        course={course}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        currentTheme={currentTheme}
      />

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