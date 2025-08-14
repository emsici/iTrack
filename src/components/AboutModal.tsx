import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'dark' | 'light';
}

const AboutModal: React.FC<AboutModalProps> = ({ 
  isOpen, 
  onClose, 
  currentTheme 
}) => {
  if (!isOpen) return null;

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
        zIndex: 10000,
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
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          background: currentTheme === 'dark' 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: currentTheme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          padding: '30px 25px',
          boxShadow: currentTheme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.5)'
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflowY: 'auto',
          transform: 'translateZ(0)'
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
            color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
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

        {/* Header */}
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
            color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            iTrack GPS
          </h2>
          <p style={{
            color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
            fontSize: '14px',
            margin: 0
          }}>
            Sistem profesional de monitorizare GPS
          </p>
        </div>

        {/* Content */}
        <div style={{
          color: currentTheme === 'dark' ? '#e2e8f0' : '#334155',
          lineHeight: '1.6'
        }}>
          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Despre aplicație
            </h3>
            <p style={{
              fontSize: '14px',
              margin: '0 0 12px 0',
              opacity: '0.9'
            }}>
              iTrack este o aplicație profesională de monitorizare GPS pentru managementul flotelor de transport în România. 
              Oferă urmărire GPS în timp real, gestionarea curselor și capabilități offline robuste pentru optimizarea operațiunilor de transport.
            </p>
          </div>

          {/* Features */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 16px 0'
            }}>
              Funcționalități principale
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: 'fas fa-map-marker-alt', title: 'GPS în timp real', desc: 'Urmărire continuă cu transmisie la 5 secunde' },
                { icon: 'fas fa-route', title: 'Management curse', desc: 'Încărcare și gestionare curse pentru vehicul' },
                { icon: 'fas fa-wifi', title: 'Capabilități offline', desc: 'Sincronizare automată când revii online' },
                { icon: 'fas fa-chart-line', title: 'Analiză statistici', desc: 'Rapoarte detaliate pentru fiecare cursă' },
                { icon: 'fas fa-shield-alt', title: 'Autentificare securizată', desc: 'Login JWT cu persistență automată' },
                { icon: 'fas fa-mobile-alt', title: 'Optimizat Android', desc: 'Serviciu GPS nativ în background' }
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: currentTheme === 'dark' 
                    ? 'rgba(30, 41, 59, 0.5)' 
                    : 'rgba(248, 250, 252, 0.8)',
                  borderRadius: '12px',
                  border: currentTheme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    <i className={feature.icon}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                      fontSize: '14px',
                      fontWeight: '600',
                      margin: '0 0 4px 0'
                    }}>
                      {feature.title}
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      margin: 0,
                      opacity: '0.8'
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Info */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Informații tehnice
            </h3>
            <div style={{
              padding: '16px',
              background: currentTheme === 'dark' 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(59, 130, 246, 0.05)',
              border: currentTheme === 'dark' 
                ? '1px solid rgba(59, 130, 246, 0.3)' 
                : '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>Platform:</span>
                <span style={{ fontWeight: '600' }}>React + Capacitor Android</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>GPS Interval:</span>
                <span style={{ fontWeight: '600' }}>5 secunde (timp real)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>Serviciu Background:</span>
                <span style={{ fontWeight: '600' }}>OptimalGPSService Android</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: '0.8' }}>Versiune:</span>
                <span style={{ fontWeight: '600' }}>1.0.0 Professional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;