import React, { useState } from 'react';
import { Course } from '../types';
import { startGPSTracking, stopGPSTracking } from '../services/communityGPS';

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
      // Send status update to server first
      await sendStatusToServer(newStatus);
      
      // Update GPS tracking based on status - no await to prevent blocking
      if (newStatus === 2) {
        // Start GPS tracking with real UIT from course
        startGPSTracking(course.id, vehicleNumber, token, course.uit).catch(error => {
          console.error('Failed to start GPS tracking:', error);
        });
      } else if (course.status === 2 && (newStatus === 3 || newStatus === 4)) {
        // Stop or pause GPS tracking
        stopGPSTracking(course.id).catch(error => {
          console.error('Failed to stop GPS tracking:', error);
        });
      } else if (newStatus === 2 && course.status === 3) {
        // Resume GPS tracking from pause with real UIT
        startGPSTracking(course.id, vehicleNumber, token, course.uit).catch(error => {
          console.error('Failed to resume GPS tracking:', error);
        });
      }
      
      onStatusUpdate(course.id, newStatus);
    } catch (error) {
      console.error('Error updating course status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendStatusToServer = async (status: number) => {
    try {
      // Send GPS data with the new status to mark course state change
      const { sendGPSData } = await import('../services/api');
      const { Geolocation } = await import('@capacitor/geolocation');
      const { Device } = await import('@capacitor/device');
      
      // Get current position for status update
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      const batteryInfo = await Device.getBatteryInfo();
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: currentTime,
        viteza: Math.max(0, position.coords.speed || 0),
        directie: position.coords.heading || 0,
        altitudine: position.coords.altitude || 0,
        baterie: Math.round((batteryInfo.batteryLevel || 0) * 100),
        numar_inmatriculare: vehicleNumber,
        uit: course.uit,
        status: status.toString(), // Send the exact status: 2=started, 3=paused, 4=finished
        hdop: Math.round(position.coords.accuracy || 0).toString(),
        gsm_signal: '100'
      };

      console.log(`Sending status ${status} to server for course ${course.id}`);
      await sendGPSData(gpsData, token);
    } catch (error) {
      console.error('Error sending status to server:', error);
      // Don't throw error - continue with local status update
    }
  };



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
