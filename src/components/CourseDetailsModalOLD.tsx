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
  // PREVENT BODY SCROLL când modal e deschis
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup la unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '500px',
          maxHeight: 'calc(100vh - 80px)',
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
          transform: 'translateZ(0)'
        }}
      >
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
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          paddingBottom: '20px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚛</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '#ffffff'
              : '#1a202c',
            margin: '0 0 12px 0'
          }}>
            Detalii Transport
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#e2e8f0'
                : '#4a5568'
            }}>
              UIT: {course.uit}
            </div>
            <div style={{
              backgroundColor: getStatusColor(course.status),
              color: '#ffffff',
              padding: '6px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {getStatusText(course.status)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Informații de bază */}
          <div style={{
            background: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-route"></i>
              Informații Transport
            </h3>
            
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  PLECARE
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c',
                  lineHeight: '1.4'
                }}>
                  {course.denumireLocStart || course.BirouVamal || course.birouVamal || (course.vama !== 'Local' ? course.vama : course.Vama) || 'Nu este specificat'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  SOSIRE
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c',
                  lineHeight: '1.4'
                }}>
                  {course.denumireLocStop || course.BirouVamalStop || course.birouVamalStop || (course.vamaStop !== 'Local' ? course.vamaStop : course.VamaStop) || 'Nu este specificată'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  JUDEȚ PLECARE
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.Judet || course.judet || 'Nu este specificat'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  JUDEȚ SOSIRE
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.JudetStop || course.judetStop || 'Nu este specificat'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  DECLARANT
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.denumireDeclarant || 'Nu este specificat'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  DATA TRANSPORT
                </div>
                <div style={{
                  fontSize: '14px',
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
                    }) : 'Nu este specificată'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Informații Complete Transport */}
          <div style={{
            background: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-info-circle"></i>
              Informații Complete Transport
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  ID TRANSPORT (ikRoTrans)
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.ikRoTrans || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  COD DECLARANT
                </div>
                <div style={{
                  fontSize: '13px',
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
                  fontSize: '11px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  NR. VEHICUL
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

              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  VAMA PLECARE
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
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  BIROU VAMAL PLECARE
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
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  VAMA STOP
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

              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  BIROU VAMAL STOP
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

              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#9ca3af'
                    : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>
                  DENUMIRE LOC STOP
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                    ? '#ffffff'
                    : '#1a202c'
                }}>
                  {course.denumireLocStop || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;