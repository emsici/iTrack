import React from 'react';

interface Course {
  id: string;
  uit: string;
  status: number;
  vehicleNumber?: string;
  destinatie?: string;
  plecare?: string;
  sosire?: string;
  km?: number;
  incarcatura?: string;
  observatii?: string;
  client?: string;
  data_plecare?: string;
  ora_plecare?: string;
}

interface CourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (newStatus: number) => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ 
  course, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}) => {
  if (!isOpen || !course) return null;

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1: return { icon: 'fas fa-clock', color: '#3b82f6', text: 'DISPONIBIL' };
      case 2: return { icon: 'fas fa-truck-moving', color: '#10b981', text: 'ACTIV' };
      case 3: return { icon: 'fas fa-pause', color: '#f59e0b', text: 'PAUZĂ' };
      case 4: return { icon: 'fas fa-check-circle', color: '#ef4444', text: 'TERMINAT' };
      default: return { icon: 'fas fa-question', color: '#6b7280', text: 'NECUNOSCUT' };
    }
  };

  const statusInfo = getStatusInfo(course.status);

  return (
    <div className="course-modal-overlay">
      <style>{`
        .course-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .course-modal {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.98) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 0;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          background: linear-gradient(135deg, ${statusInfo.color}20 0%, ${statusInfo.color}10 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 24px;
          border-radius: 20px 20px 0 0;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #cbd5e1;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: scale(1.1);
        }

        .modal-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 40px 12px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-status {
          background: ${statusInfo.color}20;
          border: 1px solid ${statusInfo.color}40;
          color: ${statusInfo.color};
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .modal-content {
          padding: 24px;
        }

        .details-section {
          margin-bottom: 24px;
        }

        .section-title {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .detail-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
        }

        .detail-label {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .detail-value {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          word-break: break-word;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
          padding: 14px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: translateY(-2px);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-color: #3b82f6;
          color: #ffffff;
        }

        .action-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #10b981;
          color: #ffffff;
        }

        .action-btn.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: #f59e0b;
          color: #ffffff;
        }

        .action-btn.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: #ef4444;
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .course-modal {
            margin: 10px;
            max-height: 95vh;
          }
          
          .details-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="course-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
          <div className="modal-title">
            <i className="fas fa-route"></i>
            Cursă {course.uit}
          </div>
          <div className="modal-status">
            <i className={statusInfo.icon}></i>
            {statusInfo.text}
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Detalii Destinație */}
          <div className="details-section">
            <div className="section-title">
              <i className="fas fa-map-marker-alt"></i>
              Detalii Traseu
            </div>
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-label">Plecare</div>
                <div className="detail-value">{course.plecare || 'Nu specificat'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Destinație</div>
                <div className="detail-value">{course.destinatie || 'Nu specificat'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Distanță</div>
                <div className="detail-value">{course.km ? `${course.km} km` : 'Nu specificat'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Data Plecare</div>
                <div className="detail-value">{course.data_plecare || 'Nu specificat'}</div>
              </div>
            </div>
          </div>

          {/* Detalii Încărcătură */}
          <div className="details-section">
            <div className="section-title">
              <i className="fas fa-boxes"></i>
              Detalii Încărcătură
            </div>
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-label">Client</div>
                <div className="detail-value">{course.client || 'Nu specificat'}</div>
              </div>
              <div className="detail-card">
                <div className="detail-label">Tip Încărcătură</div>
                <div className="detail-value">{course.incarcatura || 'Nu specificat'}</div>
              </div>
              {course.observatii && (
                <div className="detail-card full-width">
                  <div className="detail-label">Observații</div>
                  <div className="detail-value">{course.observatii}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {course.status === 1 && (
              <button 
                className="action-btn success" 
                onClick={() => {
                  onStatusUpdate(2);
                  onClose();
                }}
              >
                <i className="fas fa-play"></i>
                ÎNCEPE CURSA
              </button>
            )}
            {course.status === 2 && (
              <>
                <button 
                  className="action-btn warning" 
                  onClick={() => {
                    onStatusUpdate(3);
                    onClose();
                  }}
                >
                  <i className="fas fa-pause"></i>
                  PAUZĂ
                </button>
                <button 
                  className="action-btn danger" 
                  onClick={() => {
                    onStatusUpdate(4);
                    onClose();
                  }}
                >
                  <i className="fas fa-stop"></i>
                  FINALIZEAZĂ
                </button>
              </>
            )}
            {course.status === 3 && (
              <button 
                className="action-btn success" 
                onClick={() => {
                  onStatusUpdate(2);
                  onClose();
                }}
              >
                <i className="fas fa-play"></i>
                CONTINUĂ CURSA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;