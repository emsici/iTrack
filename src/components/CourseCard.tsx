import React, { useState } from 'react';
import { startGPSTracking, stopGPSTracking } from '../services/simpleGPS';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  vehicleNumber: string;
  token: string;
  onStatusUpdate: (courseId: string, newStatus: number) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  vehicleNumber, 
  token, 
  onStatusUpdate 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#3b82f6'; // Available - Blue
      case 2: return '#10b981'; // In Progress - Green
      case 3: return '#f59e0b'; // Paused - Orange
      case 4: return '#ef4444'; // Stopped - Red
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Disponibil';
      case 2: return 'În progres';
      case 3: return 'Pauză';
      case 4: return 'Oprit';
      default: return 'Necunoscut';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return 'fas fa-clock';
      case 2: return 'fas fa-play-circle';
      case 3: return 'fas fa-pause-circle';
      case 4: return 'fas fa-stop-circle';
      default: return 'fas fa-question-circle';
    }
  };

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await startGPSTracking(course.id, vehicleNumber, token, course.uit, 2);
      onStatusUpdate(course.id, 2);
      console.log(`Started tracking for course ${course.id}`);
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsLoading(true);
      await startGPSTracking(course.id, vehicleNumber, token, course.uit, 3);
      onStatusUpdate(course.id, 3);
      console.log(`Paused tracking for course ${course.id}`);
    } catch (error) {
      console.error('Error pausing GPS tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setIsLoading(true);
      await startGPSTracking(course.id, vehicleNumber, token, course.uit, 2);
      onStatusUpdate(course.id, 2);
      console.log(`Resumed tracking for course ${course.id}`);
    } catch (error) {
      console.error('Error resuming GPS tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsLoading(true);
      await stopGPSTracking(course.id);
      onStatusUpdate(course.id, 4);
      console.log(`Finished tracking for course ${course.id}`);
    } catch (error) {
      console.error('Error finishing GPS tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (course.status === 1) {
      return (
        <button 
          className="action-btn start-btn" 
          onClick={handleStart}
          disabled={isLoading}
        >
          <i className="fas fa-play"></i>
          <span>Pornește</span>
        </button>
      );
    } else if (course.status === 2) {
      return (
        <div className="action-buttons">
          <button 
            className="action-btn pause-btn" 
            onClick={handlePause}
            disabled={isLoading}
          >
            <i className="fas fa-pause"></i>
            <span>Pauză</span>
          </button>
          <button 
            className="action-btn finish-btn" 
            onClick={handleFinish}
            disabled={isLoading}
          >
            <i className="fas fa-stop"></i>
            <span>Finalizează</span>
          </button>
        </div>
      );
    } else if (course.status === 3) {
      return (
        <div className="action-buttons">
          <button 
            className="action-btn resume-btn" 
            onClick={handleResume}
            disabled={isLoading}
          >
            <i className="fas fa-play"></i>
            <span>Continuă</span>
          </button>
          <button 
            className="action-btn finish-btn" 
            onClick={handleFinish}
            disabled={isLoading}
          >
            <i className="fas fa-stop"></i>
            <span>Finalizează</span>
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="course-card">
      <style>{`
        .course-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          margin: 16px 0;
          box-shadow: 
            0 12px 24px rgba(30, 64, 175, 0.06),
            0 4px 8px rgba(0, 0, 0, 0.02),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.08);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          animation: courseSlideIn 0.6s ease-out;
        }

        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 20px 40px rgba(30, 64, 175, 0.12),
            0 8px 16px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-color: rgba(59, 130, 246, 0.15);
        }

        .course-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, ${getStatusColor(course.status)}, ${getStatusColor(course.status)}88);
          transition: all 0.3s ease;
        }

        .card-header {
          padding: 24px 24px 16px 24px;
          position: relative;
        }

        .course-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .course-title-section {
          flex: 1;
        }

        .course-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .course-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-badge {
          background: ${getStatusColor(course.status)};
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px ${getStatusColor(course.status)}33;
          border: 2px solid ${getStatusColor(course.status)}22;
        }

        .route-info {
          background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
          border-radius: 16px;
          padding: 16px;
          margin: 16px 0;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .route-locations {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .location {
          flex: 1;
          text-align: center;
        }

        .location-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .location-name {
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 600;
          line-height: 1.2;
        }

        .route-arrow {
          color: #3b82f6;
          font-size: 1.2rem;
          animation: routeFlow 2s ease-in-out infinite;
        }

        .declarant-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #64748b;
        }

        .declarant-info strong {
          color: #374151;
        }

        .card-actions {
          padding: 0 24px 24px 24px;
        }

        .details-toggle {
          width: 100%;
          background: linear-gradient(145deg, #f8fafc, #e2e8f0);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.9rem;
          color: #475569;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }

        .details-toggle:hover {
          background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
          border-color: rgba(148, 163, 184, 0.5);
          transform: translateY(-1px);
        }

        .details-toggle i {
          transition: transform 0.3s ease;
          transform: rotate(${showDetails ? '180deg' : '0deg'});
        }

        .course-details {
          background: linear-gradient(145deg, #f8fafc, #f1f5f9);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          animation: ${showDetails ? 'detailsSlideDown' : 'detailsSlideUp'} 0.3s ease;
          overflow: hidden;
          max-height: ${showDetails ? '400px' : '0'};
          opacity: ${showDetails ? '1' : '0'};
          transition: all 0.3s ease;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .detail-item {
          background: rgba(255, 255, 255, 0.7);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        .detail-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          padding: 16px 20px;
          border: none;
          border-radius: 16px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .action-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .start-btn, .resume-btn {
          background: linear-gradient(145deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .start-btn:hover:not(:disabled), .resume-btn:hover:not(:disabled) {
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .pause-btn {
          background: linear-gradient(145deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .pause-btn:hover:not(:disabled) {
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        }

        .finish-btn {
          background: linear-gradient(145deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .finish-btn:hover:not(:disabled) {
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        @keyframes courseSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes routeFlow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }

        @keyframes detailsSlideDown {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 400px;
            opacity: 1;
          }
        }

        @keyframes detailsSlideUp {
          from {
            max-height: 400px;
            opacity: 1;
          }
          to {
            max-height: 0;
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .course-meta {
            flex-direction: column;
            gap: 12px;
          }

          .status-badge {
            align-self: flex-start;
          }

          .route-locations {
            flex-direction: column;
            gap: 8px;
          }

          .route-arrow {
            transform: rotate(90deg);
          }

          .action-buttons {
            flex-direction: column;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="card-header">
        <div className="course-meta">
          <div className="course-title-section">
            <h3 className="course-title">{course.name}</h3>
            <p className="course-subtitle">
              <i className="fas fa-truck"></i>
              Transport #{course.ikRoTrans}
            </p>
          </div>
          <div className="status-badge">
            <i className={getStatusIcon(course.status)}></i>
            <span>{getStatusText(course.status)}</span>
          </div>
        </div>

        <div className="route-info">
          <div className="route-locations">
            <div className="location">
              <div className="location-label">Plecare</div>
              <div className="location-name">
                {course.departure_location || 'Locație de plecare'}
              </div>
            </div>
            <div className="route-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="location">
              <div className="location-label">Destinație</div>
              <div className="location-name">
                {course.destination_location || 'Locație de destinație'}
              </div>
            </div>
          </div>
          
          <div className="declarant-info">
            <i className="fas fa-building"></i>
            <span><strong>{course.codDeclarant}</strong> - {course.denumireDeclarant}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          <span>Detalii transport</span>
          <i className="fas fa-chevron-down"></i>
        </button>

        <div className="course-details">
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Vamă Plecare</div>
              <div className="detail-value">{course.vama || 'Nespecificat'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Birou Vamal</div>
              <div className="detail-value">{course.birouVamal || 'Nespecificat'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Județ Plecare</div>
              <div className="detail-value">{course.judet || 'Nespecificat'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Vamă Destinație</div>
              <div className="detail-value">{course.vamaStop || 'Nespecificat'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Birou Vamal Stop</div>
              <div className="detail-value">{course.birouVamalStop || 'Nespecificat'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Județ Destinație</div>
              <div className="detail-value">{course.judetStop || 'Nespecificat'}</div>
            </div>
          </div>
        </div>

        {renderActionButtons()}
      </div>
    </div>
  );
};

export default CourseCard;