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
        <div className="course-info">
          <div>
            <h6 className="course-title mb-1">
              🚚 {course.name || `Cursă ${course.id}`}
            </h6>
            <div className="d-flex gap-2 align-items-center">
              <span className={`badge status-badge ${getStatusBadgeClass(course.status)}`}>
                {getStatusText(course.status)}
              </span>
              <span className="course-uit">UIT: {course.uit}</span>
            </div>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲' : '▼'}
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
                className="btn btn-course btn-start w-100"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>▶️ Start</>
                )}
              </button>
            </div>
          )}

          {canResume && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-course btn-start w-100"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>▶️ Continuă</>
                )}
              </button>
            </div>
          )}

          {canPause && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-course btn-pause w-100"
                onClick={() => handleStatusChange(3)}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>⏸️ Pauză</>
                )}
              </button>
            </div>
          )}

          {canStop && (
            <div className="col-6 col-md-3">
              <button
                className="btn btn-course btn-stop w-100"
                onClick={() => handleStatusChange(4)}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>⏹️ Stop</>
                )}
              </button>
            </div>
          )}

          <div className="col-6 col-md-3">
            <button
              className="btn btn-course btn-finish w-100"
              onClick={() => handleStatusChange(4)}
              disabled={loading || course.status === 4}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <>🏁 Termină</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
