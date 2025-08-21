import React from 'react';
import { Course } from '../types';

interface CourseDetailsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  isOpen,
  onClose,
  currentTheme
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#10b981'; // Available - verde
      case 1: return '#3b82f6'; // Active - albastru  
      case 2: return '#f59e0b'; // Pause - galben
      case 3: return '#ef4444'; // Stopped - roșu
      default: return '#6b7280'; // Unknown - gri
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Disponibil';
      case 1: return 'Activ';
      case 2: return 'Pauză';
      case 3: return 'Oprit';
      default: return 'Necunoscut';
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 999999,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '40px',
        boxSizing: 'border-box'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '500px',
          maxHeight: 'calc(100vh - 80px)',
          height: 'fit-content',
          background: currentTheme === 'dark' 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
            : currentTheme === 'light'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)'
              : currentTheme === 'driver'
                ? 'linear-gradient(135deg, rgba(28, 25, 23, 0.98) 0%, rgba(41, 37, 36, 0.98) 100%)'
                : currentTheme === 'business'
                  ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)'
                  : currentTheme === 'nature'
                    ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.98) 0%, rgba(6, 95, 70, 0.98) 100%)'
                    : currentTheme === 'night'
                      ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.98) 0%, rgba(49, 46, 129, 0.98) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          padding: '20px 20px',
          boxShadow: currentTheme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.5)'
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch'
        }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '#ffffff'
              : '#1a202c',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          paddingTop: '10px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '15px'
          }}>🚛</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '#ffffff'
              : '#1a202c',
            margin: '0 0 10px 0'
          }}>
            Detalii Transport
          </h2>
          <p style={{
            fontSize: '16px',
            color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '#94a3b8'
              : '#64748b',
            margin: '0 0 20px 0',
            lineHeight: '1.5'
          }}>
            Informații complete despre cursă și transport
          </p>
          
          {/* Status Badge */}
          <div style={{
            display: 'inline-block',
            backgroundColor: getStatusColor(course.status),
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            {getStatusText(course.status)}
          </div>
          
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '#e2e8f0'
              : '#475569',
            marginTop: '10px'
          }}>
            UIT: {course.uit}
          </div>
        </div>

        {/* Content Sections - SCROLL CONTAINER */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingBottom: '20px'
        }}>
          
          {/* Transport Information */}
          <div style={{
            background: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            padding: '20px',
            border: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                📍
              </div>
              Locații Transport
            </h3>
            
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#94a3b8'
                    : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Punct de plecare
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c',
                  lineHeight: '1.4'
                }}>
                  {course.denumireLocStart || course.BirouVamal || course.birouVamal || (course.vama !== 'Local' ? course.vama : course.Vama) || 'Nu este specificat'}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#94a3b8'
                    : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Punct de sosire
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c',
                  lineHeight: '1.4'
                }}>
                  {course.denumireLocStop || course.BirouVamalStop || course.birouVamalStop || (course.vamaStop !== 'Local' ? course.vamaStop : course.VamaStop) || 'Nu este specificată'}
                </div>
              </div>
            </div>
          </div>

          {/* Regional Information */}
          <div style={{
            background: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            padding: '20px',
            border: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🗺️
              </div>
              Informații Regionale
            </h3>
            
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#94a3b8'
                    : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  Județul plecare
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.Judet || course.judet || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#94a3b8'
                    : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  Județul sosire
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.JudetStop || course.judetStop || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Administrative Information */}
          <div style={{
            background: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            padding: '20px',
            border: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                📋
              </div>
              Informații Administrative
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#94a3b8'
                    : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  Declarant
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.denumireDeclarant || 'Nu este specificat'}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }}>
                    Cod declarant
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.codDeclarant || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px'
                  }}>
                    Data transport
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.dataTransport ? 
                      new Date(course.dataTransport).toLocaleDateString('ro-RO', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                      }) : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div style={{
            background: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            padding: '20px',
            border: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                ⚙️
              </div>
              Informații Tehnice
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    ID Transport
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c',
                    fontFamily: 'monospace'
                  }}>
                    {course.ikRoTrans || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    Nr. Vehicul
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.nrVehicul || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    Vama plecare
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.vama || course.Vama || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    Vama sosire
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.vamaStop || course.VamaStop || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    Birou vamal plecare
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.birouVamal || course.BirouVamal || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#94a3b8'
                      : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    Birou vamal sosire
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                      ? '#ffffff'
                      : '#1a202c'
                  }}>
                    {course.birouVamalStop || course.BirouVamalStop || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div style={{ height: '20px' }}></div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;