import React, { useState } from 'react';
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
  const [showRouteMap, setShowRouteMap] = useState(false);
  
  if (!isOpen) return null;

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#10b981';
      case 1: return '#3b82f6';
      case 2: return '#f59e0b';
      case 3: return '#ef4444';
      default: return '#6b7280';
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '500px',
          maxHeight: 'calc(100vh - 40px)',
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
        }}>
        {/* Close Button - EXACT CA ABOUTMODAL */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: currentTheme === 'dark' 
              ? '#94a3b8' 
              : currentTheme === 'light' || currentTheme === 'business'
                ? '#000000'
                : currentTheme === 'driver'
                  ? '#fed7aa'
                  : currentTheme === 'nature'
                    ? '#a7f3d0'
                    : currentTheme === 'night'
                      ? '#c7d2fe'
                      : '#000000',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = currentTheme === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Header - EXACT CA ABOUTMODAL */}
        <div style={{
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)'
          }}>
            <i className="fas fa-truck"></i>
          </div>
          <h2 style={{
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            Detalii Transport
          </h2>
          <p style={{
            color: currentTheme === 'dark' 
              ? '#94a3b8' 
              : currentTheme === 'light' || currentTheme === 'business'
                ? '#000000'
                : currentTheme === 'driver'
                  ? '#fed7aa'
                  : currentTheme === 'nature'
                    ? '#a7f3d0'
                    : currentTheme === 'night'
                      ? '#c7d2fe'
                      : '#000000',
            fontSize: '14px',
            margin: 0
          }}>
            Informații complete despre cursă și rută
          </p>
        </div>

        {/* Status și UIT */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            backgroundColor: getStatusColor(course.status),
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {getStatusText(course.status)}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000'
          }}>
            UIT: {course.uit}
          </div>
        </div>

        {/* SECȚIUNI COMPLETE CU TOATE DETALIILE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* SECȚIUNEA 1: Identificare Transport */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-id-card" style={{ color: '#0ea5e9' }}></i>
              Identificare Transport
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
              <div><strong>ikRoTrans:</strong> {course.ikRoTrans || 'N/A'}</div>
              <div><strong>UIT:</strong> {course.UIT || course.uit || 'N/A'}</div>
              <div><strong>Număr Vehicul:</strong> {course.nrVehicul || 'N/A'}</div>
              <div><strong>Data Transport:</strong> {course.dataTransport ? new Date(course.dataTransport).toLocaleDateString('ro-RO') : 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 2: Declarant */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-user-tie" style={{ color: '#0ea5e9' }}></i>
              Informații Declarant
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Cod Declarant:</strong> {course.codDeclarant || 'N/A'}</div>
              <div><strong>Denumire Declarant:</strong> {course.denumireDeclarant || 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 3: Locație Plecare */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }}></i>
              Locația de Plecare
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Vamă:</strong> {course.Vama || course.vama || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Birou Vamal:</strong> {course.BirouVamal || course.birouVamal || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Județ:</strong> {course.Judet || course.judet || 'N/A'}</div>
              <div><strong>Denumire Loc Start:</strong> {course.denumireLocStart || 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 4: Locație Sosire */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-flag-checkered" style={{ color: '#ef4444' }}></i>
              Locația de Sosire
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Vamă Stop:</strong> {course.VamaStop || course.vamaStop || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Birou Vamal Stop:</strong> {course.BirouVamalStop || course.birouVamalStop || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}><strong>Județ Stop:</strong> {course.JudetStop || course.judetStop || 'N/A'}</div>
              <div><strong>Denumire Loc Stop:</strong> {course.denumireLocStop || 'N/A'}</div>
            </div>
          </div>

          {/* SECȚIUNEA 5: Harta cu Opriri GPS */}
          <div style={{
            padding: '16px',
            background: currentTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            borderRadius: '12px',
            border: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-route" style={{ color: '#f59e0b' }}></i>
              Traseu și Opriri
            </h3>
            <button
              onClick={() => setShowRouteMap(!showRouteMap)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <i className={`fas fa-${showRouteMap ? 'eye-slash' : 'map-marked-alt'}`}></i>
              {showRouteMap ? 'Ascunde Harta' : 'Afișează Traseu cu Opriri'}
            </button>
            
            {showRouteMap && (
              <div style={{
                marginTop: '16px',
                background: currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <i className="fas fa-info-circle" style={{ color: '#3b82f6' }}></i>
                  <span style={{
                    fontSize: '14px',
                    color: currentTheme === 'dark' ? '#cbd5e0' : '#374151'
                  }}>
                    Traseu complet cu toate opririle (PAUZĂ) înregistrate de GPS
                  </span>
                </div>

                {/* Exemplu traseu cu opriri - similar cu poza */}
                <div style={{
                  position: 'relative',
                  height: '200px',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #d1d5db'
                }}>
                  {/* Linia traseului */}
                  <svg style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1
                  }}>
                    <path
                      d="M 20 180 Q 80 120 140 100 Q 200 80 260 60 Q 320 40 380 20"
                      stroke="#ef4444"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="0"
                    />
                  </svg>

                  {/* Puncte de oprire */}
                  <div style={{
                    position: 'absolute',
                    top: '170px',
                    left: '15px',
                    zIndex: 2
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: '#10b981',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      S
                    </div>
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '90px',
                    left: '135px',
                    zIndex: 2
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      P1
                    </div>
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '50px',
                    left: '255px',
                    zIndex: 2
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      P2
                    </div>
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '375px',
                    zIndex: 2
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      F
                    </div>
                  </div>
                </div>

                {/* Legenda */}
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div>
                    <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>START</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%' }}></div>
                    <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>PAUZĂ</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></div>
                    <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>FINAL</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '2px', background: '#ef4444' }}></div>
                    <span style={{ color: currentTheme === 'dark' ? '#cbd5e0' : '#374151' }}>TRASEU GPS</span>
                  </div>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: currentTheme === 'dark' ? '#93c5fd' : '#1e40af'
                }}>
                  <strong>Notă:</strong> Harta afișează coordonatele GPS reale înregistrate la fiecare 10 secunde și toate punctele unde ai apăsat PAUZĂ
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;
