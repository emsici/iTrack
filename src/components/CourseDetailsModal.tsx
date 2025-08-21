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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: themeColors.backdrop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: themeColors.modalBg,
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: themeColors.headerBg,
            padding: '20px',
            borderRadius: '16px 16px 0 0',
            borderBottom: `1px solid ${themeColors.border}`
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: themeColors.buttonText
            }}>
              Detalii Cursă
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: themeColors.buttonText,
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>

          {/* UIT și Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: themeColors.buttonText
            }}>
              UIT: {course.uit}
            </div>
            <div style={{
              backgroundColor: getStatusColor(course.status),
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {getStatusText(course.status)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Informații de bază */}
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: themeColors.subText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                PLECARE
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: themeColors.text,
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