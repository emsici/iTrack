import React from 'react';
import { Theme, THEME_INFO } from '../services/themeService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentTheme, 
  onThemeChange
}) => {

  if (!isOpen) return null;

  const isDarkVariant = currentTheme === 'dark' || currentTheme === 'driver' || currentTheme === 'nature' || currentTheme === 'night';

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
          maxWidth: '380px',
          maxHeight: '80vh',
          background: isDarkVariant 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: isDarkVariant 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          padding: '30px 25px',
          boxShadow: isDarkVariant
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
            color: isDarkVariant 
              ? '#94a3b8' 
              : currentTheme === 'business'
                ? '#000000'  // BLACK pentru Business theme
                : '#64748b',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <h2 
          style={{
            color: isDarkVariant 
              ? '#ffffff' 
              : currentTheme === 'business'
                ? '#000000'  // BLACK pentru Business theme
                : '#1e293b',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            textAlign: 'center'
          }}
        >
          Setări
        </h2>

        <p style={{
          color: isDarkVariant 
            ? '#cbd5e1' 
            : currentTheme === 'business'
              ? '#64748b'  // Păstrat pentru Business theme - contrast bun
              : '#64748b',
          fontSize: '14px',
          textAlign: 'center',
          margin: '0 0 30px 0',
          lineHeight: '1.5'
        }}>
          Personalizează aplicația după preferințele tale
        </p>

        {/* Theme Selection */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{
            color: isDarkVariant 
            ? '#ffffff' 
            : currentTheme === 'business'
              ? '#000000'  // BLACK pentru Business theme
              : '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 20px 0'
          }}>
            Temă aplicație
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {(Object.keys(THEME_INFO) as Theme[]).map((theme) => {
              const themeInfo = THEME_INFO[theme];
              const isSelected = currentTheme === theme;
              const isThemeDark = theme === 'dark' || theme === 'driver' || theme === 'nature' || theme === 'night';
              
              // Theme preview colors
              const getThemePreview = (theme: Theme) => {
                switch (theme) {
                  case 'dark': return ['#0f172a', '#1e293b', '#475569'];
                  case 'light': return ['#ffffff', '#f8fafc', '#e2e8f0'];
                  case 'driver': return ['#1c1917', '#f97316', '#fef3c7'];
                  case 'business': return ['#f8fafc', '#3b82f6', '#1e293b'];
                  case 'nature': return ['#064e3b', '#10b981', '#d1fae5'];
                  case 'night': return ['#1e1b4b', '#8b5cf6', '#e0e7ff'];
                  default: return ['#0f172a', '#1e293b', '#475569'];
                }
              };
              
              const previewColors = getThemePreview(theme);
              
              return (
                <button
                  key={theme}
                  onClick={() => onThemeChange(theme)}
                  style={{
                    padding: '14px 10px',
                    background: isSelected 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : (isDarkVariant 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.05)'),
                    border: isSelected 
                      ? '2px solid #3b82f6'
                      : (isDarkVariant 
                        ? '1px solid rgba(255, 255, 255, 0.1)' 
                        : '1px solid rgba(0, 0, 0, 0.1)'),
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {/* Theme Icon */}
                  <i 
                    className={`fas fa-${themeInfo.icon}`}
                    style={{ 
                      fontSize: '18px',
                      color: isSelected 
                        ? '#3b82f6' 
                        : (isThemeDark ? '#e2e8f0' : '#64748b'),
                      marginBottom: '2px'
                    }}
                  />
                  
                  {/* Color Preview */}
                  <div style={{
                    display: 'flex',
                    gap: '3px',
                    marginBottom: '4px'
                  }}>
                    {previewColors.map((color, index) => (
                      <div
                        key={index}
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: color,
                          borderRadius: '50%',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Theme Name */}
                  <span style={{
                    color: isDarkVariant ? '#e2e8f0' : '#334155',
                    fontWeight: '600',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    {themeInfo.name}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Theme Description */}
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: isDarkVariant
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{
              color: isDarkVariant ? '#cbd5e1' : '#64748b',
              fontSize: '13px',
              margin: '0',
              lineHeight: '1.4'
            }}>
              {THEME_INFO[currentTheme].description}
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default SettingsModal;