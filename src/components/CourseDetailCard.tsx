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

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Nu este specificat';
    try {
      const date = new Date(timeString);
      return date.toLocaleString('ro-RO', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="course-detail-card mb-4">
      <div className="card shadow-lg border-0 course-card-modern">
        <div className="card-header-modern d-flex justify-content-between align-items-center">
          <div className="course-header-info">
            <div className="course-name-section">
              <h5 className="course-title-main">{course.name || 'Transport marfă'}</h5>
              <span className="course-id-badge">#{course.id}</span>
            </div>
            <div className="course-route-info">
              <div className="route-display">
                <span className="route-start">{course.departure_location || 'Punct plecare'}</span>
                <i className="fas fa-arrow-right route-arrow"></i>
                <span className="route-end">{course.destination_location || 'Destinație'}</span>
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
              onClick={() => setShowDetails(!showDetails)}
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
              <i className="fas fa-clock text-primary"></i>
              <span className="summary-label">Program:</span>
              <span className="summary-value">
                {course.departure_time && course.arrival_time 
                  ? `${formatTime(course.departure_time).split(' ')[1]} - ${formatTime(course.arrival_time).split(' ')[1]}`
                  : 'Nu este specificat'}
              </span>
            </div>
            <div className="summary-item">
              <i className="fas fa-barcode text-primary"></i>
              <span className="summary-label">UIT:</span>
              <span className="summary-value font-monospace">{course.uit}</span>
            </div>
          </div>

          {/* Detailed Info - Collapsible */}
          {showDetails && (
            <div className="course-details">
              <h6 className="details-title">
                <i className="fas fa-info-circle me-2"></i>
                Informații Complete
              </h6>
              
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Punct de plecare</div>
                    <div className="detail-value">{course.departure_location || 'Nu este specificat'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <i className="fas fa-flag-checkered"></i>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Destinație</div>
                    <div className="detail-value">{course.destination_location || 'Nu este specificat'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <i className="fas fa-play-circle"></i>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Ora plecare</div>
                    <div className="detail-value">{formatTime(course.departure_time)}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <i className="fas fa-stop-circle"></i>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Ora sosire</div>
                    <div className="detail-value">{formatTime(course.arrival_time)}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Identificator UIT</div>
                    <div className="detail-value font-monospace">{course.uit}</div>
                  </div>
                </div>

                {course.description && (
                  <div className="detail-item full-width">
                    <div className="detail-icon">
                      <i className="fas fa-file-text"></i>
                    </div>
                    <div className="detail-content">
                      <div className="detail-label">Descriere transport</div>
                      <div className="detail-value">{course.description}</div>
                    </div>
                  </div>
                )}
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