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
        zIndex: 999999,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        boxSizing: 'border-box'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 40px)',
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
              Despre iTrack
            </h3>
            <p style={{
              fontSize: '14px',
              margin: '0 0 12px 0',
              opacity: '0.9'
            }}>
              iTrack transformă managementul flotelor de transport prin tehnologie GPS avansată. 
              Oferim soluții complete pentru companiile de transport din România care doresc 
              să optimizeze operațiunile, să reducă costurile și să îmbunătățească eficiența flotei.
            </p>
            <p style={{
              fontSize: '14px',
              margin: '0',
              opacity: '0.9'
            }}>
              Cu iTrack, companiile de transport obțin control complet asupra vehiculelor, 
              optimizează rutele și reduc consumul de combustibil prin monitorizare GPS precisă și raportare în timp real.
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
              Ce face aplicația
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: 'fas fa-map-marker-alt', title: 'Localizare GPS precisă', desc: 'Transmite coordonatele vehiculului la fiecare 5 secunde, chiar și fără internet' },
                { icon: 'fas fa-route', title: 'Gestionare curse inteligentă', desc: 'Încarcă automat cursele pentru vehicul și urmărește statusul fiecăreia' },
                { icon: 'fas fa-wifi', title: 'Funcționare offline', desc: 'Salvează datele local când nu ai internet și le sincronizează automat' },
                { icon: 'fas fa-chart-line', title: 'Statistici detaliate', desc: 'Calculează distanța, timpul și viteza pentru fiecare cursă parcursă' },
                { icon: 'fas fa-cog', title: 'Serviciu background', desc: 'Rulează continuu în fundal fără să consume bateria excesiv' },
                { icon: 'fas fa-mobile-alt', title: 'Interfață simplă', desc: 'Design curat cu butoane mari pentru utilizare ușoară în timpul condusului' }
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

          {/* Business Impact */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              Caracteristici tehnice
            </h3>
            <div style={{
              padding: '16px',
              background: currentTheme === 'dark' 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(34, 197, 94, 0.05)',
              border: currentTheme === 'dark' 
                ? '1px solid rgba(34, 197, 94, 0.3)' 
                : '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>Frecvență GPS:</span>
                <span style={{ fontWeight: '600' }}>La fiecare 5 secunde</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>Funcționare:</span>
                <span style={{ fontWeight: '600' }}>24/7 în background</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>Sincronizare:</span>
                <span style={{ fontWeight: '600' }}>Automată la revenirea online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: '0.8' }}>Servicii GPS:</span>
                <span style={{ fontWeight: '600' }}>4 redundante pentru siguranță</span>
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