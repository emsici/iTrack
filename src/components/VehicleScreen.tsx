import React, { useState } from 'react';
import { getVehicleCourses } from '../services/api';
import { Course } from '../types';
import CourseCard from './CourseCard';

interface VehicleScreenProps {
  token: string;
  onLogout: () => void;
}

const VehicleScreen: React.FC<VehicleScreenProps> = ({ token, onLogout }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [error, setError] = useState('');

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError('Te rog să introduci numărul vehiculului');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const coursesData = await getVehicleCourses(vehicleNumber, token);
      setCourses(coursesData);
      setCoursesLoaded(true);
      console.log(`Loaded ${coursesData.length} courses for vehicle ${vehicleNumber}`);
    } catch (err: any) {
      setError(err.message || 'Eroare la încărcarea curselor');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
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

  const handleVehicleSwitch = () => {
    setCoursesLoaded(false);
    setCourses([]);
    setVehicleNumber('');
    setError('');
  };

  return (
    <div className="modern-app mobile-safe-area">
      <div className="app-content">
        <div className="content-container">
          {!coursesLoaded ? (
            <div className="modern-card">
              <div className="card-header">
                <div className="card-icon">🚛</div>
                <h2 className="card-title">Selectează Vehiculul</h2>
                <p className="card-subtitle">Introdu numărul vehiculului pentru a vedea cursele active</p>
              </div>
              
              <div className="card-body">
                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}
                
                <div className="input-group">
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Introdu numărul vehiculului (ex: B123XYZ)"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadCourses();
                      }
                    }}
                  />
                  <button
                    className="modern-btn modern-btn-primary"
                    onClick={handleLoadCourses}
                    disabled={loading || !vehicleNumber.trim()}
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      '🔍 Încarcă Cursele'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="courses-container">
              <div className="vehicle-header">
                <div className="vehicle-info">
                  <h2 className="vehicle-title">🚛 {vehicleNumber}</h2>
                  <p className="course-count">{courses.length} curse găsite</p>
                </div>
                <button
                  className="modern-btn modern-btn-secondary"
                  onClick={handleVehicleSwitch}
                >
                  🔄 Schimbă Vehicul
                </button>
              </div>

              <div className="courses-grid">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    vehicleNumber={vehicleNumber}
                    token={token}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="app-footer">
        <div className="footer-content">
          <div className="app-branding">
            <span className="brand-icon">📍</span>
            <span className="brand-name">iTrack</span>
          </div>
          <button
            className="modern-btn modern-btn-logout"
            onClick={onLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleScreen;