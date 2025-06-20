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
    <div className="modal-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stats-modal-header">
          <div className="modal-title">
            <i className="fas fa-chart-line"></i>
            <span>Statistici Curse - {vehicleNumber}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="stats-modal-content">
          {loading ? (
            <div className="stats-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Încărcare statistici...</span>
            </div>
          ) : (
            <>
              {/* Total Statistics */}
              <div className="total-stats-section">
                <h3>
                  <i className="fas fa-calculator"></i>
                  Statistici Totale
                </h3>
                <div className="total-stats-grid">
                  <div className="total-stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-route"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-value">{totalStats.totalDistance.toFixed(1)} km</div>
                      <div className="stat-label">Distanță Totală</div>
                    </div>
                  </div>
                  
                  <div className="total-stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-value">{formatTime(totalStats.totalTime)}</div>
                      <div className="stat-label">Timp Conducere</div>
                    </div>
                  </div>
                  
                  <div className="total-stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-tachometer-alt"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-value">{totalStats.avgSpeed.toFixed(1)} km/h</div>
                      <div className="stat-label">Viteză Medie</div>
                    </div>
                  </div>
                  
                  {/* Combustibil card removed - too variable for trucks */}
                  
                  <div className="total-stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-pause-circle"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-value">{totalStats.totalStops}</div>
                      <div className="stat-label">Opriri Totale</div>
                    </div>
                  </div>
                  
                  <div className="total-stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-list"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-value">{totalStats.coursesTracked}</div>
                      <div className="stat-label">Curse Urmărite</div>
                    </div>
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