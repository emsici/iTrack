import React, { useState } from 'react';
import { Course } from '../types';

interface CourseDetailCardProps {
  course: Course;
  vehicleNumber: string;
  token: string;
  onStatusUpdate: (courseId: string, newStatus: number) => void;
  isLoading: boolean;
}

const CourseDetailCard: React.FC<CourseDetailCardProps> = ({ 
  course, 
  vehicleNumber, 
  token, 
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

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#28a745'; // Green
      case 2: return '#007bff'; // Blue  
      case 3: return '#ffc107'; // Yellow
      case 4: return '#6c757d'; // Gray
      default: return '#dc3545'; // Red
    }
  };

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
    <div className="course-detail-card mb-3">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0 fw-bold">{course.name}</h6>
            <small className="opacity-75">ID: {course.id}</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span 
              className="badge rounded-pill px-3 py-2"
              style={{ backgroundColor: getStatusColor(course.status) }}
            >
              {getStatusText(course.status)}
            </span>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={() => setShowDetails(!showDetails)}
              title="Afișează/Ascunde detalii"
            >
              <i className={`fas fa-${showDetails ? 'chevron-up' : 'info-circle'}`}></i>
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Basic Info */}
          <div className="row mb-3">
            <div className="col-6">
              <small className="text-muted">Plecare:</small>
              <div className="fw-semibold">{course.departure_location || 'Nu este specificat'}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Destinație:</small>
              <div className="fw-semibold">{course.destination_location || 'Nu este specificat'}</div>
            </div>
          </div>

          {/* Detailed Info - Collapsible */}
          {showDetails && (
            <div className="course-details border-top pt-3 mb-3">
              <div className="row">
                <div className="col-md-6 mb-2">
                  <small className="text-muted">Ora plecare:</small>
                  <div className="fw-semibold">{formatTime(course.departure_time)}</div>
                </div>
                <div className="col-md-6 mb-2">
                  <small className="text-muted">Ora sosire:</small>
                  <div className="fw-semibold">{formatTime(course.arrival_time)}</div>
                </div>
                <div className="col-12 mb-2">
                  <small className="text-muted">UIT:</small>
                  <div className="fw-semibold font-monospace">{course.uit}</div>
                </div>
                {course.description && (
                  <div className="col-12 mb-2">
                    <small className="text-muted">Descriere:</small>
                    <div className="fw-semibold">{course.description}</div>
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