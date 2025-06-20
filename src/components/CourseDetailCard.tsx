import React, { useState } from 'react';
import { Course } from '../types';

interface CourseDetailCardProps {
  course: Course;
  onStatusUpdate: (courseId: string, newStatus: number) => void;
  isLoading: boolean;
}

const CourseDetailCard: React.FC<CourseDetailCardProps> = ({ 
  course, 
  onStatusUpdate,
  isLoading 
}) => {
  const [showDetails, setShowDetails] = useState(false);

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
            className="action-btn-enhanced btn-start-enhanced"
            onClick={() => handleAction('start')}
            disabled={isLoading}
          >
            <i className="fas fa-play"></i>
            Pornește
          </button>
        );
      case 2: // In progress
        return (
          <>
            <button 
              className="action-btn-enhanced btn-pause-enhanced"
              onClick={() => handleAction('pause')}
              disabled={isLoading}
            >
              <i className="fas fa-pause"></i>
              Pauză
            </button>
            <button 
              className="action-btn-enhanced btn-finish-enhanced"
              onClick={() => handleAction('finish')}
              disabled={isLoading}
            >
              <i className="fas fa-stop"></i>
              Finalizează
            </button>
          </>
        );
      case 3: // Paused
        return (
          <>
            <button 
              className="action-btn-enhanced btn-resume-enhanced"
              onClick={() => handleAction('resume')}
              disabled={isLoading}
            >
              <i className="fas fa-play"></i>
              Continuă
            </button>
            <button 
              className="action-btn-enhanced btn-finish-enhanced"
              onClick={() => handleAction('finish')}
              disabled={isLoading}
            >
              <i className="fas fa-stop"></i>
              Finalizează
            </button>
          </>
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

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return 'fas fa-clock';
      case 2: return 'fas fa-play-circle';
      case 3: return 'fas fa-pause-circle';
      case 4: return 'fas fa-stop-circle';
      default: return 'fas fa-question-circle';
    }
  };

  return (
    <div className="course-card-enhanced">
      <style>{`
        .course-card-enhanced {
          background: linear-gradient(135deg, 
            rgba(20, 25, 40, 0.95) 0%,
            rgba(25, 30, 50, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          margin: 0 auto 16px auto;
          max-width: 600px;
          width: calc(100% - 40px);
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .course-card-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .course-card-enhanced::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${getStatusColor(course.status)}, ${getStatusColor(course.status)}88);
          transition: all 0.3s ease;
        }

        .course-header-enhanced {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .course-title-enhanced {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .course-subtitle-enhanced {
          color: #cbd5e1;
          font-size: 0.9rem;
          margin: 0;
        }

        .course-status-enhanced {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
        }

        .status-badge-enhanced {
          background: ${getStatusColor(course.status)};
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px ${getStatusColor(course.status)}33;
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
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          animation: ${showDetails ? 'slideDown' : 'slideUp'} 0.3s ease;
          max-height: ${showDetails ? '500px' : '0'};
          overflow: hidden;
          opacity: ${showDetails ? '1' : '0'};
          transition: all 0.3s ease;
        }

        .details-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .detail-section-enhanced {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
        }

        .section-title-enhanced {
          color: #ffffff;
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .detail-item-enhanced:last-child {
          border-bottom: none;
        }

        .detail-label-enhanced {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .detail-value-enhanced {
          color: #e2e8f0;
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

        .action-btn-enhanced {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
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

        .btn-start-enhanced {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-pause-enhanced {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .btn-resume-enhanced {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-finish-enhanced {
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

      <div className="course-header-enhanced">
        <div className="course-title-enhanced">
          <i className="fas fa-truck"></i>
          UIT: {course.uit}
        </div>
        <div className="course-subtitle-enhanced">
          ikRoTrans: {course.ikRoTrans}
        </div>
        
        <div className="course-status-enhanced">
          <div className="status-badge-enhanced">
            <i className={getStatusIcon(course.status)}></i>
            {getStatusText(course.status)}
          </div>
          <button 
            className="toggle-btn-enhanced"
            onClick={() => setShowDetails(!showDetails)}
          >
            <i className={`fas fa-${showDetails ? 'chevron-up' : 'chevron-down'}`}></i>
            Detalii
          </button>
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
                <span className="detail-label-enhanced">Cod Declarant:</span>
                <span className="detail-value-enhanced">{course.codDeclarant}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Denumire:</span>
                <span className="detail-value-enhanced">{course.denumireDeclarant}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Vehicul:</span>
                <span className="detail-value-enhanced">{course.nrVehicul}</span>
              </div>
            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-map-marker-alt"></i>
                Plecare
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Vamă:</span>
                <span className="detail-value-enhanced">{course.vama}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Birou Vamal:</span>
                <span className="detail-value-enhanced">{course.BirouVamal || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Județ:</span>
                <span className="detail-value-enhanced">{course.judet}</span>
              </div>
            </div>

            <div className="detail-section-enhanced">
              <h6 className="section-title-enhanced">
                <i className="fas fa-flag-checkered"></i>
                Destinație
              </h6>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Vamă Stop:</span>
                <span className="detail-value-enhanced">{course.vamaStop}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Birou Vamal:</span>
                <span className="detail-value-enhanced">{course.BirouVamalStop || 'N/A'}</span>
              </div>
              <div className="detail-item-enhanced">
                <span className="detail-label-enhanced">Județ:</span>
                <span className="detail-value-enhanced">{course.judetStop}</span>
              </div>
              {course.denumireLocStop && (
                <div className="detail-item-enhanced">
                  <span className="detail-label-enhanced">Locație:</span>
                  <span className="detail-value-enhanced">{course.denumireLocStop}</span>
                </div>
              )}
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
    </div>
  );
};

export default CourseDetailCard;