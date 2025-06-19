import React, { useState } from 'react';
import { Course } from '../types';
import { startGPSTracking, stopGPSTracking } from '../services/nativeGPS';
import '../styles/courseCard.css';

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

  const handleStatusChange = async (newStatus: number) => {
    setLoading(true);
    
    try {
      console.log(`Course ${course.id}: Changing status from ${course.status} to ${newStatus}`);
      
      // Handle GPS tracking based on status changes
      if (newStatus === 2) {
        // Starting or resuming course - Start GPS tracking
        console.log(`Starting GPS tracking for course ${course.id} with UIT: ${course.uit}`);
        await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
      } else if (newStatus === 3) {
        // Pausing course - GPS continues but sends pause status
        console.log(`Pausing course ${course.id} - GPS continues with pause status`);
        // GPS service will automatically send status 3 with coordinates
      } else if (newStatus === 4) {
        // Finishing course - Stop GPS tracking completely
        console.log(`Finishing course ${course.id} - Stopping GPS tracking`);
        await stopGPSTracking(course.id);
      }
      
      // Send immediate status update to server with current position
      await sendStatusToServer(newStatus);
      
      // Update local status
      onStatusUpdate(course.id, newStatus);
      
      console.log(`Course ${course.id}: Status successfully changed to ${newStatus}`);
      
    } catch (error) {
      console.error(`Error updating course ${course.id} status:`, error);
      
      // Show user-friendly error message
      alert(`Eroare la actualizarea statusului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
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
    <div className="course-card-modern">
      <div className="course-card-container">
        {/* Main Course Header */}
        <div className="course-header">
          <div className="course-primary-info">
            <div className="uit-badge-container">
              <span className="uit-main-badge">UIT: {course.uit}</span>
              {course.ikRoTrans && (
                <span className="ikro-badge">#{course.ikRoTrans}</span>
              )}
            </div>
            
            {course.codDeclarant && course.denumireDeclarant && (
              <div className="declarant-info">
                <i className="fas fa-building me-2"></i>
                <span className="declarant-text">
                  {course.codDeclarant} - {course.denumireDeclarant}
                </span>
              </div>
            )}
            
            {course.dataTransport && (
              <div className="transport-date">
                <i className="far fa-calendar-alt me-2"></i>
                <span>{new Date(course.dataTransport).toLocaleDateString('ro-RO')}</span>
              </div>
            )}
          </div>

          <div className="course-actions">
            <div className={`status-badge status-${course.status}`}>
              <div className="status-indicator"></div>
              <span className="status-text">{getStatusText(course.status)}</span>
            </div>
            
            <button
              className={`info-toggle-btn ${expanded ? 'expanded' : ''}`}
              onClick={() => setExpanded(!expanded)}
              disabled={loading}
              title="Detalii cursă"
            >
              <i className={`fas fa-${expanded ? 'chevron-up' : 'info-circle'}`}></i>
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="course-details-expanded">
            <div className="course-details-container">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-map-marker-alt"></i>
                    Plecare
                  </div>
                  <div className="detail-value">
                    {course.departure_location || course.vama || 'Nu este specificat'}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-flag-checkered"></i>
                    Destinație
                  </div>
                  <div className="detail-value">
                    {course.destination_location || course.vamaStop || 'Nu este specificat'}
                  </div>
                </div>
              </div>
              
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-clock"></i>
                    Ora plecare
                  </div>
                  <div className="detail-value">
                    {course.departure_time || 'Nu este specificat'}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="far fa-clock"></i>
                    Ora sosire
                  </div>
                  <div className="detail-value">
                    {course.arrival_time || 'Nu este specificat'}
                  </div>
                </div>
              </div>

              {(course.birouVamal || course.judet) && (
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-label">
                      <i className="fas fa-university"></i>
                      Birou vamal
                    </div>
                    <div className="detail-value">
                      {course.birouVamal || 'Nu este specificat'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">
                      <i className="fas fa-map"></i>
                      Județ
                    </div>
                    <div className="detail-value">
                      {course.judet || 'Nu este specificat'}
                    </div>
                  </div>
                </div>
              )}

              {course.description && (
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-label">
                      <i className="fas fa-info-circle"></i>
                      Descriere
                    </div>
                    <div className="detail-value">
                      {course.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="course-actions-footer">
          {/* Status 1 (Available): Show only START button */}
          {course.status === 1 && (
            <div className="action-buttons-grid single">
              <button
                className="btn-course-modern btn-start-modern"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-play"></i>
                    Start Cursă
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status 2 (In Progress): Show PAUSE and FINISH buttons */}
          {course.status === 2 && (
            <div className="action-buttons-grid double">
              <button
                className="btn-course-modern btn-pause-modern"
                onClick={() => handleStatusChange(3)}
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-pause"></i>
                    Pauză
                  </>
                )}
              </button>
              <button
                className="btn-course-modern btn-finish-modern"
                onClick={() => handleStatusChange(4)}
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-flag-checkered"></i>
                    Finalizează
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status 3 (Paused): Show only RESUME button */}
          {course.status === 3 && (
            <div className="action-buttons-grid single">
              <button
                className="btn-course-modern btn-resume-modern"
                onClick={() => handleStatusChange(2)}
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-play"></i>
                    Continuă
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status 4 (Stopped): Show completion message */}
          {course.status === 4 && (
            <div className="action-buttons-grid single">
              <div className="completion-message">
                <i className="fas fa-check-circle"></i>
                <span>Cursă finalizată cu succes</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;