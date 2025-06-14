import React, { useState } from 'react';
import { Course } from '../types';
import { startGPSTracking, stopGPSTracking } from '../services/gps';

interface CourseCardProps {
  course: Course;
  vehicleNumber: string;
  token: string;
  onStatusUpdate: (courseId: string, newStatus: number) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  vehicleNumber,
  token,
  onStatusUpdate
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Disponibilă';
      case 2: return 'În desfășurare';
      case 3: return 'În pauză';
      case 4: return 'Oprită';
      default: return 'Necunoscută';
    }
  };

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 1: return 'bg-secondary';
      case 2: return 'bg-success';
      case 3: return 'bg-warning';
      case 4: return 'bg-danger';
      default: return 'bg-dark';
    }
  };

  const handleStatusChange = async (newStatus: number) => {
    setLoading(true);
    try {
      if (newStatus === 2) {
        // Start GPS tracking
        await startGPSTracking(course.id, vehicleNumber, token);
      } else if (course.status === 2 && (newStatus === 3 || newStatus === 4)) {
        // Stop or pause GPS tracking
        await stopGPSTracking(course.id);
      } else if (newStatus === 2 && course.status === 3) {
        // Resume GPS tracking from pause
        await startGPSTracking(course.id, vehicleNumber, token);
      }
      
      onStatusUpdate(course.id, newStatus);
    } catch (error) {
      console.error('Error updating course status:', error);
    } finally {
      setLoading(false);
    }
  };

  const canStart = course.status === 1;
  const canPause = course.status === 2;
  const canResume = course.status === 3;
  const canStop = course.status === 2 || course.status === 3;

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h6 className="mb-0 me-3">
              <i className="fas fa-route me-2"></i>
              {course.name || `Cursă ${course.id}`}
            </h6>
            <span className={`badge ${getStatusBadgeClass(course.status)}`}>
              {getStatusText(course.status)}
            </span>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setExpanded(!expanded)}
          >
            <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-6">
              <small className="text-muted">Plecare:</small>
              <div>{course.departure_location || 'Nu este specificat'}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Destinație:</small>
              <div>{course.destination_location || 'Nu este specificat'}</div>
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-6">
              <small className="text-muted">Ora plecare:</small>
              <div>{course.departure_time || 'Nu este specificat'}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Ora sosire:</small>
              <div>{course.arrival_time || 'Nu este specificat'}</div>
            </div>
          </div>

          {course.description && (
            <div className="mb-3">
              <small className="text-muted">Descriere:</small>
              <div>{course.description}</div>
            </div>
          )}
        </div>
      )}

      <div className="card-footer bg-white">
        <div className="row g-2">
          {canStart && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-success w-100"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                <i className="fas fa-play me-2"></i>
                Start
              </button>
            </div>
          )}

          {canResume && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-success w-100"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                <i className="fas fa-play me-2"></i>
                Reia
              </button>
            </div>
          )}

          {canPause && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-warning w-100"
                onClick={() => handleStatusChange(3)}
                disabled={loading}
              >
                <i className="fas fa-pause me-2"></i>
                Pauză
              </button>
            </div>
          )}

          {canStop && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-danger w-100"
                onClick={() => handleStatusChange(4)}
                disabled={loading}
              >
                <i className="fas fa-stop me-2"></i>
                Stop
              </button>
            </div>
          )}

          <div className="col-6 col-md-3">
            <button
              className="btn btn-dark w-100"
              onClick={() => handleStatusChange(4)}
              disabled={loading || course.status === 4}
            >
              <i className="fas fa-flag-checkered me-2"></i>
              Termină
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
