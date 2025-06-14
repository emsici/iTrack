import React, { useState } from 'react';
import { Course } from '../types';
import { getVehicleCourses } from '../services/api';
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
          course_id: course.id,
          status: status.toString(),
          vehicle_number: vehicleNumber,
          uit: course.uit
        }).toString()
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.text();
      console.log('Status update response:', result);
    } catch (error) {
      console.error('Error sending status to server:', error);
      throw error;
    }
  };

  const handleStatusUpdate = (courseId: string, newStatus: number) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, status: newStatus }
        : course
    ));
  };

  return (
    <div className="app">
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
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
                  <div className="vehicle-status-info">
                    <div className="courses-count">
                      {courses.length} transporturi disponibile
                    </div>
                    {courses.some(course => course.status === 2) && (
                      <div className="gps-tracking-status">
                        <span className="gps-indicator">📍</span>
                        <span className="gps-text">GPS Tracking Activ (60s interval)</span>
                        <span className="gps-pulse"></span>
                      </div>
                    )}
                  </div>
                </div>
                  
                {courses.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Nu există curse disponibile pentru acest vehicul.
                  </div>
                ) : (
                  <>
                    <div className="courses-list">
                      {courses.map((course) => (
                        <div key={course.id} className="course-item">
                          <CourseCard
                            course={course}
                            vehicleNumber={vehicleNumber}
                            token={token}
                            onStatusUpdate={handleStatusUpdate}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Link simplu de ieșire sub curse */}
                    <div className="logout-section">
                      <button 
                        className="logout-link"
                        onClick={onLogout}
                      >
                        Ieșire din cont
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleScreen;