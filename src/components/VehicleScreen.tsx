import React, { useState } from 'react';
import { Course } from '../types';
import { getVehicleCourses } from '../services/api';
import { startGPSTracking, stopGPSTracking } from '../services/nativeGPS';
import CourseDetailCard from './CourseDetailCard';

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError('Vă rugăm să introduceți numărul vehiculului');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getVehicleCourses(vehicleNumber, token);
      
      if (!data || data.length === 0) {
        setError('Nu există curse disponibile pentru acest vehicul. Verificați numărul și încercați din nou.');
        setCourses([]);
        setCoursesLoaded(false); // Don't allow proceeding
        return;
      }
      
      setCourses(data);
      setCoursesLoaded(true);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      setError(error.message || 'Eroare la încărcarea curselor. Verificați numărul vehiculului.');
      setCourses([]);
      setCoursesLoaded(false); // Don't allow proceeding on error
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
          uit: course.uit,
          status: status.toString(),
          token: token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCourseAction = async (course: Course, action: 'start' | 'pause' | 'resume' | 'finish') => {
    // Prevent multiple simultaneous actions on same course
    if (actionLoading === course.id) {
      return;
    }

    let newStatus: number;
    
    switch (action) {
      case 'start':
      case 'resume':
        newStatus = 2; // Active
        break;
      case 'pause':
        newStatus = 3; // Paused
        break;
      case 'finish':
        newStatus = 4; // Finished
        break;
      default:
        return;
    }

    const originalStatus = course.status;
    setActionLoading(course.id);

    try {
      // Update course status locally first for immediate UI feedback
      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === course.id ? { ...c, status: newStatus } : c
        )
      );

      console.log(`Handling ${action} for course ${course.id}: ${originalStatus} → ${newStatus}`);

      // Handle GPS tracking first
      if (newStatus === 2) {
        // Start GPS tracking with status
        await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
        console.log(`GPS tracking started for course ${course.id}`);
      } else {
        // Stop GPS tracking
        await stopGPSTracking(course.id);
        console.log(`GPS tracking stopped for course ${course.id}`);
      }

      // Send status to server after GPS is handled
      await sendStatusToServer(course, newStatus);
      console.log(`Status updated on server for course ${course.id}: ${newStatus}`);

    } catch (error) {
      console.error(`Error handling ${action} for course ${course.id}:`, error);
      
      // Revert status change on error
      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === course.id ? { ...c, status: originalStatus } : c
        )
      );
      
      // Show error to user
      setError(`Eroare la ${action === 'start' ? 'pornirea' : action === 'pause' ? 'pauzarea' : action === 'resume' ? 'reluarea' : 'finalizarea'} cursei: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVehicleChange = () => {
    setCoursesLoaded(false);
    setCourses([]);
    setVehicleNumber('');
    setError('');
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

  // Vehicle number input screen
  if (!coursesLoaded) {
    return (
      <div className="modern-app">
        <div className="vehicle-input-screen">
          <div className="vehicle-input-container">
            <div className="vehicle-input-header">
              <h1 className="vehicle-input-title">Introduceți numărul vehiculului</h1>
              <p className="vehicle-input-subtitle">Pentru a încărca cursele disponibile</p>
            </div>
            
            <div className="vehicle-input-form">
              <div className="input-group">
                <label className="input-label">Numărul vehiculului</label>
                <input
                  type="text"
                  className="vehicle-input"
                  value={vehicleNumber}
                  onChange={(e) => {
                    // Allow only alphanumeric characters and convert to uppercase
                    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    setVehicleNumber(value);
                  }}
                  placeholder="Ex: B123ABC"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLoadCourses();
                    }
                  }}
                />
              </div>
              
              {error && (
                <div className="error-alert">
                  <span className="error-icon">⚠</span>
                  <span className="error-text">{error}</span>
                </div>
              )}
              
              <button
                className="load-courses-btn"
                onClick={handleLoadCourses}
                disabled={loading || !vehicleNumber.trim()}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Se încarcă...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📋</span>
                    <span>Încarcă Cursele</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bottom-actions">
            <button className="logout-btn" onClick={onLogout}>
              <span className="logout-icon">🚪</span>
              <span>Deconectare</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Courses list screen
  return (
    <div className="modern-app">
      <div className="courses-screen">
        <div className="courses-header">
          <div className="vehicle-info">
            <button className="change-vehicle-btn" onClick={handleVehicleChange}>
              <span className="change-icon">🔄</span>
              <span>Schimbă</span>
            </button>
            <div className="vehicle-number">
              <span className="vehicle-icon">🚛</span>
              <span className="vehicle-text">{vehicleNumber}</span>
            </div>
          </div>
          
          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠</span>
              <span className="error-text">{error}</span>
            </div>
          )}
          
          <div className="courses-count">
            <span className="count-number">{courses.length}</span>
            <span className="count-text">transporturi disponibile</span>
          </div>
        </div>
        
        <div className="courses-list">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <div className="course-info">
                  <div className="course-title">
                    <span className="course-icon">🚛</span>
                    <span>Transport marfă</span>
                    <span className="course-arrow">→</span>
                    <span className="course-destination">
                      {course.destination_location || 'DESTINAȚIE'}
                    </span>
                  </div>
                  <div className="course-status">
                    <span className={`status-badge ${course.status === 1 ? 'available' : course.status === 2 ? 'active' : course.status === 3 ? 'paused' : 'finished'}`}>
                      {course.status === 1 ? 'DISPONIBILĂ' : 
                       course.status === 2 ? 'ACTIVĂ' : 
                       course.status === 3 ? 'PAUZATĂ' : 'FINALIZATĂ'}
                    </span>
                  </div>
                </div>
                
                <div className="course-details">
                  <div className="course-uit">
                    <span className="uit-label">UIT:</span>
                    <span className="uit-code">{course.uit}</span>
                  </div>
                </div>
              </div>
              
              <div className="course-actions">
                {course.status === 1 && (
                  <button
                    className="action-btn start-btn"
                    onClick={() => handleCourseAction(course, 'start')}
                    disabled={actionLoading === course.id}
                  >
                    {actionLoading === course.id ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Se pornește...</span>
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">▶</span>
                        <span>Start</span>
                      </>
                    )}
                  </button>
                )}
                
                {course.status === 2 && (
                  <>
                    <button
                      className="action-btn pause-btn"
                      onClick={() => handleCourseAction(course, 'pause')}
                      disabled={actionLoading === course.id}
                    >
                      {actionLoading === course.id ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>Se pauzează...</span>
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">⏸</span>
                          <span>Pauză</span>
                        </>
                      )}
                    </button>
                    <button
                      className="action-btn finish-btn"
                      onClick={() => handleCourseAction(course, 'finish')}
                      disabled={actionLoading === course.id}
                    >
                      {actionLoading === course.id ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>Se finalizează...</span>
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">⏹</span>
                          <span>Finalizează</span>
                        </>
                      )}
                    </button>
                  </>
                )}
                
                {course.status === 3 && (
                  <button
                    className="action-btn resume-btn"
                    onClick={() => handleCourseAction(course, 'resume')}
                    disabled={actionLoading === course.id}
                  >
                    {actionLoading === course.id ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Se reia...</span>
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">▶</span>
                        <span>Continuă</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bottom-navigation">
          <div className="nav-item">
            <span className="nav-icon">❓</span>
            <span className="nav-label">Info</span>
          </div>
          <div className="nav-item" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Ieșire</span>
          </div>
        </div>
        
        <div className="version-footer-bottom">
          <span className="version-text">Versiunea 1807.99</span>
        </div>
      </div>
    </div>
  );
};

export default VehicleScreen;