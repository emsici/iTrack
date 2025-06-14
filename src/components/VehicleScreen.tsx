import React, { useState } from 'react';
import CourseCard from './CourseCard';
import { getVehicleCourses } from '../services/api';
import { Course } from '../types';

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
  const [recentVehicles, setRecentVehicles] = useState<string[]>([]);

  const getStatusDotClass = (status: number) => {
    switch (status) {
      case 1: return 'inactive';
      case 2: return 'active';
      case 3: return 'paused';
      case 4: return 'finished';
      default: return 'inactive';
    }
  };

  const getStatusBadgeModern = (status: number) => {
    switch (status) {
      case 1: return 'inactive';
      case 2: return 'active';
      case 3: return 'paused';
      case 4: return 'finished';
      default: return 'inactive';
    }
  };

  const getStatusTextModern = (status: number) => {
    switch (status) {
      case 1: return 'INACTIV';
      case 2: return 'ACTIV';
      case 3: return 'PAUZĂ';
      case 4: return 'FINALIZAT';
      default: return 'INACTIV';
    }
  };

  const handleLoadCourses = async (vehicleNum?: string) => {
    const targetVehicle = vehicleNum || vehicleNumber;
    
    if (!targetVehicle.trim()) {
      setError('Introduceți numărul de înmatriculare');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const coursesData = await getVehicleCourses(targetVehicle, token);
      setCourses(coursesData);
      setCoursesLoaded(true);
      
      // Update vehicle number if switching
      if (vehicleNum) {
        setVehicleNumber(vehicleNum);
      }
      
      // Add to recent vehicles (avoid duplicates)
      setRecentVehicles(prev => {
        const updated = [targetVehicle, ...prev.filter(v => v !== targetVehicle)];
        return updated.slice(0, 5); // Keep only last 5 vehicles
      });
    } catch (err: any) {
      setError(err.message || 'Eroare la încărcarea curselor');
      setCourses([]);
      setCoursesLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const updateCourseStatus = (courseId: string, newStatus: number) => {
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
      <div className="modern-header">
        <div className="container">
          <div className="header-content">
            <div className="app-info">
              <div className="app-icon">📍</div>
              <div className="app-details">
                <h1 className="app-title">iTrack</h1>
                {coursesLoaded && (
                  <div className="vehicle-info">
                    <span className="vehicle-number">{vehicleNumber}</span>
                    <button 
                      className="edit-vehicle-btn"
                      onClick={() => {
                        setCoursesLoaded(false);
                        setCourses([]);
                        setVehicleNumber('');
                      }}
                      title="Schimbă vehiculul"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="header-actions">
              <button className="help-btn">❓</button>
              <button className="recording-btn">🔴</button>
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                ↗️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row">
          <div className="col-12">
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
                      placeholder="Numărul de înmatriculare (ex: CT01ZZZ, B123XYZ)"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading && vehicleNumber.trim()) {
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

                {coursesLoaded && courses.length > 0 && (
                  <div className="mt-3">
                    <div className="vehicle-info-card">
                      <div className="vehicle-info-content">
                        <div className="vehicle-info-text">
                          <span className="vehicle-badge">🚛 {vehicleNumber}</span>
                          <span className="courses-count">{courses.length} curse disponibile</span>
                        </div>
                        <button
                          className="btn btn-new-vehicle"
                          onClick={() => {
                            setVehicleNumber('');
                            setCourses([]);
                            setCoursesLoaded(false);
                          }}
                        >
                          ➕ Vehicul nou
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Vehicles Quick Switch */}
                {recentVehicles.length > 0 && !coursesLoaded && (
                  <div className="mt-3">
                    <div className="recent-vehicles-section">
                      <h6 className="recent-vehicles-title">🕒 Vehicule recente</h6>
                      <div className="recent-vehicles-grid">
                        {recentVehicles.map((vehicle, index) => (
                          <button
                            key={index}
                            className="btn btn-recent-vehicle"
                            onClick={() => handleLoadCourses(vehicle)}
                            disabled={loading}
                          >
                            {vehicle}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Vehicle Switch when courses are loaded */}
                {coursesLoaded && recentVehicles.length > 1 && (
                  <div className="mt-3">
                    <div className="vehicle-switch-section">
                      <h6 className="switch-title">🔄 Schimbă vehiculul</h6>
                      <div className="vehicle-switch-grid">
                        {recentVehicles.filter(v => v !== vehicleNumber).map((vehicle, index) => (
                          <button
                            key={index}
                            className="btn btn-switch-vehicle"
                            onClick={() => handleLoadCourses(vehicle)}
                            disabled={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <>🚛 {vehicle}</>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger mt-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {coursesLoaded && (
              <div className="row">
                <div className="col-12">
                  <h5 className="mb-3">
                    <i className="fas fa-route me-2"></i>
                    Curse disponibile ({courses.length})
                  </h5>
                  
                  {courses.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      Nu există curse disponibile pentru vehiculul {vehicleNumber}
                    </div>
                  ) : (
                    <div className="row g-3">
                      {courses.map((course) => (
                        <div key={course.id} className="col-12">
                          <CourseCard
                            course={course}
                            vehicleNumber={vehicleNumber}
                            token={token}
                            onStatusUpdate={updateCourseStatus}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleScreen;
