import React, { useState } from 'react';
import { Course } from '../types';
import { getVehicleCourses } from '../services/api';
import { startGPSTracking, stopGPSTracking } from '../services/nativeGPS';
import CourseDetailCard from './CourseDetailCard';
import '../styles/animations.css';

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

      // Handle GPS tracking based on status change
      if (newStatus === 2 && originalStatus !== 2) {
        // Starting course - start GPS tracking
        console.log(`Starting GPS tracking for course ${courseId} with UIT ${course.uit}`);
        await startGPSTracking(courseId, vehicleNumber, token, course.uit, newStatus);
      } else if (newStatus === 3 && originalStatus === 2) {
        // Pausing course - update GPS status but keep tracking
        console.log(`Pausing GPS tracking for course ${courseId} with UIT ${course.uit}`);
        await stopGPSTracking(courseId);
        await startGPSTracking(courseId, vehicleNumber, token, course.uit, newStatus);
      } else if (newStatus === 4) {
        // Stopping course - stop GPS tracking completely
        console.log(`Stopping GPS tracking for course ${courseId} with UIT ${course.uit}`);
        await stopGPSTracking(courseId);
      } else if (newStatus === 2 && originalStatus === 3) {
        // Resuming from pause - restart GPS tracking
        console.log(`Resuming GPS tracking for course ${courseId} with UIT ${course.uit}`);
        await startGPSTracking(courseId, vehicleNumber, token, course.uit, newStatus);
      }

      // Send status to server
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
      <div className="vehicle-input-container">
        <style>
          {`
            .vehicle-input-container {
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              position: relative;
              overflow: hidden;
            }

            .vehicle-input-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
              pointer-events: none;
            }

            .vehicle-card {
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(20px);
              border-radius: 20px;
              padding: 40px;
              width: 100%;
              max-width: 450px;
              box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              position: relative;
              z-index: 1;
            }

            .vehicle-header {
              text-align: center;
              margin-bottom: 40px;
            }

            .vehicle-logo {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #4f46e5, #06b6d4);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
            }

            .vehicle-logo i {
              font-size: 2rem;
              color: white;
            }

            .vehicle-title {
              font-size: 2.5rem;
              font-weight: 700;
              color: white;
              margin-bottom: 8px;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            .vehicle-subtitle {
              font-size: 1.1rem;
              color: rgba(255, 255, 255, 0.8);
              font-weight: 400;
            }

            .vehicle-form {
              display: flex;
              flex-direction: column;
              gap: 25px;
            }

            .vehicle-form-group {
              position: relative;
            }

            .vehicle-form-input {
              width: 100%;
              padding: 16px 20px 16px 50px;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.1);
              color: white;
              font-size: 1.1rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
              text-align: center;
            }

            .vehicle-form-input::placeholder {
              color: rgba(255, 255, 255, 0.6);
              text-transform: none;
              letter-spacing: normal;
              font-weight: 400;
            }

            .vehicle-form-input:focus {
              outline: none;
              border-color: rgba(255, 255, 255, 0.6);
              background: rgba(255, 255, 255, 0.15);
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
              transform: translateY(-2px);
            }

            .vehicle-input-icon {
              position: absolute;
              left: 16px;
              top: 50%;
              transform: translateY(-50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 1.2rem;
              pointer-events: none;
            }

            .vehicle-load-button {
              background: linear-gradient(135deg, #4f46e5, #06b6d4);
              color: white;
              border: none;
              padding: 18px 24px;
              border-radius: 12px;
              font-size: 1.1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-top: 10px;
              box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
            }

            .vehicle-load-button:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
            }

            .vehicle-load-button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
            }

            .vehicle-loading-spinner {
              width: 20px;
              height: 20px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-top: 2px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .vehicle-error-alert {
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.3);
              border-radius: 12px;
              padding: 16px;
              display: flex;
              align-items: center;
              gap: 12px;
              backdrop-filter: blur(10px);
            }

            .vehicle-error-icon {
              color: #ef4444;
              font-size: 1.2rem;
            }

            .vehicle-error-text {
              color: white;
              font-weight: 500;
              flex: 1;
            }

            .vehicle-footer-actions {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(20px);
              border-top: 1px solid rgba(255, 255, 255, 0.2);
              padding: 20px;
              display: flex;
              justify-content: center;
            }

            .vehicle-logout-button {
              background: rgba(239, 68, 68, 0.2);
              border: 1px solid rgba(239, 68, 68, 0.3);
              color: white;
              padding: 12px 24px;
              border-radius: 12px;
              font-size: 1rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              backdrop-filter: blur(10px);
            }

            .vehicle-logout-button:hover {
              background: rgba(239, 68, 68, 0.3);
              transform: translateY(-2px);
            }

            @media (max-width: 768px) {
              .vehicle-card {
                margin: 20px;
                padding: 30px 20px;
              }
              
              .vehicle-title {
                font-size: 2rem;
              }
            }
          `}
        </style>
        
        <div className="vehicle-card">
          <div className="vehicle-header">
            <div className="vehicle-logo">
              <i className="fas fa-truck"></i>
            </div>
            <h1 className="vehicle-title">iTrack</h1>
            <p className="vehicle-subtitle">Selectați Vehiculul de Transport</p>
          </div>

          <div className="vehicle-form">
            {error && (
              <div className="vehicle-error-alert">
                <i className="fas fa-exclamation-triangle vehicle-error-icon"></i>
                <span className="vehicle-error-text">{error}</span>
              </div>
            )}

            <div className="vehicle-form-group">
              <i className="fas fa-truck vehicle-input-icon"></i>
              <input
                type="text"
                className="vehicle-form-input"
                value={vehicleNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  setVehicleNumber(value);
                }}
                placeholder="Numărul de înmatriculare (ex: B123ABC)"
                disabled={loading}
                maxLength={10}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadCourses();
                  }
                }}
              />
            </div>
            
            <button
              className="vehicle-load-button"
              onClick={handleLoadCourses}
              disabled={loading || !vehicleNumber.trim()}
            >
              {loading ? (
                <>
                  <div className="vehicle-loading-spinner"></div>
                  <span>Căutare curse în progres...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i>
                  <span>Încarcă Transporturile</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="vehicle-footer-actions">
          <button className="vehicle-logout-button" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Deconectare</span>
          </button>
        </div>
      </div>
    );
  }

  // Courses list screen
  return (
    <div className="courses-container">
      <style>
        {`
          .courses-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #1e3c72 100%);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
            position: relative;
            overflow-x: hidden;
          }
          
          .courses-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(79, 70, 229, 0.2) 0%, transparent 50%);
            animation: backgroundFloat 25s ease-in-out infinite;
            pointer-events: none;
          }

          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .courses-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(25px);
            color: #1e3c72;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }

          .vehicle-header-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .vehicle-display {
            display: flex;
            align-items: center;
            gap: 15px;
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(124, 58, 237, 0.2));
            padding: 15px 25px;
            border-radius: 20px;
            backdrop-filter: blur(15px);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }

          .vehicle-display:hover {
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(124, 58, 237, 0.3));
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 40px rgba(79, 70, 229, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
          }

          .vehicle-display:active {
            animation: buttonPress 0.2s ease;
          }

          .vehicle-display i {
            font-size: 1.5rem;
          }

          .vehicle-number-text {
            font-size: 1.2rem;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .vehicle-edit-icon {
            opacity: 0.7;
            font-size: 0.9rem;
          }

          .courses-stats {
            text-align: center;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
            padding: 20px;
            border-radius: 20px;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.4s ease;
            cursor: pointer;
          }

          .courses-stats:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 12px 30px rgba(16, 185, 129, 0.2);
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3));
          }

          .stats-number {
            font-size: 2.5rem;
            font-weight: 800;
            display: block;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #059669, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: countUp 1s ease-out;
          }

          .stats-label {
            font-size: 1rem;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            color: #1e3c72;
          }

          .courses-content {
            padding: 20px 20px 120px 20px;
            max-width: 1200px;
            margin: 0 auto;
            min-height: calc(100vh - 200px);
          }

          .courses-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: 1fr;
          }

          .courses-error-alert {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
          }

          .courses-error-icon {
            color: #ef4444;
            font-size: 1.2rem;
          }

          .courses-error-text {
            color: #7f1d1d;
            font-weight: 500;
            flex: 1;
          }

          .courses-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            padding: 15px 20px calc(15px + env(safe-area-inset-bottom, 20px)) 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }

          .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            padding: 10px 15px;
            border: none;
            background: none;
            color: #64748b;
            cursor: pointer;
            border-radius: 12px;
            transition: all 0.3s ease;
            min-width: 70px;
          }

          .nav-button:hover {
            background: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
            transform: translateY(-2px);
          }

          .nav-button i {
            font-size: 1.2rem;
          }

          .nav-button-label {
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .logout-nav-button {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
          }

          .logout-nav-button:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #dc2626;
          }

          .version-info-bottom {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            color: #94a3b8;
            font-size: 0.8rem;
            background: rgba(255, 255, 255, 0.8);
            padding: 5px 15px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }

          @media (max-width: 768px) {
            .courses-content {
              padding: 15px 15px 140px 15px;
            }
            
            .courses-header {
              padding: 20px 15px;
            }
            
            .vehicle-header-info {
              flex-direction: column;
              gap: 15px;
              align-items: stretch;
            }
            
            .vehicle-display {
              padding: 12px 20px;
            }
            
            .vehicle-number-text {
              font-size: 1.1rem;
            }
            
            .stats-number {
              font-size: 2rem;
            }
            
            .courses-bottom-nav {
              padding: 12px 15px calc(12px + env(safe-area-inset-bottom, 25px)) 15px;
            }
            
            .nav-button {
              min-width: 60px;
              padding: 8px 10px;
            }
            
            .nav-button i {
              font-size: 1.1rem;
            }
            
            .nav-button-label {
              font-size: 0.7rem;
            }
          }

          @media (max-width: 480px) {
            .courses-content {
              padding: 10px 10px 150px 10px;
            }
            
            .courses-header {
              padding: 15px 10px;
            }
            
            .vehicle-display {
              padding: 10px 15px;
              gap: 10px;
            }
            
            .vehicle-number-text {
              font-size: 1rem;
            }
            
            .stats-number {
              font-size: 1.8rem;
            }
            
            .stats-label {
              font-size: 0.9rem;
            }
            
            .courses-bottom-nav {
              padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 30px)) 10px;
            }
          }

          @media (min-width: 1024px) {
            .courses-content {
              padding: 30px 30px 100px 30px;
            }
            
            .courses-header {
              padding: 30px;
            }
            
            .courses-grid {
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
              gap: 25px;
            }
          }
            
            .courses-header {
              padding: 15px;
            }
          }

          @media (min-width: 768px) {
            .courses-grid {
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            }
          }
        `}
      </style>
      
      <div className="courses-header">
        <div className="vehicle-header-info">
          <div className="vehicle-display" onClick={handleVehicleChange}>
            <i className="fas fa-truck"></i>
            <span className="vehicle-number-text">{vehicleNumber}</span>
            <i className="fas fa-edit vehicle-edit-icon"></i>
          </div>
          
          <div className="courses-stats">
            <span className="stats-number">{courses.length}</span>
            <span className="stats-label">Transporturi Active</span>
          </div>
        </div>
      </div>

      <div className="courses-content">
        {error && (
          <div className="courses-error-alert">
            <i className="fas fa-exclamation-triangle courses-error-icon"></i>
            <span className="courses-error-text">{error}</span>
          </div>
        )}
        
        <div className="courses-grid">
          {courses.map((course) => (
            <CourseDetailCard
              key={course.id}
              course={course}
              onStatusUpdate={handleStatusUpdate}
              isLoading={actionLoading === course.id}
            />
          ))}
        </div>
      </div>
      
      <div className="courses-bottom-nav">
        <button className="nav-button">
          <i className="fas fa-info-circle"></i>
          <span className="nav-button-label">Info</span>
        </button>
        
        <button className="nav-button">
          <i className="fas fa-chart-bar"></i>
          <span className="nav-button-label">Statistici</span>
        </button>
        
        <button className="nav-button logout-nav-button" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span className="nav-button-label">Ieșire</span>
        </button>
      </div>
      
      <div className="version-info-bottom">
        Versiunea 1807.99
      </div>
    </div>
  );
};

export default VehicleScreen;