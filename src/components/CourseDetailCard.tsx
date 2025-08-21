import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { courseAnalyticsService, CourseStatistics } from '../services/courseAnalytics';
import RouteMapModal from './RouteMapModal';
import CourseDetailsModal from './CourseDetailsModal';

interface CourseDetailCardProps {
  course: Course;
  onStatusUpdate: (courseId: string, courseUit: string, newStatus: number, action?: string) => void;
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
    // CRITICAL FIX: Prevent double submission immediately
    if (isLoading) {
      console.log(`🚫 DOUBLE CLICK PREVENTION: Action ${action} blocked - update in progress for course ${course.id}`);
      return;
    }
    
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
    
    console.log(`🎯 SINGLE ACTION: ${action} triggered for course ${course.id} → status ${newStatus}`);
    onStatusUpdate(course.id, course.uit, newStatus, action);
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
    <div className="course-card-compact">
      <style>{`
        .course-card-compact {
          background: ${
            currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 
            currentTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' :  /* CONTRAST OK - alb pentru light */
            currentTheme === 'business' ? 'rgba(248, 250, 252, 0.95)' :
            currentTheme === 'driver' ? 'rgba(28, 25, 23, 0.85)' :
            currentTheme === 'nature' ? 'rgba(6, 78, 59, 0.85)' :
            currentTheme === 'night' ? 'rgba(30, 27, 75, 0.85)' :
            'rgba(255, 255, 255, 0.98)'
          };
          /* ELIMINAT backdrop-filter pentru ZERO lag la scroll - păstrează design-ul cu opacitate mărită */
          border: ${
            currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : 
            currentTheme === 'light' ? '1px solid rgba(100, 116, 139, 0.3)' :  /* CONTRAST FIX: border mai vizibil */
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
            ? '0 4px 16px rgba(0, 0, 0, 0.1)'  /* CONTRAST FIX: shadow mai ușor pentru light theme */
            : '0 4px 16px rgba(0, 0, 0, 0.2)'
          };
          position: relative;
          width: 96%;
          max-width: 96%;
          box-sizing: border-box;
          z-index: 1;
          isolation: isolate;
          
          /* ZERO LAG scroll - toate transform-urile eliminate */
          /* REMOVED transform, backface-visibility, contain pentru zero GPU overhead */
        }

        .course-card-enhanced:hover {
          /* ELIMINAT transform pentru ZERO lag - doar shadow ușor */
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.3);
          transition: box-shadow 0.1s ease; /* Rapid pentru responsivitate */
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
            currentTheme === 'light' ? '#000000' :  /* PURE BLACK pentru Light theme */
            currentTheme === 'business' ? '#1e293b' :
            currentTheme === 'driver' ? '#ffffff' :
            currentTheme === 'nature' ? '#ffffff' :
            currentTheme === 'night' ? '#ffffff' :
            '#000000'  /* Default la BLACK în loc de WHITE */
          };
          font-size: 1rem;
          font-weight: 600;
          flex: 1;
        }

        .toggle-details-btn {
          background: ${
            currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' :
            currentTheme === 'light' ? 'rgba(226, 232, 240, 0.9)' :  /* CONTRAST FIX: background mai închis pentru light */
            currentTheme === 'business' ? 'rgba(59, 130, 246, 0.1)' :
            currentTheme === 'driver' ? 'rgba(249, 115, 22, 0.2)' :
            currentTheme === 'nature' ? 'rgba(16, 185, 129, 0.2)' :
            currentTheme === 'night' ? 'rgba(139, 92, 246, 0.2)' :
            'rgba(226, 232, 240, 0.9)'
          };
          border: ${
            currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' :
            currentTheme === 'light' ? '1px solid rgba(100, 116, 139, 0.4)' :  /* CONTRAST FIX: border mai vizibil pentru light */
            currentTheme === 'business' ? '1px solid rgba(59, 130, 246, 0.3)' :
            currentTheme === 'driver' ? '1px solid rgba(249, 115, 22, 0.4)' :
            currentTheme === 'nature' ? '1px solid rgba(16, 185, 129, 0.4)' :
            currentTheme === 'night' ? '1px solid rgba(139, 92, 246, 0.4)' :
            '1px solid rgba(100, 116, 139, 0.4)'
          };
          color: ${
            currentTheme === 'dark' ? '#ffffff' :
            currentTheme === 'light' ? '#000000' :  /* PURE BLACK pentru Light theme */
            currentTheme === 'business' ? '#1e293b' :
            currentTheme === 'driver' ? '#ffffff' :
            currentTheme === 'nature' ? '#ffffff' :
            currentTheme === 'night' ? '#ffffff' :
            '#000000'  /* Default la BLACK */
          };
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: none;
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
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 1.0)'};  /* CONTRAST FIX: hover mai vizibil */
          color: ${currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'night'
            ? '#ffffff'  /* WHITE text for Dark/Driver/Night themes only */
            : '#1e293b'  /* CONTRAST FIX: text mai închis pentru light theme */
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
          margin-bottom: 16px;
          background: ${currentTheme === 'dark' 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(241, 245, 249, 0.9)'  /* CONTRAST FIX: background mai închis pentru light theme */
          };
          border-radius: 12px;
          padding: 16px;
          border: ${currentTheme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(148, 163, 184, 0.3)'  /* CONTRAST FIX: border mai vizibil */
          };
          width: 100%;
          box-sizing: border-box;
        }

        .preview-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 0;
          border-bottom: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(148, 163, 184, 0.4)'}; /* CONTRAST FIX */
          min-height: 50px;
          width: 100%;
          align-items: flex-start;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          color: ${currentTheme === 'light' 
            ? '#000000'  /* PURE BLACK pentru Light theme - contrast maxim */
            : currentTheme === 'business'
              ? '#000000'  /* BLACK text for Business theme */
              : currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#000000'  /* BLACK text for Driver/Nature/Night themes */
                : '#94a3b8'  /* Gray text for Dark theme only */
          };
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          width: 100%;
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
          font-size: 0.85rem;
          font-weight: 600;
          text-align: left;
          word-break: break-word;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.5;
          width: 100%;
          margin-top: 4px;
          white-space: normal;
          max-width: 100%;
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
          transition: none;
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
          /* REMOVED blur effects pentru telefoane vechi - cauza lag */
          position: relative;
          z-index: 1;
          /* REMOVED heavy box-shadow pentru telefoane vechi */
          boxShadow: 'none';
          margin-bottom: 16px;
          isolation: isolate;
          display: block;
          padding: 20px;
        }

        .details-grid-enhanced {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }

        .detail-section-enhanced {
          background: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'};
          border: ${currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(203, 213, 225, 0.3)'};
          border-radius: 12px;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 8px;
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
      </div>
      
      <button 
        className="toggle-details-btn"
        onClick={() => setShowDetailsModal(true)}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fas fa-eye"></i>
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

      {/* Course Details Modal */}
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
