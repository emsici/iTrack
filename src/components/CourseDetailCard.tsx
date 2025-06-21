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
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 16px 20px;
          margin: 0 auto 16px auto;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          position: relative;
          width: 96%;
          max-width: 96%;
          box-sizing: border-box;
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
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          flex: 1;
        }

        .toggle-details-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
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
        }

        .toggle-details-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .course-preview {
          margin-bottom: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 24px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 90px;
          flex-shrink: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-value {
          color: #e2e8f0;
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
          color: #ffffff;
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
            {course.vama || 'N/A'}
          </span>
        </div>
        
        <div className="preview-row">
          <span className="preview-label">Sosire:</span>
          <span className="preview-value">
            {course.vamaStop || course.denumireLocStop || 'N/A'}
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
      </div>
      
      <button 
        className="toggle-details-btn"
        onClick={() => setShowDetails(!showDetails)}
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
    </div>
  );
};

export default CourseDetailCard;