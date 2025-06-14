import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { getVehicleCourses } from '../services/api';
import { initializeGPS, startGPSTracking, stopGPSTracking, getActiveCourses } from '../services/gps';
import CourseCard from './CourseCard';

interface VehicleScreenProps {
  token: string;
  onLogout: () => void;
}

const VehicleScreen: React.FC<VehicleScreenProps> = ({ token, onLogout }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    initializeGPS();
  }, []);

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError('Vă rugăm să introduceți numărul vehiculului');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getVehicleCourses(vehicleNumber, token);
      setCourses(data);
      setCoursesLoaded(true);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      setError(error.message || 'Eroare la încărcarea curselor. Verificați numărul vehiculului.');
    } finally {
      setLoading(false);
    }
  };

  const sendStatusToServer = async (course: Course, status: number) => {
    try {
      const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/reportStatus.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: token,
          courseId: course.id,
          status: status.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      console.log('Status update response:', result);
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const renderCourseButton = (course: Course) => {
    const [buttonLoading, setButtonLoading] = useState(false);

    const handleCourseAction = async (newStatus: number) => {
      setButtonLoading(true);
      try {
        // Send status update to server first
        await sendStatusToServer(course, newStatus);
        
        // Update GPS tracking based on status
        if (newStatus === 2) {
          await startGPSTracking(course.id, vehicleNumber, token);
        } else if (course.status === 2 && (newStatus === 3 || newStatus === 4)) {
          await stopGPSTracking(course.id);
        } else if (newStatus === 2 && course.status === 3) {
          await startGPSTracking(course.id, vehicleNumber, token);
        }
        
        handleStatusUpdate(course.id, newStatus);
      } catch (error) {
        console.error('Error updating course status:', error);
      } finally {
        setButtonLoading(false);
      }
    };

    if (course.status === 1) {
      return (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleCourseAction(2)}
          disabled={buttonLoading}
        >
          {buttonLoading ? '...' : 'Start'}
        </button>
      );
    }

    if (course.status === 2) {
      return (
        <div className="d-flex gap-1">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => handleCourseAction(3)}
            disabled={buttonLoading}
          >
            {buttonLoading ? '...' : 'Pauză'}
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleCourseAction(4)}
            disabled={buttonLoading}
          >
            {buttonLoading ? '...' : 'Finalizează'}
          </button>
        </div>
      );
    }

    if (course.status === 3) {
      return (
        <button
          className="btn btn-info btn-sm"
          onClick={() => handleCourseAction(2)}
          disabled={buttonLoading}
        >
          {buttonLoading ? '...' : 'Reia'}
        </button>
      );
    }

    return null;
  };

  const handleStatusUpdate = (courseId: string, newStatus: number) => {
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId
          ? { ...course, status: newStatus }
          : course
      )
    );
  };

  return (
    <div className="app">
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            {/* Top Actions Bar */}
            <div className="top-actions-bar mb-3">
              <div className="app-title-simple">
                📍 iTrack
              </div>
              <div className="action-buttons">
                <button 
                  className="action-btn help-btn"
                  onClick={() => setShowHelpModal(true)}
                  title="Informații despre aplicație"
                >
                  ❓
                </button>
                <button 
                  className="action-btn logout-btn"
                  onClick={onLogout}
                  title="Deconectare"
                >
                  ↗️
                </button>
              </div>
            </div>

            {!coursesLoaded ? (
              <div className="vehicle-input-card">
                <div className="card-body">
                  <h5 className="vehicle-input-title">
                    🚛 Selectează Vehiculul
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-8">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Introdu numărul vehiculului (ex: B123XYZ)"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleLoadCourses();
                          }
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-load-courses btn-lg w-100"
                        onClick={() => handleLoadCourses()}
                        disabled={loading || !vehicleNumber.trim()}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Se încarcă...
                          </>
                        ) : (
                          <>
                            🔍 Încarcă Curse
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger mt-3">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="courses-section">
                <div className="vehicle-info-header mb-3">
                  <div className="vehicle-title-section">
                    <h4 className="vehicle-title">🚛 Vehicul {vehicleNumber}</h4>
                    <button 
                      className="edit-vehicle-btn-small"
                      onClick={() => {
                        setCoursesLoaded(false);
                        setCourses([]);
                        setVehicleNumber('');
                      }}
                      title="Schimbă vehiculul"
                    >
                      ✏️ Schimbă
                    </button>
                  </div>
                  <div className="courses-count">
                    {courses.length} transporturi disponibile
                  </div>
                </div>
                  
                {courses.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Nu există curse disponibile pentru acest vehicul.
                  </div>
                ) : (
                  <div className="row">
                    {courses.map((course) => (
                      <div key={course.id} className="col-12 mb-3">
                        <CourseCard
                          course={course}
                          vehicleNumber={vehicleNumber}
                          token={token}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="app-icon-modal">📍</span>
                <h3>iTrack v1.0</h3>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowHelpModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="app-description">
                Aplicație profesională de tracking GPS pentru șoferi
              </p>
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">🚛</span>
                  <span>GPS tracking în timp real</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Monitorizare curse active</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <span>Status reporting automat</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <span>Background tracking pe Android</span>
                </div>
              </div>
              <div className="modal-footer">
                <p className="copyright">© 2025 EUSC Agency</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleScreen;