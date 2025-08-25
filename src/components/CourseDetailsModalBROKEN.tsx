import React from 'react';
import { Course } from '../types';

interface CourseDetailsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  vehicleNumber?: string;
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

  const getThemeColors = () => {
    const themes = {
      dark: {
        backdrop: 'rgba(0, 0, 0, 0.8)',
        modalBg: 'rgba(15, 23, 42, 0.98)',
        headerBg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        text: '#ffffff',
        subText: '#e2e8f0',
        border: 'rgba(255, 255, 255, 0.2)',
        buttonBg: '#3b82f6',
        buttonText: '#ffffff'
      },
      light: {
        backdrop: 'rgba(0, 0, 0, 0.5)',
        modalBg: 'rgba(255, 255, 255, 0.98)',
        headerBg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        text: '#000000',
        subText: '#475569',
        border: 'rgba(0, 0, 0, 0.1)',
        buttonBg: '#3b82f6',
        buttonText: '#ffffff'
      },
      business: {
        backdrop: 'rgba(0, 0, 0, 0.7)',
        modalBg: 'rgba(248, 250, 252, 0.98)',
        headerBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        text: '#1e293b',
        subText: '#475569',
        border: 'rgba(59, 130, 246, 0.3)',
        buttonBg: '#3b82f6',
        buttonText: '#ffffff'
      },
      driver: {
        backdrop: 'rgba(0, 0, 0, 0.8)',
        modalBg: 'rgba(28, 25, 23, 0.98)',
        headerBg: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
        text: '#ffffff',
        subText: '#e7e5e4',
        border: 'rgba(249, 115, 22, 0.3)',
        buttonBg: '#ea580c',
        buttonText: '#ffffff'
      },
      nature: {
        backdrop: 'rgba(0, 0, 0, 0.8)',
        modalBg: 'rgba(6, 78, 59, 0.98)',
        headerBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        text: '#ffffff',
        subText: '#d1fae5',
        border: 'rgba(16, 185, 129, 0.3)',
        buttonBg: '#10b981',
        buttonText: '#ffffff'
      },
      night: {
        backdrop: 'rgba(0, 0, 0, 0.9)',
        modalBg: 'rgba(30, 27, 75, 0.98)',
        headerBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        text: '#ffffff',
        subText: '#e9d5ff',
        border: 'rgba(139, 92, 246, 0.3)',
        buttonBg: '#8b5cf6',
        buttonText: '#ffffff'
      }
    };
    return themes[currentTheme as keyof typeof themes] || themes.dark;
  };

  const themeColors = getThemeColors();

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

  // EXACT CA ABOUTMODAL - ACELAȘI STYLING
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: currentTheme === 'dark' 
            ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
            : currentTheme === 'light'
              ? 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)'
              : currentTheme === 'business'
                ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                : currentTheme === 'driver'
                  ? 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)'
                  : currentTheme === 'nature'
                    ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
                    : currentTheme === 'night'
                      ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)'
                      : 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
          borderRadius: '20px',
          padding: '0',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          border: currentTheme === 'dark'
            ? '2px solid rgba(255, 255, 255, 0.1)'
            : currentTheme === 'light'
              ? '2px solid rgba(0, 0, 0, 0.1)'
              : currentTheme === 'business'
                ? '2px solid rgba(59, 130, 246, 0.3)'
                : currentTheme === 'driver'
                  ? '2px solid rgba(249, 115, 22, 0.3)'
                  : currentTheme === 'nature'
                    ? '2px solid rgba(16, 185, 129, 0.3)'
                    : currentTheme === 'night'
                      ? '2px solid rgba(139, 92, 246, 0.3)'
                      : '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>

        {/* Modal Content */}
        <div style={{
          maxHeight: '100%',
          overflowY: 'auto',
          padding: '30px 30px 20px 30px'
        }}>
          {/* Header Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            borderBottom: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            paddingBottom: '20px'
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>📋</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night'
                ? '#ffffff'
                : '#1a202c',
              marginBottom: '8px',
              margin: 0
            }}>
              Detalii Cursă
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '12px'
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
          <div style={{
            display: 'grid',
            gap: '20px'
          }}>
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
                marginBottom: '16px',
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
                color: themeColors.subText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                SOSIRE
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: themeColors.text,
                lineHeight: '1.4'
              }}>
                {course.denumireLocStop || course.BirouVamalStop || course.birouVamalStop || (course.vamaStop !== 'Local' ? course.vamaStop : course.VamaStop) || 'Nu este specificată'}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: themeColors.subText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                JUDEȚ PLECARE
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: themeColors.text
              }}>
                {course.Judet || course.judet || 'Nu este specificat'}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: themeColors.subText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                JUDEȚ SOSIRE
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: themeColors.text
              }}>
                {course.JudetStop || course.judetStop || 'Nu este specificat'}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: themeColors.subText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                DECLARANT
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: themeColors.text
              }}>
                {course.denumireDeclarant || 'Nu este specificat'}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: themeColors.subText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                DATA TRANSPORT
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: themeColors.text
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

            {/* SECȚIUNE INFORMAȚII COMPLETE TRANSPORT */}
            <div style={{
              borderTop: `1px solid ${themeColors.border}`,
              paddingTop: '16px',
              marginTop: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: themeColors.text,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-info-circle"></i>
                Informații Complete Transport
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    ID TRANSPORT (ikRoTrans)
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.ikRoTrans || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    COD DECLARANT
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.codDeclarant || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    NR. VEHICUL
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.nrVehicul || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    VAMA PLECARE
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.vama || course.Vama || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    BIROU VAMAL PLECARE
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.birouVamal || course.BirouVamal || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    DENUMIRE LOC START
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.denumireLocStart || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    VAMA STOP
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.vamaStop || course.VamaStop || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    BIROU VAMAL STOP
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.birouVamalStop || course.BirouVamalStop || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: themeColors.subText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>
                    DENUMIRE LOC STOP
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    {course.denumireLocStop || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${themeColors.border}`,
          backgroundColor: currentTheme === 'light' ? '#f8fafc' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: themeColors.buttonBg,
              color: themeColors.buttonText,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;