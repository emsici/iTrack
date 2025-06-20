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
      <div className="course-card-header-style">
        <div className="course-header-content">
          <div className="course-primary-info">
            <h5 className="course-title-header">UIT: {course.uit}</h5>
            <span className="course-subtitle-header">ikRoTrans: {course.ikRoTrans}</span>
          </div>
          
          <div className="course-header-actions">
            <span className={`status-badge-header status-${course.status}`}>
              <i className="fas fa-circle status-dot"></i>
              {getStatusText(course.status)}
            </span>
            <button 
              className="btn-toggle-header"
              onClick={() => setShowDetails(!showDetails)}
              title="Afișează/Ascunde detalii"
            >
              <i className={`fas fa-${showDetails ? 'chevron-up' : 'chevron-down'}`}></i>
            </button>
          </div>
        </div>

        <div className="course-summary-header">
          <div className="summary-item-header">
            <i className="fas fa-calendar"></i>
            <span>Data: {course.dataTransport || 'N/A'}</span>
          </div>
          <div className="summary-item-header">
            <i className="fas fa-route"></i>
            <span>{course.vama} → {course.vamaStop}</span>
          </div>
        </div>

        {showDetails && (
          <div className="course-details-header">
            <div className="details-section-header">
              <h6 className="section-title-header">
                <i className="fas fa-info-circle"></i>
                Informații Transport
              </h6>
              <div className="details-grid-header">
                <div className="detail-row-header">
                  <span className="detail-label-header">Cod Declarant:</span>
                  <span className="detail-value-header">{course.codDeclarant}</span>
                </div>
                <div className="detail-row-header">
                  <span className="detail-label-header">Denumire:</span>
                  <span className="detail-value-header">{course.denumireDeclarant}</span>
                </div>
                <div className="detail-row-header">
                  <span className="detail-label-header">Vehicul:</span>
                  <span className="detail-value-header">{course.nrVehicul}</span>
                </div>
              </div>
            </div>

            <div className="details-section-header">
              <h6 className="section-title-header">
                <i className="fas fa-map-marker-alt"></i>
                Plecare
              </h6>
              <div className="details-grid-header">
                <div className="detail-row-header">
                  <span className="detail-label-header">Vamă:</span>
                  <span className="detail-value-header">{course.vama}</span>
                </div>
                <div className="detail-row-header">
                  <span className="detail-label-header">Birou Vamal:</span>
                  <span className="detail-value-header">{course.BirouVamal || 'N/A'}</span>
                </div>
                <div className="detail-row-header">
                  <span className="detail-label-header">Județ:</span>
                  <span className="detail-value-header">{course.judet}</span>
                </div>
              </div>
            </div>

            <div className="details-section-header">
              <h6 className="section-title-header">
                <i className="fas fa-flag-checkered"></i>
                Destinație
              </h6>
              <div className="details-grid-header">
                <div className="detail-row-header">
                  <span className="detail-label-header">Vamă Stop:</span>
                  <span className="detail-value-header">{course.vamaStop}</span>
                </div>
                <div className="detail-row-header">
                  <span className="detail-label-header">Birou Vamal:</span>
                  <span className="detail-value-header">{course.BirouVamalStop || 'N/A'}</span>
                </div>
                <div className="detail-row-header">
                  <span className="detail-label-header">Județ:</span>
                  <span className="detail-value-header">{course.judetStop}</span>
                </div>
                {course.denumireLocStop && (
                  <div className="detail-row-header">
                    <span className="detail-label-header">Locație:</span>
                    <span className="detail-value-header">{course.denumireLocStop}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="course-actions-header">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailCard;