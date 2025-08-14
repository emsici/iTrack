/**
 * InfoModal Component
 * Modal cu informații complete despre aplicația iTrack
 */

import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" style={{
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--glass-shadow)'
        }}>
          <div className="modal-header" style={{
            background: 'var(--glass-bg)',
            border: 'none',
            borderBottom: '1px solid var(--border-primary)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px'
          }}>
            <h5 className="modal-title d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
              <i className="fas fa-info-circle me-3" style={{ color: 'var(--text-accent)' }}></i>
              Despre iTrack GPS
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={onClose}
              style={{ filter: 'invert(1)' }}
            ></button>
          </div>
          
          <div className="modal-body" style={{ 
            padding: '30px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            {/* App Overview */}
            <div className="mb-4">
              <h6 className="mb-3 d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-mobile-alt me-2" style={{ color: 'var(--text-accent)' }}></i>
                Aplicația iTrack GPS Professional
              </h6>
              <p style={{ color: 'var(--text-secondary)' }}>
                iTrack este o soluție profesională de monitorizare GPS pentru gestionarea flotelor de transport. 
                Aplicația oferă urmărire în timp real, gestionarea curselor și capabilități robuste offline pentru 
                optimizarea operațiunilor de transport.
              </p>
            </div>

            {/* Key Features */}
            <div className="mb-4">
              <h6 className="mb-3 d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-star me-2" style={{ color: 'var(--text-accent)' }}></i>
                Funcționalități Principale
              </h6>
              <div className="row g-3">
                <div className="col-12">
                  <div className="feature-item p-3" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex align-items-start">
                      <i className="fas fa-satellite-dish me-3 mt-1" style={{ color: 'var(--color-success)' }}></i>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>GPS în Timp Real</strong>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                          Transmisie coordonate la fiecare 5 secunde cu sincronizare perfectă
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="feature-item p-3" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex align-items-start">
                      <i className="fas fa-route me-3 mt-1" style={{ color: 'var(--color-info)' }}></i>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Gestionare Curse</strong>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                          Control complet status curse: Disponibil, În progres, Pauzat, Finalizat
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="feature-item p-3" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex align-items-start">
                      <i className="fas fa-wifi me-3 mt-1" style={{ color: 'var(--color-warning)' }}></i>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Funcționare Offline</strong>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                          Cache automat coordonate și sincronizare când se restabilește conexiunea
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="feature-item p-3" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: '12px'
                  }}>
                    <div className="d-flex align-items-start">
                      <i className="fas fa-palette me-3 mt-1" style={{ color: 'var(--text-accent)' }}></i>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>6 Teme Complete</strong>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                          Dark, Light, Auto, Corporate, Gamer, Minimalist
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="mb-4">
              <h6 className="mb-3 d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-cog me-2" style={{ color: 'var(--text-accent)' }}></i>
                Specificații Tehnice
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="tech-spec" style={{
                    background: 'var(--bg-tertiary)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-secondary)'
                  }}>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: 'var(--text-muted)' }}>Platforma:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Android GPS</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tech-spec" style={{
                    background: 'var(--bg-tertiary)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-secondary)'
                  }}>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: 'var(--text-muted)' }}>Framework:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>React + Capacitor</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tech-spec" style={{
                    background: 'var(--bg-tertiary)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-secondary)'
                  }}>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: 'var(--text-muted)' }}>Interval GPS:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>5 secunde</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tech-spec" style={{
                    background: 'var(--bg-tertiary)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-secondary)'
                  }}>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: 'var(--text-muted)' }}>Servicii GPS:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>4 redundante</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Info */}
            <div className="mb-4">
              <h6 className="mb-3 d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-building me-2" style={{ color: 'var(--text-accent)' }}></i>
                Informații Aplicație
              </h6>
              <div className="app-details" style={{
                background: 'var(--bg-tertiary)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--border-secondary)'
              }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <span style={{ color: 'var(--text-muted)' }}>Versiune:</span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>iTrack v2.0</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-item">
                      <span style={{ color: 'var(--text-muted)' }}>Dezvoltator:</span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>EUSC Agency</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-item">
                      <span style={{ color: 'var(--text-muted)' }}>Data Build:</span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>August 2025</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-item">
                      <span style={{ color: 'var(--text-muted)' }}>Tip Licență:</span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>Enterprise</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center" style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border-secondary)'
            }}>
              <h6 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>
                <i className="fas fa-envelope me-2" style={{ color: 'var(--text-accent)' }}></i>
                Suport Tehnic
              </h6>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Pentru asistență tehnică și suport:
              </p>
              <div style={{ color: 'var(--text-accent)' }}>
                <i className="fas fa-globe me-2"></i>
                <strong>www.euscagency.com</strong>
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{
            background: 'var(--glass-bg)',
            border: 'none',
            borderTop: '1px solid var(--border-primary)',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px'
          }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onClose}
              style={{
                background: 'var(--btn-primary-bg)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 25px',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-times me-2"></i>
              Închide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;