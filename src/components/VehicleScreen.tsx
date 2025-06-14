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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course.id,
          vehicleNumber: vehicleNumber,
          status: status,
          uit: course.uit
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Status sent to server:', result);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleStatusUpdate = async (courseId: string, newStatus: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const originalStatus = course.status;
    setActionLoading(courseId);

    try {
      // Update course status locally first for immediate UI feedback
      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === courseId ? { ...c, status: newStatus } : c
        )
      );

      console.log(`Updating status for course ${courseId}: ${originalStatus} → ${newStatus}`);

      // Handle GPS tracking first
      if (newStatus === 2) {
        // Start GPS tracking with status
        await startGPSTracking(courseId, vehicleNumber, token, course.uit, newStatus);
        console.log(`GPS tracking started for course ${courseId}`);
      } else {
        // Stop GPS tracking
        await stopGPSTracking(courseId);
        console.log(`GPS tracking stopped for course ${courseId}`);
      }

      // Send status to server after GPS is handled
      await sendStatusToServer(course, newStatus);
      console.log(`Status updated on server for course ${courseId}: ${newStatus}`);

    } catch (error) {
      console.error(`Error updating status for course ${courseId}:`, error);
      
      // Revert status change on error
      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === courseId ? { ...c, status: originalStatus } : c
        )
      );
      
      setError(`Eroare la actualizarea statusului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVehicleChange = () => {
    setCoursesLoaded(false);
    setCourses([]);
    setError('');
    setVehicleNumber('');
  };

  // Vehicle input screen
  if (!coursesLoaded) {
    return (
      <div className="modern-app">
        <div className="vehicle-input-screen">
          <div className="input-container">
            <div className="input-header">
              <div className="header-icon">🚛</div>
              <h2 className="header-title">Identificare Vehicul</h2>
              <p className="header-subtitle">Introduceți numărul de înmatriculare</p>
            </div>
            
            <div className="input-form">
              <div className="input-group">
                <label className="input-label">Număr vehicul</label>
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
            <div className="vehicle-spacer"></div>
            <div className="vehicle-number clickable-vehicle" onClick={handleVehicleChange}>
              <span className="vehicle-icon">🚛</span>
              <span className="vehicle-text">{vehicleNumber}</span>
              <span className="edit-hint">✎</span>
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
            <CourseDetailCard
              key={course.id}
              course={course}
              onStatusUpdate={handleStatusUpdate}
              isLoading={actionLoading === course.id}
            />
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