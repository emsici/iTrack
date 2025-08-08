import React, { useState } from 'react';

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
}

interface CourseQuickViewProps {
  course: Course;
  onStatusUpdate: (newStatus: number) => void;
  isLoading?: boolean;
}

const CourseQuickView: React.FC<CourseQuickViewProps> = ({ 
  course, 
  onStatusUpdate, 
  isLoading = false 
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return { icon: 'fas fa-clock', color: '#3b82f6', text: 'DISPONIBIL' };
      case 2: return { icon: 'fas fa-truck-moving', color: '#10b981', text: 'ACTIV' };
      case 3: return { icon: 'fas fa-pause', color: '#f59e0b', text: 'PAUZĂ' };
      case 4: return { icon: 'fas fa-check-circle', color: '#ef4444', text: 'TERMINAT' };
      default: return { icon: 'fas fa-question', color: '#6b7280', text: 'NECUNOSCUT' };
    }
  };

  const statusInfo = getStatusIcon(course.status);

  return (
    <div className="course-quick-view">
      <style>{`
        .course-quick-view {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.95) 0%, 
            rgba(51, 65, 85, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          margin: 8px 4px 16px;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .course-quick-view::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: ${statusInfo.color};
          transition: all 0.3s ease;
        }

        .course-quick-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .course-header-quick {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .uit-quick {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge-quick {
          background: ${statusInfo.color}20;
          border: 1px solid ${statusInfo.color}40;
          color: ${statusInfo.color};
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .course-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .info-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px;
        }

        .info-label {
          color: #94a3b8;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-value {
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .action-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.8rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-color: #3b82f6;
          color: #ffffff;
        }

        .action-btn.primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        }

        .toggle-details-quick {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.75rem;
          margin-top: 12px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .toggle-details-quick:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .course-info-grid {
            grid-template-columns: 1fr;
          }
          
          .quick-actions {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Header cu UIT și Status */}
      <div className="course-header-quick">
        <div className="uit-quick">
          <i className="fas fa-route"></i>
          {course.uit}
        </div>
        <div className="status-badge-quick">
          <i className={statusInfo.icon}></i>
          {statusInfo.text}
        </div>
      </div>

      {/* Info Grid Compact */}
      <div className="course-info-grid">
        <div className="info-item">
          <div className="info-label">Destinație</div>
          <div className="info-value">{course.destinatie || 'Nu specificat'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Distanță</div>
          <div className="info-value">{course.km ? `${course.km} km` : 'Nu specificat'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Plecare</div>
          <div className="info-value">{course.plecare || 'Nu specificat'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Încărcătură</div>
          <div className="info-value">{course.incarcatura || 'Nu specificat'}</div>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="quick-actions">
          {course.status === 1 && (
            <button 
              className="action-btn primary" 
              onClick={() => onStatusUpdate(2)}
              disabled={isLoading}
            >
              <i className="fas fa-play"></i>
              START
            </button>
          )}
          {course.status === 2 && (
            <>
              <button 
                className="action-btn" 
                onClick={() => onStatusUpdate(3)}
                disabled={isLoading}
              >
                <i className="fas fa-pause"></i>
                PAUZĂ
              </button>
              <button 
                className="action-btn" 
                onClick={() => onStatusUpdate(4)}
                disabled={isLoading}
              >
                <i className="fas fa-stop"></i>
                STOP
              </button>
            </>
          )}
          {course.status === 3 && (
            <button 
              className="action-btn primary" 
              onClick={() => onStatusUpdate(2)}
              disabled={isLoading}
            >
              <i className="fas fa-play"></i>
              CONTINUĂ
            </button>
          )}
        </div>
      )}

      {/* Toggle Details Button */}
      <button 
        className="toggle-details-quick"
        onClick={() => setShowQuickActions(!showQuickActions)}
      >
        <i className={`fas fa-chevron-${showQuickActions ? 'up' : 'down'}`}></i>
        {showQuickActions ? 'Ascunde Acțiuni' : 'Afișează Acțiuni'}
      </button>
    </div>
  );
};

export default CourseQuickView;