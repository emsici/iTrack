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

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError('Introduceți numărul de înmatriculare');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const coursesData = await getVehicleCourses(vehicleNumber, token);
      setCourses(coursesData);
      setCoursesLoaded(true);
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
      <div className="vehicle-header">
        <div className="container">
          <h1 className="vehicle-title">📍 iTrack</h1>
          <button 
            className="disconnect-btn"
            onClick={handleLogout}
          >
            Deconectare
          </button>
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
                      onClick={handleLoadCourses}
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
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      Vehicul: <strong>{vehicleNumber}</strong> - {courses.length} curse găsite
                      <button 
                        className="btn btn-sm btn-outline-primary ms-3"
                        onClick={() => {
                          setCourses([]);
                          setCoursesLoaded(false);
                          setVehicleNumber('');
                        }}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Vehicul nou
                      </button>
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
