import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentTheme, 
  onThemeChange 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '400px',
        background: currentTheme === 'dark' 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: currentTheme === 'dark' 
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '24px',
        padding: '40px 30px',
        boxShadow: currentTheme === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
        position: 'relative'
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
          marginBottom: '30px'
        }}>
          <h2 style={{
            color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 10px 0'
          }}>
            Setări
          </h2>
          <p style={{
            color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
            fontSize: '14px',
            margin: 0
          }}>
            Personalizează aplicația
          </p>
        </div>

        {/* Theme Section */}
        <div style={{
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: currentTheme === 'dark' ? '#e2e8f0' : '#334155',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-palette" style={{
              color: currentTheme === 'dark' ? '#60a5fa' : '#3b82f6'
            }}></i>
            Temă
          </h3>

          <div style={{
            display: 'flex',
            gap: '15px'
          }}>
            {/* Dark Theme */}
            <button
              onClick={() => onThemeChange('dark')}
              style={{
                flex: 1,
                padding: '20px',
                background: currentTheme === 'dark' 
                  ? (currentTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                  : 'transparent',
                border: currentTheme === 'dark' 
                  ? (currentTheme === 'dark' ? '2px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.1)')
                  : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-moon" style={{ color: '#94a3b8', fontSize: '16px' }}></i>
              </div>
              <span style={{
                color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Întunecat
              </span>
            </button>

            {/* Light Theme */}
            <button
              onClick={() => onThemeChange('light')}
              style={{
                flex: 1,
                padding: '20px',
                background: currentTheme === 'light' 
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                border: currentTheme === 'light' 
                  ? '2px solid #3b82f6'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-sun" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
              </div>
              <span style={{
                color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Luminos
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: currentTheme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{
            color: currentTheme === 'dark' ? '#64748b' : '#94a3b8',
            fontSize: '12px',
            margin: 0
          }}>
            iTrack GPS v1.0 • Tema actuală: {currentTheme === 'dark' ? 'Întunecat' : 'Luminos'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;