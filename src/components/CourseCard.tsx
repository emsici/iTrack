import React, { useState } from 'react';
import { Course } from '../types';
import { startGPSTracking, pauseGPSTracking, resumeGPSTracking, stopGPSTracking } from '../services/nativeGPS';

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
        // Status 2: Start GPS tracking - trimite coordonate continuu din minut în minut
        console.log('Requesting background permissions...');
        try {
          await import('../services/nativeGPS').then(module => module.requestBackgroundPermissions());
          console.log('Background permissions requested successfully');
        } catch (permError) {
          console.log('Background permissions request failed, continuing anyway:', permError);
        }
        
        await startGPSTracking(course.id, vehicleNumber, token, course.uit);
        console.log(`✓ STARTED GPS tracking - coordinates every 60 seconds - Status 2`);
        
      } else if (newStatus === 3) {
        // Status 3: Pause GPS tracking - nu mai trimite coordonate
        await pauseGPSTracking(course.id);
        console.log(`✓ PAUSED GPS tracking - coordinates stopped - Status 3`);
        
      } else if (newStatus === 2 && course.status === 3) {
        // Resume from pause - reactivate coordinate transmission
        await resumeGPSTracking(course.id);
        console.log(`✓ RESUMED GPS tracking - coordinates restarted - Status 2`);
        
      } else if (newStatus === 4) {
        // Status 4: Stop GPS tracking completely
        await stopGPSTracking(course.id);
        console.log(`✓ STOPPED GPS tracking completely - Status 4`);
      }
      
      onStatusUpdate(course.id, newStatus);
    } catch (error) {
      console.error('ERROR in GPS tracking:', error);
      // Continue with status update even if GPS fails
      onStatusUpdate(course.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  // Removed old GPS sending method - now handled by continuousGPS service



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
          {/* Status 1 (Available): Show only START button */}
          {course.status === 1 && (
            <div className="col-12">
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

          {/* Status 2 (In Progress): Show PAUSE and FINISH buttons */}
          {course.status === 2 && (
            <>
              <div className="col-6">
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
              <div className="col-6">
                <button
                  className="btn btn-course btn-stop w-100"
                  onClick={() => handleStatusChange(4)}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>🏁 Termină</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Status 3 (Paused): Show only RESUME button */}
          {course.status === 3 && (
            <div className="col-12">
              <button
                className="btn btn-course btn-start w-100"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>▶️ Reluare</>
                )}
              </button>
            </div>
          )}

          {/* Status 4 (Finished): No buttons */}
          {course.status === 4 && (
            <div className="col-12 text-center text-muted">
              <small>Cursă finalizată</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
