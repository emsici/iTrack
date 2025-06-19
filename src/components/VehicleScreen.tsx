import React, { useState } from 'react';
import { Course } from '../types';
import { getVehicleCourses, logout } from '../services/api';
import { startGPSTracking, stopGPSTracking } from '../services/directAndroidGPS';
import { clearToken } from '../services/storage';
import CourseDetailCard from './CourseDetailCard';
import '../styles/newVehicleScreen.css';

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
  const [showInfo, setShowInfo] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const handleLoadCourses = async () => {
    if (!vehicleNumber.trim()) {
      setError('Introduceți numărul vehiculului');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getVehicleCourses(vehicleNumber, token);
      
      if (!data || data.length === 0) {
        setError('Nu există curse disponibile pentru acest vehicul');
        setCourses([]);
        setCoursesLoaded(false);
        return;
      }
      
      setCourses(data);
      setCoursesLoaded(true);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      setError(error.message || 'Eroare la încărcarea curselor');
      setCourses([]);
      setCoursesLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = async (course: Course, action: 'start' | 'pause' | 'resume' | 'finish') => {
    setActionLoading(course.id);
    
    try {
      let newStatus: number;
      
      switch (action) {
        case 'start':
        case 'resume':
          newStatus = 2; // active
          console.log(`🚀 Starting GPS tracking for course ${course.id}`);
          await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
          break;
        case 'pause':
          newStatus = 3; // paused
          console.log(`⏸️ Pausing GPS tracking for course ${course.id}`);
          // Update status but keep GPS running
          break;
        case 'finish':
          newStatus = 4; // finished
          console.log(`🏁 Stopping GPS tracking for course ${course.id}`);
          await stopGPSTracking(course.id);
          break;
        default:
          return;
      }

      // Update course status locally
      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === course.id ? { ...c, status: newStatus } : c
        )
      );

      console.log(`Course ${course.id} status updated to ${newStatus}`);
      
    } catch (error) {
      console.error(`Failed to ${action} course:`, error);
      setError(`Eroare la ${action === 'start' ? 'pornirea' : action === 'pause' ? 'pauza' : action === 'resume' ? 'reluarea' : 'oprirea'} cursei`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(token);
      await clearToken();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Disponibilă';
      case 2: return 'În progres';
      case 3: return 'Pauză';
      case 4: return 'Finalizată';
      default: return 'Necunoscută';
    }
  };

  const getStatusClass = (status: number) => {
    switch (status) {
      case 1: return 'status-1';
      case 2: return 'status-2';
      case 3: return 'status-3';
      case 4: return 'status-4';
      default: return 'status-1';
    }
  };

  const renderCourseActions = (course: Course) => {
    const isLoading = actionLoading === course.id;
    
    if (course.status === 1) {
      return (
        <button
          className="action-btn-new btn-start"
          onClick={() => handleCourseAction(course, 'start')}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <i className="fas fa-play"></i>
              Pornește
            </>
          )}
        </button>
      );
    }
    
    if (course.status === 2) {
      return (
        <>
          <button
            className="action-btn-new btn-pause"
            onClick={() => handleCourseAction(course, 'pause')}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <i className="fas fa-pause"></i>
                Pauză
              </>
            )}
          </button>
          <button
            className="action-btn-new btn-finish"
            onClick={() => handleCourseAction(course, 'finish')}
            disabled={isLoading}
          >
            <i className="fas fa-stop"></i>
            Finalizează
          </button>
        </>
      );
    }
    
    if (course.status === 3) {
      return (
        <button
          className="action-btn-new btn-resume"
          onClick={() => handleCourseAction(course, 'resume')}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <i className="fas fa-play"></i>
              Reia
            </>
          )}
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="vehicle-screen">
      {!coursesLoaded ? (
        <div className="vehicle-header">
          <h1 className="vehicle-title">
            <i className="fas fa-truck me-3"></i>
            iTrack GPS
          </h1>
          
          <div className="vehicle-input-group">
            <input
              type="text"
              className="vehicle-input"
              placeholder="Numărul vehiculului (ex: B123ABC)"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleLoadCourses()}
            />
            <button
              className="load-courses-btn"
              onClick={handleLoadCourses}
              disabled={loading || !vehicleNumber.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Încărcare...
                </>
              ) : (
                <>
                  <i className="fas fa-search me-2"></i>
                  Găsește Curse
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="error-message-new">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="courses-container">
          <div className="vehicle-header">
            <h1 className="vehicle-title">
              <span 
                onClick={() => {
                  setCoursesLoaded(false);
                  setCourses([]);
                  setVehicleNumber('');
                }}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                {vehicleNumber}
              </span>
            </h1>
          </div>

          {error && (
            <div className="error-message-new">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card-new">
                <div className="course-header-new">
                  <div className="course-uit">
                    UIT: {course.uit}
                  </div>
                  <div className={`course-status-badge ${getStatusClass(course.status)}`}>
                    {getStatusText(course.status)}
                  </div>
                </div>

                <div className="course-info-new">
                  {course.departure_location && course.destination_location && (
                    <div className="course-route">
                      <i className="fas fa-route"></i>
                      <span>{course.departure_location} → {course.destination_location}</span>
                    </div>
                  )}
                  
                  <div className="course-details">
                    {course.ikRoTrans && (
                      <div className="detail-item">
                        <i className="fas fa-hashtag"></i>
                        <span>ID: {course.ikRoTrans}</span>
                      </div>
                    )}
                    {course.codDeclarant && (
                      <div className="detail-item">
                        <i className="fas fa-user"></i>
                        <span>Cod: {course.codDeclarant}</span>
                      </div>
                    )}
                    {course.dataTransport && (
                      <div className="detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>{new Date(course.dataTransport).toLocaleDateString('ro-RO')}</span>
                      </div>
                    )}
                    {course.nrVehicul && (
                      <div className="detail-item">
                        <i className="fas fa-truck"></i>
                        <span>{course.nrVehicul}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="course-actions-new">
                  {renderCourseActions(course)}
                  <button
                    className="action-btn-new btn-info"
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  >
                    <i className="fas fa-info"></i>
                  </button>
                </div>

                {expandedCourse === course.id && (
                  <CourseDetailCard
                    course={course}
                    onStatusUpdate={() => {}}
                    isLoading={false}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '16px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          zIndex: 1000
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '400px', margin: '0 auto' }}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <i className="fas fa-info-circle" style={{ fontSize: '20px' }}></i>
            <span>Info</span>
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#e74c3c',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ fontSize: '20px' }}></i>
            <span>Ieșire</span>
          </button>
        </div>
      </div>

      {showInfo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowInfo(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>iTrack GPS</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
              Aplicație profesională pentru urmărirea vehiculelor în timp real
            </p>
            <p style={{ color: '#95a5a6', fontSize: '14px' }}>
              Vehicul activ: {vehicleNumber}<br/>
              Curse încărcate: {courses.length}<br/>
              Versiunea 1.0
            </p>
            <button
              onClick={() => setShowInfo(false)}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                marginTop: '20px',
                cursor: 'pointer'
              }}
            >
              Închide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleScreen;