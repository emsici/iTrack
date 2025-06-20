import React, { useState } from 'react';
import { Course } from '../types';
import { getVehicleCourses, logout } from '../services/api';
import { startGPSTracking, stopGPSTracking } from '../services/directAndroidGPS';
import { clearToken } from '../services/storage';
import '../styles/professionalVehicleScreen.css';

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
    setError('');

    try {
      let newStatus = course.status;

      if (action === 'start') {
        newStatus = 2;
        await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
      } else if (action === 'pause') {
        newStatus = 3;
        await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
      } else if (action === 'resume') {
        newStatus = 2;
        await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
      } else if (action === 'finish') {
        newStatus = 4;
        // First send status 4 to server, then stop tracking
        await startGPSTracking(course.id, vehicleNumber, token, course.uit, newStatus);
        // Small delay to ensure status 4 transmission completes
        setTimeout(() => stopGPSTracking(course.id), 1000);
      }

      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === course.id ? { ...c, status: newStatus } : c
        )
      );

    } catch (error: any) {
      console.error('Course action error:', error);
      setError(error.message || 'Eroare la executarea acțiunii');
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
      await clearToken();
      onLogout();
    }
  };

  const handleShowInfo = () => {
    setShowInfo(true);
  };

  const getStatusText = (status: number): string => {
    switch (status) {
      case 1: return 'Disponibilă';
      case 2: return 'În curs';
      case 3: return 'Pauză';
      case 4: return 'Finalizată';
      default: return 'Necunoscută';
    }
  };

  const renderCourseActions = (course: Course) => {
    const isLoading = actionLoading === course.id;
    
    if (course.status === 1) {
      return (
        <button
          className="action-button start-button"
          onClick={() => handleCourseAction(course, 'start')}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner"></div>
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
        <div className="course-actions">
          <button
            className="action-button pause-button"
            onClick={() => handleCourseAction(course, 'pause')}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <i className="fas fa-pause"></i>
                Pauză
              </>
            )}
          </button>
          <button
            className="action-button finish-button"
            onClick={() => handleCourseAction(course, 'finish')}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <i className="fas fa-stop"></i>
                Finalizează
              </>
            )}
          </button>
        </div>
      );
    }
    
    if (course.status === 3) {
      return (
        <button
          className="action-button resume-button"
          onClick={() => handleCourseAction(course, 'resume')}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner"></div>
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
      <div className="vehicle-container">
        {!coursesLoaded ? (
          <>
            <div className="vehicle-header">
              <div className="header-title">
                <div className="header-icon">
                  <i className="fas fa-route"></i>
                </div>
                <div className="header-text">
                  <h1>iTrack Professional</h1>
                  <p>Advanced GPS Tracking & Fleet Management</p>
                </div>
              </div>
              
              <div className="vehicle-input-section">
                <div className="input-group">
                  <div className="input-field">
                    <label className="input-label">Numărul Vehiculului</label>
                    <input
                      type="text"
                      className="vehicle-input"
                      placeholder="🚛 B123ABC / CJ45DEF / TM67GHI"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleLoadCourses()}
                    />
                  </div>
                  <button
                    className="load-button"
                    onClick={handleLoadCourses}
                    disabled={loading || !vehicleNumber.trim()}
                  >
                    {loading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <>
                        <i className="fas fa-search"></i>
                        Încarcă Cursele
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="courses-section">
            <div className="courses-header">
              <h2 className="courses-title">
                Vehicul: <span 
                  onClick={() => {
                    setCoursesLoaded(false);
                    setCourses([]);
                    setVehicleNumber('');
                  }}
                  className="vehicle-number-clickable"
                >
                  {vehicleNumber}
                  <i className="fas fa-edit edit-icon"></i>
                </span>
              </h2>
              <div className="courses-stats">
                {courses.length} {courses.length === 1 ? 'cursă' : 'curse'} disponibile
              </div>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="professional-course-card">
                  <div className="course-header">
                    <div>
                      <div className="course-id">UIT: {course.uit}</div>
                      <div className="course-declarant">
                        {course.denumireDeclarant || 'Transport comercial'}
                      </div>
                    </div>
                    <div className={`course-status-badge status-${course.status}`}>
                      {getStatusText(course.status)}
                    </div>
                  </div>

                  <div className="course-details">
                    {course.name && (
                      <div className="detail-row">
                        <i className="fas fa-truck detail-icon"></i>
                        <span className="detail-text">
                          Transport: {course.name}
                        </span>
                      </div>
                    )}
                    
                    {course.description && (
                      <div className="detail-row">
                        <i className="fas fa-info-circle detail-icon"></i>
                        <span className="detail-text">
                          {course.description}
                        </span>
                      </div>
                    )}
                    
                    {course.vama && course.vamaStop && (
                      <div className="detail-row">
                        <i className="fas fa-route detail-icon"></i>
                        <span className="detail-text">
                          {course.vama} → {course.vamaStop}
                        </span>
                      </div>
                    )}
                    
                    {course.dataTransport && (
                      <div className="detail-row">
                        <i className="fas fa-calendar detail-icon"></i>
                        <span className="detail-text">
                          Data transport: {new Date(course.dataTransport).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="course-actions">
                    {renderCourseActions(course)}
                    <button
                      className="action-button info-button"
                      onClick={() => setExpandedCourse(
                        expandedCourse === course.id ? null : course.id
                      )}
                    >
                      <i className="fas fa-info"></i>
                    </button>
                  </div>

                  {expandedCourse === course.id && (
                    <div className="course-expanded-details">
                      <div className="expanded-content">
                        <h4>Detalii complete cursă</h4>
                        {course.name && <p><strong>Nume:</strong> {course.name}</p>}
                        {course.description && <p><strong>Descriere:</strong> {course.description}</p>}
                        {course.ikRoTrans && <p><strong>ikRoTrans:</strong> {course.ikRoTrans}</p>}
                        {course.vama && <p><strong>Vamă:</strong> {course.vama}</p>}
                        {course.judet && <p><strong>Județ:</strong> {course.judet}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-navigation">
        <div className="nav-container">
          <div className="app-branding">
            <i className="fas fa-location-arrow"></i>
            <span>iTrack GPS</span>
          </div>
          <div className="nav-actions">
            <button className="nav-button info-nav-button" onClick={handleShowInfo}>
              <i className="fas fa-info-circle"></i>
              Info
            </button>
            <button className="nav-button logout-nav-button" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Ieșire
            </button>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="info-modal" onClick={() => setShowInfo(false)}>
          <div className="info-content" onClick={(e) => e.stopPropagation()}>
            <div className="info-header">
              <h3>Informații</h3>
              <button onClick={() => setShowInfo(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="info-body">
              <div className="info-section">
                <h4><i className="fas fa-truck"></i> Vehicul Current</h4>
                <p><strong>Numărul de înmatriculare:</strong> {vehicleNumber}</p>
                <p><strong>Status:</strong> Conectat și operațional</p>
              </div>

              <div className="info-section">
                <h4><i className="fas fa-route"></i> Status Curse</h4>
                <p><strong>Curse active (GPS pornit):</strong> {courses.filter(c => c.status === 2).length}</p>
                <p><strong>Curse în pauză:</strong> {courses.filter(c => c.status === 3).length}</p>
                <p><strong>Curse disponibile:</strong> {courses.filter(c => c.status === 1).length}</p>
                <p><strong>Total curse înregistrate:</strong> {courses.length}</p>
              </div>

              <div className="info-section">
                <h4><i className="fas fa-satellite-dish"></i> Tehnologie GPS</h4>
                <p><strong>Sistem:</strong> iTrack Professional v2.0</p>
                <p><strong>Precizie:</strong> GPS de înaltă precizie (±1-3m)</p>
                <p><strong>Interval transmisie:</strong> La fiecare 5 secunde (optimizat)</p>
                <p><strong>Funcționare background:</strong> Activ permanent</p>
                <p><strong>Compatibilitate:</strong> Android nativ</p>
              </div>

              <div className="info-section">
                <h4><i className="fas fa-shield-alt"></i> Caracteristici Avansate</h4>
                <p>• <strong>Background tracking:</strong> GPS funcționează cu telefonul blocat</p>
                <p>• <strong>Multi-task:</strong> Urmărește multiple curse simultan</p>
                <p>• <strong>Auto-sync:</strong> Sincronizare automată cu serverul</p>
                <p>• <strong>Real-time:</strong> Transmisie coordonate în timp real</p>
                <p>• <strong>Battery optimized:</strong> Optimizat pentru baterie</p>
              </div>

              <div className="info-section">
                <h4><i className="fas fa-cogs"></i> Date Transmise</h4>
                <p>• Coordonate GPS (latitudine, longitudine)</p>
                <p>• Altitudine precisă din senzori</p>
                <p>• Viteză și direcție de deplasare</p>
                <p>• Nivel semnal GSM real</p>
                <p>• Status cursă și UIT individual</p>
                <p>• Timestamp și date autentificare</p>
              </div>

              <div className="info-section">
                <h4><i className="fas fa-building"></i> Despre Companie</h4>
                <p><strong>Dezvoltator:</strong> EUSC Agency</p>
                <p><strong>Platforma:</strong> ETSM3 Transport Management</p>
                <p><strong>Tip licență:</strong> Profesională pentru flote</p>
                <p><strong>Support:</strong> Business 24/7</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleScreen;