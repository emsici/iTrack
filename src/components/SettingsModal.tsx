/**
 * Settings Modal - Configurări aplicație
 */

import React, { useState, useEffect } from 'react';
import { themeService, Theme } from '../services/themeService';
import AdminPanel from './AdminPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
  const [clickCount, setClickCount] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // Inițializează tema curentă
    setCurrentTheme(themeService.getCurrentTheme());

    // Listener pentru schimbări de temă
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
    };

    themeService.addThemeListener(handleThemeChange);

    return () => {
      themeService.removeThemeListener(handleThemeChange);
    };
  }, []);

  const handleThemeChange = async (theme: Theme) => {
    await themeService.setTheme(theme);
  };

  const handleVersionClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      console.log(`Settings version clicked: ${newCount}/50`);
      
      if (newCount >= 50) {
        console.log('🔓 Opening Admin Panel from Settings');
        setShowAdminPanel(true);
        setClickCount(0); // Reset counter
      }
      
      return newCount;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-cog me-2"></i>
              Setări Aplicație
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Theme Selection */}
            <div className="settings-section">
              <h6 className="settings-section-title">
                <i className="fas fa-palette me-2"></i>
                Aspect Vizual
              </h6>
              
              <div className="theme-options">
                <div className="row g-3">
                  {/* Dark Theme */}
                  <div className="col-6">
                    <div
                      className={`theme-card ${currentTheme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div className="theme-preview dark-preview">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-content">
                          <div className="theme-preview-bar"></div>
                          <div className="theme-preview-bar short"></div>
                        </div>
                      </div>
                      <div className="theme-card-info">
                        <div className="theme-card-title">Tema Întunecată</div>
                        <div className="theme-card-desc">Design modern, ideal pentru noapte</div>
                      </div>
                      {currentTheme === 'dark' && (
                        <i className="fas fa-check-circle theme-card-check"></i>
                      )}
                    </div>
                  </div>

                  {/* Light Theme */}
                  <div className="col-6">
                    <div
                      className={`theme-card ${currentTheme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div className="theme-preview light-preview">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-content">
                          <div className="theme-preview-bar"></div>
                          <div className="theme-preview-bar short"></div>
                        </div>
                      </div>
                      <div className="theme-card-info">
                        <div className="theme-card-title">Tema Deschisă</div>
                        <div className="theme-card-desc">Design clasic, ideal pentru zi</div>
                      </div>
                      {currentTheme === 'light' && (
                        <i className="fas fa-check-circle theme-card-check"></i>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Info */}
            <div className="settings-section">
              <h6 className="settings-section-title">
                <i className="fas fa-info-circle me-2"></i>
                Informații Aplicație
              </h6>
              
              <div className="app-info">
                <div className="app-info-item" onClick={handleVersionClick} style={{ cursor: 'pointer', position: 'relative' }}>
                  <span className="app-info-label">Versiune:</span>
                  <span className="app-info-value">
                    iTrack v2.0
                    {clickCount >= 30 && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '12px', 
                        color: 'var(--text-muted)',
                        opacity: 0.7
                      }}>
                        ({clickCount}/50)
                      </span>
                    )}
                  </span>
                </div>
                <div className="app-info-item">
                  <span className="app-info-label">Dezvoltator:</span>
                  <span className="app-info-value">EUSC Agency</span>
                </div>
                <div className="app-info-item">
                  <span className="app-info-label">Platforma:</span>
                  <span className="app-info-value">Android GPS Professional</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="fas fa-times me-2"></i>
              Închide
            </button>
          </div>
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && onLogout && (
        <AdminPanel
          onLogout={onLogout}
          onClose={() => {
            setShowAdminPanel(false);
            setClickCount(0); // Reset counter when closing
          }}
        />
      )}
    </div>
  );
};

export default SettingsModal;