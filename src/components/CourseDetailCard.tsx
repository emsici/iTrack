import React, { useState } from 'react';
import { Course } from '../types';
import '../styles/courses.css';

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
    if (isLoading) {
      return (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </div>
        </div>
      );
    }

    switch (course.status) {
      case 1: // Available
        return (
          <button 
            className="btn btn-success btn-sm w-100"
            onClick={() => handleAction('start')}
          >
            <i className="fas fa-play me-2"></i>Start
          </button>
        );
      case 2: // In progress
        return (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-warning btn-sm flex-fill"
              onClick={() => handleAction('pause')}
            >
              <i className="fas fa-pause me-1"></i>Pauzează
            </button>
            <button 
              className="btn btn-danger btn-sm flex-fill"
              onClick={() => handleAction('finish')}
            >
              <i className="fas fa-stop me-1"></i>Finalizează
            </button>
          </div>
        );
      case 3: // Paused
        return (
          <button 
            className="btn btn-primary btn-sm w-100"
            onClick={() => handleAction('resume')}
          >
            <i className="fas fa-play me-2"></i>Continuă
          </button>
        );
      default:
        return null;
    }
  };



  return (
    <div className="course-detail-card mb-4">
      <div className="card shadow-lg border-0 course-card-modern">
        <div className="card-header-modern d-flex justify-content-between align-items-center">
          <div className="course-header-info">
            <div className="course-name-section">
              <h5 className="course-title-main">UIT: {course.uit}</h5>
              <span className="course-id-badge">ikRoTrans: {course.ikRoTrans}</span>
            </div>
            <div className="course-route-info">
              <div className="route-display">
                <span className="route-start">Cod: {course.codDeclarant}</span>
              </div>
            </div>
          </div>
          
          <div className="course-header-actions">
            <span 
              className={`status-badge-modern status-${course.status}`}
            >
              <i className="fas fa-circle status-indicator"></i>
              {getStatusText(course.status)}
            </span>
            <button 
              className="btn-info-toggle"
              onClick={() => {
                console.log('Info button clicked, current state:', showDetails);
                setShowDetails(!showDetails);
              }}
              title="Afișează/Ascunde detalii complete"
            >
              <i className={`fas fa-${showDetails ? 'chevron-up' : 'info-circle'}`}></i>
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Quick Info Summary */}
          <div className="course-summary mb-3">
            <div className="summary-item">
              <i className="fas fa-calendar text-primary"></i>
              <span className="summary-label">Data Transport:</span>
              <span className="summary-value">
                {course.dataTransport || 'Nu este specificată'}
              </span>
            </div>
            <div className="summary-item">
              <i className="fas fa-map-marker-alt text-primary"></i>
              <span className="summary-label">Traseu:</span>
              <span className="summary-value">{course.vama} → {course.vamaStop}</span>
            </div>
          </div>

          {/* Detailed Info - Collapsible */}
          {showDetails && (
            <div className="course-details">
              <h6 className="details-title">
                <i className="fas fa-info-circle me-2"></i>
                Informații Complete Transport
              </h6>
              
              <div className="details-grid">
                {/* Informații Transport */}
                <div className="detail-group">
                  <h6 className="group-title">
                    <i className="fas fa-info-circle me-2"></i>Informații Transport
                  </h6>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">ikRoTrans:</div>
                      <div className="detail-value font-weight-bold text-primary">{course.ikRoTrans}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Cod Declarant:</div>
                      <div className="detail-value">{course.codDeclarant}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Denumire Declarant:</div>
                      <div className="detail-value">{course.denumireDeclarant}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Data Transport:</div>
                      <div className="detail-value">{course.dataTransport}</div>
                    </div>
                  </div>
                </div>

                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Număr Vehicul:</div>
                      <div className="detail-value">{course.nrVehicul}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">UIT:</div>
                      <div className="detail-value font-monospace">{course.uit}</div>
                    </div>
                  </div>
                </div>

                {/* Departure Section */}
                <div className="detail-group">
                  <h6 className="group-title">
                    <i className="fas fa-map-marker-alt me-2"></i>Plecare
                  </h6>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Vamă:</div>
                      <div className="detail-value">{course.vama}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Birou Vamal:</div>
                      <div className="detail-value">{course.birouVamal}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Județ:</div>
                      <div className="detail-value">{course.judet}</div>
                    </div>
                  </div>
                  {course.denumireLocStart && (
                    <div className="detail-item">
                      <div className="detail-content">
                        <div className="detail-label">Denumire Locație Start:</div>
                        <div className="detail-value">{course.denumireLocStart}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination Section */}
                <div className="detail-group">
                  <h6 className="group-title">
                    <i className="fas fa-flag-checkered me-2"></i>Destinație
                  </h6>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Vamă Stop:</div>
                      <div className="detail-value">{course.vamaStop}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Birou Vamal Stop:</div>
                      <div className="detail-value">{course.birouVamalStop}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <div className="detail-label">Județ Stop:</div>
                      <div className="detail-value">{course.judetStop}</div>
                    </div>
                  </div>
                  {course.denumireLocStop && (
                    <div className="detail-item">
                      <div className="detail-content">
                        <div className="detail-label">Denumire Locație Stop:</div>
                        <div className="detail-value">{course.denumireLocStop}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="course-actions">
            {renderActionButtons()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailCard;