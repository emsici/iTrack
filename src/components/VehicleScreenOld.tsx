import React, { useState } from 'react';
import { Course } from '../types';
import { getVehicleCourses, logout } from '../services/api';
import { startGPSTracking, stopGPSTracking } from '../services/directAndroidGPS';
import { clearToken } from '../services/storage';
import CourseDetailCard from './CourseDetailCard';
import '../styles/animations.css';
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
  const [infoClickCount, setInfoClickCount] = useState(0);
  const [showDebugPrompt, setShowDebugPrompt] = useState(false);
  const [debugPassword, setDebugPassword] = useState('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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

      console.log(`Status updated locally for course ${courseId}: ${newStatus}`);

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

  const handleLogout = async () => {
    try {
      // Send logout request to server
      await logout(token);
      
      // Clear all stored data
      await clearToken();
      
      // Redirect to login
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear local data even if server request fails
      await clearToken();
      onLogout();
    }
  };

  const handleInfoClick = () => {
    setInfoClickCount(prev => {
      const newCount = prev + 1;
      
      if (newCount >= 20) {
        setShowDebugPrompt(true);
        setInfoClickCount(0);
        return 0;
      } else if (newCount < 10) {
        // Normal info functionality for first 9 clicks
        setShowInfo(true);
      } else if (newCount === 10) {
        // Show info modal with counter at 10
        setShowInfo(true);
      }
      // For clicks 11-19, just increment counter without showing modal
      
      return newCount;
    });
  };

  const handleDebugPasswordSubmit = () => {
    if (debugPassword === 'parola123') {
      setShowDebugPanel(true);
      setShowDebugPrompt(false);
      setDebugPassword('');
    } else {
      alert('Parolă incorectă');
      setDebugPassword('');
    }
  };

  const closeDebugPanel = () => {
    setShowDebugPanel(false);
  };

  // Vehicle input screen
  if (!coursesLoaded) {
    return (
      <div className="vehicle-input-container">
        <style>
          {`
            .vehicle-input-container {
              min-height: 100vh;
              min-height: 100dvh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: calc(env(safe-area-inset-top, 0px) + 40px) env(safe-area-inset-right) max(20px, env(safe-area-inset-bottom)) env(safe-area-inset-left);
              position: relative;
              overflow: hidden;
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

            @media (max-width: 768px) {
              .vehicle-card {
                padding: 40px 30px;
                margin: 15px;
                max-width: calc(100vw - 30px);
                border-radius: 20px;
              }
              
              .vehicle-title {
                font-size: 2rem;
              }
              
              .vehicle-subtitle {
                font-size: 1rem;
              }
              
              .vehicle-form-input {
                padding: 16px 20px 16px 50px;
                font-size: 1.1rem;
                letter-spacing: 1px;
              }
              
              .vehicle-load-button {
                padding: 18px 25px;
                font-size: 1.1rem;
              }
              
              .vehicle-logo {
                width: 70px;
                height: 70px;
              }
              
              .vehicle-logo i {
                font-size: 1.8rem;
              }
            }

            @media (max-width: 480px) {
              .vehicle-input-container {
                padding: calc(env(safe-area-inset-top, 0px) + 40px) 15px max(15px, env(safe-area-inset-bottom)) 15px;
              }
              
              .vehicle-card {
                padding: 35px 25px;
                margin: 10px;
              }
              
              .vehicle-title {
                font-size: 1.8rem;
              }
              
              .vehicle-header {
                margin-bottom: 35px;
              }
              
              .vehicle-form {
                gap: 20px;
              }
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
          <button className="vehicle-logout-button" onClick={handleLogout}>
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
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(30px);
            color: #1e3c72;
            padding: calc(env(safe-area-inset-top, 0px) + 30px) 25px 30px 25px;
            box-shadow: 
              0 12px 40px rgba(0, 0, 0, 0.1),
              0 4px 12px rgba(79, 70, 229, 0.05);
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 2px solid rgba(79, 70, 229, 0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideInDown 0.6s ease-out;
          }

          .courses-header:hover {
            background: rgba(255, 255, 255, 1);
            box-shadow: 
              0 16px 50px rgba(0, 0, 0, 0.12),
              0 6px 15px rgba(79, 70, 229, 0.1);
          }

          @keyframes slideInDown {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
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
            gap: 18px;
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(124, 58, 237, 0.25), rgba(16, 185, 129, 0.15));
            background-size: 200% 200%;
            padding: 18px 30px;
            border-radius: 25px;
            backdrop-filter: blur(20px);
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.4);
            box-shadow: 
              0 12px 35px rgba(0, 0, 0, 0.1),
              0 4px 12px rgba(79, 70, 229, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            position: relative;
            overflow: hidden;
            animation: gradientShift 4s ease infinite;
          }

          .vehicle-display:hover {
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(124, 58, 237, 0.4), rgba(16, 185, 129, 0.3));
            transform: translateY(-5px) scale(1.03);
            background-position: 100% 0%;
            box-shadow: 
              0 20px 50px rgba(79, 70, 229, 0.25),
              0 8px 20px rgba(124, 58, 237, 0.2),
              0 4px 12px rgba(16, 185, 129, 0.15);
            border-color: rgba(255, 255, 255, 0.6);
          }

          .vehicle-display::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: all 0.6s ease;
          }

          .vehicle-display:hover::before {
            left: 100%;
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
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25), rgba(6, 182, 212, 0.15));
            background-size: 200% 200%;
            padding: 25px 20px;
            border-radius: 25px;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.4);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            animation: gradientShift 6s ease infinite;
            box-shadow: 
              0 12px 30px rgba(16, 185, 129, 0.15),
              0 4px 12px rgba(5, 150, 105, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          .courses-stats:hover {
            transform: translateY(-6px) scale(1.05);
            background-position: 100% 0%;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.4), rgba(6, 182, 212, 0.3));
            box-shadow: 
              0 20px 45px rgba(16, 185, 129, 0.25),
              0 8px 20px rgba(5, 150, 105, 0.2),
              0 4px 12px rgba(6, 182, 212, 0.15);
            border-color: rgba(255, 255, 255, 0.6);
          }

          .courses-stats::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: all 0.8s ease;
          }

          .courses-stats:hover::before {
            left: 100%;
          }

          .stats-number {
            font-size: 3rem;
            font-weight: 900;
            display: block;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #059669, #10b981, #06b6d4);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: countUp 1.2s ease-out, gradientShift 3s ease infinite;
            transition: all 0.4s ease;
            position: relative;
          }

          .courses-stats:hover .stats-number {
            font-size: 3.2rem;
            transform: scale(1.1);
            text-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
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
            padding: 20px 20px 200px 20px;
            max-width: 1200px;
            margin: 0 auto;
            min-height: calc(100vh - 200px);
          }

          .courses-grid {
            display: grid;
            gap: 25px;
            grid-template-columns: 1fr;
            animation: fadeInUp 0.8s ease-out;
          }

          .courses-grid > * {
            animation: slideInUp 0.6s ease-out;
            animation-fill-mode: both;
          }

          .courses-grid > *:nth-child(1) { animation-delay: 0.1s; }
          .courses-grid > *:nth-child(2) { animation-delay: 0.2s; }
          .courses-grid > *:nth-child(3) { animation-delay: 0.3s; }
          .courses-grid > *:nth-child(4) { animation-delay: 0.4s; }
          .courses-grid > *:nth-child(5) { animation-delay: 0.5s; }
          .courses-grid > *:nth-child(6) { animation-delay: 0.6s; }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInUp {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
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
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(25px);
            border-top: 2px solid rgba(79, 70, 229, 0.1);
            padding: 18px 20px calc(18px + env(safe-area-inset-bottom, 20px)) 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            box-shadow: 
              0 -8px 30px rgba(0, 0, 0, 0.12),
              0 -2px 8px rgba(79, 70, 229, 0.05);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: slideInUp 0.5s ease-out;
          }

          .courses-bottom-nav:hover {
            background: rgba(255, 255, 255, 1);
            box-shadow: 
              0 -12px 40px rgba(0, 0, 0, 0.15),
              0 -4px 12px rgba(79, 70, 229, 0.1);
          }

          .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 12px 18px;
            border: none;
            background: rgba(79, 70, 229, 0.05);
            color: #64748b;
            cursor: pointer;
            border-radius: 16px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 80px;
            position: relative;
            overflow: hidden;
            border: 2px solid transparent;
          }

          .nav-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.1), transparent);
            transition: all 0.6s ease;
          }

          .nav-button:hover {
            background: rgba(79, 70, 229, 0.15);
            color: #4f46e5;
            transform: translateY(-4px) scale(1.05);
            border-color: rgba(79, 70, 229, 0.3);
            box-shadow: 
              0 8px 25px rgba(79, 70, 229, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .nav-button:hover::before {
            left: 100%;
          }

          .nav-button:active {
            transform: translateY(-1px) scale(0.98);
            transition: all 0.1s ease;
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
            border-color: rgba(239, 68, 68, 0.2);
          }

          .logout-nav-button:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #dc2626;
            transform: translateY(-4px) scale(1.05);
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 
              0 8px 25px rgba(239, 68, 68, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .logout-nav-button::before {
            background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
          }

          .version-info-bottom {
            position: fixed;
            bottom: 130px;
            left: 50%;
            transform: translateX(-50%);
            color: #1e3c72;
            font-size: 1rem;
            font-weight: 700;
            background: rgba(255, 255, 255, 0.98);
            padding: 12px 25px;
            border-radius: 30px;
            backdrop-filter: blur(20px);
            cursor: pointer;
            user-select: none;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001;
            border: 2px solid rgba(79, 70, 229, 0.4);
            box-shadow: 
              0 12px 35px rgba(0, 0, 0, 0.15),
              0 4px 12px rgba(79, 70, 229, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% {
              box-shadow: 
                0 12px 35px rgba(0, 0, 0, 0.15),
                0 4px 12px rgba(79, 70, 229, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            }
            50% {
              box-shadow: 
                0 16px 45px rgba(0, 0, 0, 0.2),
                0 6px 16px rgba(79, 70, 229, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            }
          }

          .version-info-bottom:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateX(-50%) scale(1.1) translateY(-3px);
            border-color: rgba(79, 70, 229, 0.6);
            box-shadow: 
              0 20px 50px rgba(79, 70, 229, 0.3),
              0 8px 20px rgba(0, 0, 0, 0.2),
              inset 0 2px 0 rgba(255, 255, 255, 0.6);
            animation: none;
          }

          .version-info-bottom:active {
            transform: translateX(-50%) scale(1.05) translateY(-1px);
            transition: all 0.1s ease;
          }

          .debug-prompt-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .debug-prompt-content {
            background: white;
            border-radius: 15px;
            padding: 25px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .debug-prompt-content h3 {
            margin: 0 0 15px 0;
            color: #1e3c72;
            font-size: 1.2rem;
          }

          .debug-prompt-content p {
            margin: 0 0 20px 0;
            color: #64748b;
            font-size: 0.9rem;
          }

          .debug-password-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            margin-bottom: 20px;
            outline: none;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
          }

          .debug-password-input:focus {
            border-color: #4f46e5;
          }

          .debug-prompt-buttons {
            display: flex;
            gap: 10px;
          }

          .debug-submit-btn, .debug-cancel-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .debug-submit-btn {
            background: #4f46e5;
            color: white;
          }

          .debug-submit-btn:hover {
            background: #4338ca;
          }

          .debug-cancel-btn {
            background: #f1f5f9;
            color: #64748b;
          }

          .debug-cancel-btn:hover {
            background: #e2e8f0;
          }

          .mobile-debug-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 3000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 10px;
            overflow-y: auto;
          }

          .mobile-debug-panel {
            background: #1a1a1a;
            color: #e2e8f0;
            border-radius: 12px;
            width: 100%;
            max-width: 500px;
            margin-top: 20px;
            max-height: calc(100vh - 40px);
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }

          .debug-header {
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2d2d2d;
            border-radius: 12px 12px 0 0;
          }

          .debug-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #00ff88;
          }

          .debug-close-btn {
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
          }

          .debug-close-btn:hover {
            background: #cc3333;
            transform: scale(1.1);
          }

          .debug-content {
            padding: 20px;
            flex: 1;
            overflow-y: auto;
          }

          .debug-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background: #2d2d2d;
            border-radius: 8px;
            font-size: 0.85rem;
          }

          .debug-indicator {
            color: #00ff88;
            font-weight: 600;
          }

          .debug-platform {
            color: #94a3b8;
          }

          .debug-log-output {
            background: #0f0f0f;
            border-radius: 8px;
            padding: 15px;
            height: 250px;
            overflow-y: auto;
            margin-bottom: 15px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.8rem;
            border: 1px solid #333;
          }

          .debug-log-item {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #222;
          }

          .log-time {
            color: #64748b;
            min-width: 60px;
            font-size: 0.75rem;
          }

          .log-level {
            min-width: 50px;
            font-weight: 600;
            font-size: 0.75rem;
            color: #3b82f6;
          }

          .debug-log-item.warn .log-level {
            color: #f59e0b;
          }

          .debug-log-item.error .log-level {
            color: #ef4444;
          }

          .log-message {
            flex: 1;
            color: #e2e8f0;
            font-size: 0.8rem;
          }

          .debug-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .debug-action-btn {
            padding: 8px 15px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .debug-action-btn:hover {
            background: #4338ca;
            transform: translateY(-1px);
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

          /* Info Modal Styles */
          .info-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }

          .info-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(25px);
            border-radius: 20px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: slideInUp 0.3s ease;
          }

          .info-header {
            padding: 20px 25px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .info-header h3 {
            margin: 0;
            color: #1e3c72;
            font-size: 1.3rem;
            font-weight: 700;
          }

          .info-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            color: #64748b;
            cursor: pointer;
            padding: 5px;
            border-radius: 5px;
            transition: all 0.3s ease;
          }

          .info-close:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #1e3c72;
          }

          .info-body {
            padding: 20px 25px;
          }

          .info-section {
            margin-bottom: 20px;
          }

          .info-section:last-child {
            margin-bottom: 0;
          }

          .info-section h4 {
            color: #1e3c72;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .info-section h4 i {
            color: #4f46e5;
          }

          .info-section p {
            margin: 5px 0;
            color: #64748b;
            line-height: 1.5;
          }

          .info-section strong {
            color: #1e3c72;
          }

          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes slideInUp {
            0% {
              transform: translateY(30px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @media (max-width: 480px) {
            .info-content {
              margin: 10px;
              max-height: 85vh;
            }
            
            .info-header {
              padding: 15px 20px;
            }
            
            .info-body {
              padding: 15px 20px;
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
        <button className="nav-button" onClick={handleInfoClick}>
          <i className="fas fa-info-circle"></i>
          <span className="nav-button-label">
            Info{infoClickCount >= 10 ? `+${infoClickCount}` : ''}
          </span>
        </button>
        
        <button className="nav-button logout-nav-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span className="nav-button-label">Ieșire</span>
        </button>
      </div>
      
      {showInfo && (
        <div className="info-modal" onClick={() => setShowInfo(false)}>
          <div className="info-content" onClick={(e) => e.stopPropagation()}>
            <div className="info-header">
              <h3>iTrack - Informații Aplicație</h3>
              <button className="info-close" onClick={() => setShowInfo(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="info-body">
              <div className="info-section">
                <h4><i className="fas fa-truck"></i> Vehicul</h4>
                <p>Număr înmatriculare: <strong>{vehicleNumber}</strong></p>
                <p>Curse active: <strong>{courses.filter(c => c.status === 2).length}</strong></p>
                <p>Curse în pauză: <strong>{courses.filter(c => c.status === 3).length}</strong></p>
              </div>
              <div className="info-section">
                <h4><i className="fas fa-satellite"></i> GPS Tracking</h4>
                {courses.filter(c => c.status === 2).length > 0 ? (
                  <>
                    <p>Status: <strong>Activ pentru {courses.filter(c => c.status === 2).length} curse</strong></p>
                    <p>Curse în tracking:</p>
                    <div style={{marginLeft: '15px', fontSize: '0.9rem'}}>
                      {courses.filter(c => c.status === 2).map(course => (
                        <p key={course.id} style={{margin: '2px 0', color: '#059669'}}>
                          • UIT: <strong>{course.uit}</strong>
                        </p>
                      ))}
                    </div>
                    <p>Interval transmisie: <strong>60 secunde</strong></p>
                    <p>Background tracking: <strong>Activat (nativ Android)</strong></p>
                    <p>Funcționează când: <strong>telefon blocat, app minimizată</strong></p>
                  </>
                ) : (
                  <>
                    <p>Status: <strong>Inactiv</strong></p>
                    <p>Nu există curse în desfășurare</p>
                    <p>GPS va porni automat la Start Cursă</p>
                  </>
                )}
              </div>
              <div className="info-section">
                <h4><i className="fas fa-mobile-alt"></i> Aplicație</h4>
                <p>Versiune: <strong>1807.99</strong></p>
                <p>Platform: <strong>Android/Web</strong></p>
                <p>© 2025 iTrack Business Solutions</p>
              </div>
            </div>
          </div>
        </div>
      )}
      


      {/* Debug Password Prompt */}
      {showDebugPrompt && (
        <div className="debug-prompt-overlay">
          <div className="debug-prompt-content">
            <h3>Mod Debug Dezvoltator</h3>
            <p>Introduceți parola pentru accesul la panelul de debug:</p>
            <input
              type="password"
              value={debugPassword}
              onChange={(e) => setDebugPassword(e.target.value)}
              placeholder="Parola debug"
              className="debug-password-input"
              onKeyPress={(e) => e.key === 'Enter' && handleDebugPasswordSubmit()}
            />
            <div className="debug-prompt-buttons">
              <button onClick={handleDebugPasswordSubmit} className="debug-submit-btn">
                Accesează Debug
              </button>
              <button onClick={() => setShowDebugPrompt(false)} className="debug-cancel-btn">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Debug Panel */}
      {showDebugPanel && (
        <div className="mobile-debug-overlay">
          <div className="mobile-debug-panel">
            <div className="debug-header">
              <h3>📱 Debug Panel (Mobile)</h3>
              <button onClick={closeDebugPanel} className="debug-close-btn">✕</button>
            </div>
            <div className="debug-content">
              <div className="debug-logs-container">
                <div className="debug-status">
                  <span className="debug-indicator">🟢 Debug Activ</span>
                  <span className="debug-platform">Platform: Android APK</span>
                </div>
                <div className="debug-log-output" id="debugLogOutput">
                  <div className="debug-log-item info">
                    <span className="log-time">{new Date().toLocaleTimeString()}</span>
                    <span className="log-level">INFO</span>
                    <span className="log-message">Debug panel activat pentru diagnosticare GPS</span>
                  </div>
                  <div className="debug-log-item warn">
                    <span className="log-time">{new Date().toLocaleTimeString()}</span>
                    <span className="log-level">WARN</span>
                    <span className="log-message">Verificați logurile Android ADB pentru detalii complete</span>
                  </div>
                </div>
                <div className="debug-actions">
                  <button className="debug-action-btn" onClick={() => console.log('Test GPS Plugin')}>
                    Test GPS Plugin
                  </button>
                  <button className="debug-action-btn" onClick={() => console.log('Clear Logs')}>
                    Clear Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleScreen;