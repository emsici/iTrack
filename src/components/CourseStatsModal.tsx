import React, { useState, useEffect } from 'react';
import { CourseStatistics, courseAnalyticsService } from '../services/courseAnalytics';
import { Course } from '../types';

interface CourseStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  vehicleNumber: string;
}

const CourseStatsModal: React.FC<CourseStatsModalProps> = ({ 
  isOpen, 
  onClose, 
  courses, 
  vehicleNumber 
}) => {
  const [courseStats, setCourseStats] = useState<{ [courseId: string]: CourseStatistics }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCourseStatistics();
    }
  }, [isOpen, courses]);

  const loadCourseStatistics = async () => {
    setLoading(true);
    try {
      const statsMap: { [courseId: string]: CourseStatistics } = {};
      
      for (const course of courses) {
        const stats = await courseAnalyticsService.getCourseAnalytics(course.id);
        if (stats) {
          statsMap[course.id] = stats;
        }
      }
      
      setCourseStats(statsMap);
    } catch (error) {
      console.error('Error loading course statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStats = () => {
    const activeCourses = Object.values(courseStats);
    if (activeCourses.length === 0) {
      return {
        totalDistance: 0,
        totalTime: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        totalStops: 0,
        totalFuel: 0,
        coursesTracked: 0
      };
    }

    const totals = activeCourses.reduce((acc, stats) => {
      acc.totalDistance += stats.totalDistance;
      acc.totalTime += stats.drivingTime;
      acc.maxSpeed = Math.max(acc.maxSpeed, stats.maxSpeed);
      acc.totalStops += stats.totalStops;
      // Fuel consumption removed
      return acc;
    }, {
      totalDistance: 0,
      totalTime: 0,
      maxSpeed: 0,
      totalStops: 0
    });

    return {
      ...totals,
      avgSpeed: totals.totalTime > 0 ? (totals.totalDistance / (totals.totalTime / 60)) : 0,
      coursesTracked: activeCourses.length
    };
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return { icon: 'fa-clock', color: '#64748b' };
      case 2: return { icon: 'fa-play', color: '#16a34a' };
      case 3: return { icon: 'fa-pause', color: '#f59e0b' };
      case 4: return { icon: 'fa-stop', color: '#dc2626' };
      default: return { icon: 'fa-question', color: '#64748b' };
    }
  };

  if (!isOpen) return null;

  const totalStats = calculateTotalStats();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Statistici Curse</h2>
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{vehicleNumber}</span>
            </div>
          </div>
          <button style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 80px)'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '40px',
              color: '#64748b'
            }}>
              <div style={{
                fontSize: '24px',
                animation: 'spin 1s linear infinite'
              }}>
                <i className="fas fa-spinner"></i>
              </div>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>Încărcare statistici...</span>
            </div>
          ) : (
            <>
              {/* Total Statistics */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px'
                  }}>
                    <i className="fas fa-calculator"></i>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Statistici Totale</h3>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      <i className="fas fa-route"></i>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                      {totalStats.totalDistance.toFixed(1)} km
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Distanță Totală</div>
                  </div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      <i className="fas fa-clock"></i>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                      {formatTime(totalStats.totalTime)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Timp Conducere</div>
                  </div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      <i className="fas fa-tachometer-alt"></i>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                      {totalStats.avgSpeed.toFixed(1)} km/h
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Viteză Medie</div>
                  </div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      <i className="fas fa-pause-circle"></i>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                      {totalStats.totalStops}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Opriri Totale</div>
                  </div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      <i className="fas fa-list"></i>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                      {totalStats.coursesTracked}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Curse Urmărite</div>
                  </div>
                </div>
              </div>

              {/* Individual Course Statistics */}
              <div className="individual-stats-section">
                <h3>
                  <i className="fas fa-list-alt"></i>
                  Statistici pe Cursă
                </h3>
                
                {courses.length === 0 ? (
                  <div className="no-courses">
                    <i className="fas fa-info-circle"></i>
                    <span>Nu există curse încărcate</span>
                  </div>
                ) : (
                  <div className="courses-stats-list">
                    {courses.map((course) => {
                      const stats = courseStats[course.id];
                      const statusInfo = getStatusIcon(course.status);
                      
                      return (
                        <div 
                          key={course.id} 
                          className={`course-stats-item ${selectedCourse === course.id ? 'selected' : ''}`}
                          onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                        >
                          <div className="course-stats-header">
                            <div className="course-basic-info">
                              <div className="course-uit">UIT: {course.uit}</div>
                              <div className="course-name">{course.denumireDeclarant || 'Transport comercial'}</div>
                            </div>
                            <div className="course-status-info">
                              <i className={`fas ${statusInfo.icon}`} style={{ color: statusInfo.color }}></i>
                              <span className="toggle-indicator">
                                <i className={`fas ${selectedCourse === course.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                              </span>
                            </div>
                          </div>

                          {stats ? (
                            <div className="course-stats-summary">
                              <div className="stat-item">
                                <span className="stat-icon"><i className="fas fa-route"></i></span>
                                <span>{stats.totalDistance.toFixed(1)} km</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-icon"><i className="fas fa-clock"></i></span>
                                <span>{formatTime(stats.drivingTime)}</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-icon"><i className="fas fa-tachometer-alt"></i></span>
                                <span>{stats.averageSpeed.toFixed(1)} km/h</span>
                              </div>
                            </div>
                          ) : (
                            <div className="no-stats">
                              <i className="fas fa-info-circle"></i>
                              <span>Nu există date de urmărire</span>
                            </div>
                          )}

                          {selectedCourse === course.id && stats && (
                            <div className="course-details-stats">
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="detail-label">Început urmărire:</span>
                                  <span className="detail-value">
                                    {new Date(stats.startTime).toLocaleString('ro-RO')}
                                  </span>
                                </div>
                                
                                {stats.endTime && (
                                  <div className="detail-item">
                                    <span className="detail-label">Sfârșit urmărire:</span>
                                    <span className="detail-value">
                                      {new Date(stats.endTime).toLocaleString('ro-RO')}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="detail-item">
                                  <span className="detail-label">Viteză maximă:</span>
                                  <span className="detail-value">{stats.maxSpeed.toFixed(1)} km/h</span>
                                </div>
                                
                                <div className="detail-item">
                                  <span className="detail-label">Număr opriri:</span>
                                  <span className="detail-value">{stats.totalStops}</span>
                                </div>
                                
                                <div className="detail-item">
                                  <span className="detail-label">Timp opriri:</span>
                                  <span className="detail-value">{formatTime(stats.stopDuration)}</span>
                                </div>
                                
                                {/* Combustibil removed - too variable for trucks */}
                                
                                {/* GPS points removed from display */}
                                
                                <div className="detail-item">
                                  <span className="detail-label">Status:</span>
                                  <span className="detail-value">
                                    {stats.isActive ? 'Activ' : 'Oprit'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="stats-modal-footer">
          <button className="refresh-stats-btn" onClick={loadCourseStatistics} disabled={loading}>
            <i className={`fas fa-sync-alt ${loading ? 'spinning' : ''}`}></i>
            <span>Actualizează</span>
          </button>
          <button className="close-stats-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
            <span>Închide</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseStatsModal;