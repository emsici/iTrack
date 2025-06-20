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
        coursesTracked: 0
      };
    }

    // Simplified statistics calculation
    let totalDistance = 0;
    let totalTime = 0;
    let maxSpeed = 0;
    let totalStops = 0;

    activeCourses.forEach(stats => {
      totalDistance += stats.totalDistance;
      totalTime += stats.drivingTime;
      maxSpeed = Math.max(maxSpeed, stats.maxSpeed);
      totalStops += stats.totalStops;
    });

    return {
      totalDistance,
      totalTime,
      avgSpeed: totalTime > 0 ? totalDistance / (totalTime / 60) : 0,
      maxSpeed,
      totalStops,
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
              <div>
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
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px'
                  }}>
                    <i className="fas fa-list-alt"></i>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Statistici pe Cursă</h3>
                </div>
                
                {courses.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    color: '#64748b',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-info-circle"></i>
                    <span>Nu există curse încărcate</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {courses.map((course) => {
                      const stats = courseStats[course.id];
                      const statusInfo = getStatusIcon(course.status);
                      
                      return (
                        <div 
                          key={course.id} 
                          style={{
                            background: selectedCourse === course.id ? '#f1f5f9' : 'white',
                            border: selectedCourse === course.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: stats ? '12px' : '0'
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', marginBottom: '4px' }}>
                                UIT: {course.uit}
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                {course.denumireDeclarant || 'Transport comercial'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className={`fas ${statusInfo.icon}`} style={{ color: statusInfo.color, fontSize: '16px' }}></i>
                              <i className={`fas ${selectedCourse === course.id ? 'fa-chevron-up' : 'fa-chevron-down'}`} 
                                 style={{ color: '#9ca3af', fontSize: '12px' }}></i>
                            </div>
                          </div>

                          {stats ? (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '12px',
                              marginBottom: selectedCourse === course.id ? '16px' : '0'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                color: '#374151'
                              }}>
                                <i className="fas fa-route" style={{ color: '#6b7280', width: '14px' }}></i>
                                <span>{stats.totalDistance.toFixed(1)} km</span>
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                color: '#374151'
                              }}>
                                <i className="fas fa-clock" style={{ color: '#6b7280', width: '14px' }}></i>
                                <span>{formatTime(stats.drivingTime)}</span>
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                color: '#374151'
                              }}>
                                <i className="fas fa-tachometer-alt" style={{ color: '#6b7280', width: '14px' }}></i>
                                <span>{stats.averageSpeed.toFixed(1)} km/h</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#9ca3af',
                              fontStyle: 'italic'
                            }}>
                              <i className="fas fa-info-circle"></i>
                              <span>Nu există date de urmărire</span>
                            </div>
                          )}

                          {selectedCourse === course.id && stats && (
                            <div style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '16px',
                              marginTop: '12px'
                            }}>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '12px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Început urmărire:</span>
                                  <span style={{ color: '#1e293b', fontWeight: '600' }}>
                                    {new Date(stats.startTime).toLocaleString('ro-RO')}
                                  </span>
                                </div>
                                
                                {stats.endTime && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '500' }}>Sfârșit urmărire:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600' }}>
                                      {new Date(stats.endTime).toLocaleString('ro-RO')}
                                    </span>
                                  </div>
                                )}
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Viteză maximă:</span>
                                  <span style={{ color: '#1e293b', fontWeight: '600' }}>{stats.maxSpeed.toFixed(1)} km/h</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Număr opriri:</span>
                                  <span style={{ color: '#1e293b', fontWeight: '600' }}>{stats.totalStops}</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Timp opriri:</span>
                                  <span style={{ color: '#1e293b', fontWeight: '600' }}>{formatTime(stats.stopDuration)}</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', fontWeight: '500' }}>Status:</span>
                                  <span style={{ 
                                    color: stats.isActive ? '#10b981' : '#dc2626', 
                                    fontWeight: '600' 
                                  }}>
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

        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <button style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            opacity: loading ? 0.6 : 1
          }} onClick={loadCourseStatistics} disabled={loading}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            <span>Actualizează</span>
          </button>
          <button style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }} onClick={onClose}>
            <i className="fas fa-times"></i>
            <span>Închide</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseStatsModal;