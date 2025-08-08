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

interface CourseSwipeCardProps {
  course: Course;
  onStatusUpdate: (newStatus: number) => void;
  onDetailsView: () => void;
  isLoading?: boolean;
}

const CourseSwipeCard: React.FC<CourseSwipeCardProps> = ({ 
  course, 
  onStatusUpdate, 
  onDetailsView,
  isLoading = false 
}) => {
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1: return { icon: 'fas fa-clock', color: '#3b82f6', text: 'DISPONIBIL', bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' };
      case 2: return { icon: 'fas fa-truck-moving', color: '#10b981', text: 'ACTIV', bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' };
      case 3: return { icon: 'fas fa-pause', color: '#f59e0b', text: 'PAUZĂ', bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' };
      case 4: return { icon: 'fas fa-check-circle', color: '#ef4444', text: 'TERMINAT', bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' };
      default: return { icon: 'fas fa-question', color: '#6b7280', text: 'NECUNOSCUT', bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' };
    }
  };

  const statusInfo = getStatusInfo(course.status);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setIsSwipedLeft(true);
    }
    if (isRightSwipe) {
      setIsSwipedLeft(false);
    }
  };

  return (
    <div className="course-swipe-container">
      <style>{`
        .course-swipe-container {
          position: relative;
          margin: 8px 4px 16px;
          border-radius: 16px;
          overflow: hidden;
          height: 120px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .course-swipe-card {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.95) 0%, 
            rgba(51, 65, 85, 0.9) 100%);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          transition: transform 0.3s ease;
          transform: translateX(${isSwipedLeft ? '-70%' : '0'});
          cursor: grab;
          display: flex;
          align-items: center;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .course-swipe-card:active {
          cursor: grabbing;
        }

        .card-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .course-info-swipe {
          flex: 1;
        }

        .uit-swipe {
          color: #ffffff;
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .route-info {
          color: #94a3b8;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }

        .route-detail {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-indicator-swipe {
          background: ${statusInfo.bg};
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 80px;
          box-shadow: 0 4px 16px ${statusInfo.color}40;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .status-text {
          font-size: 0.7rem;
          font-weight: 600;
          text-align: center;
        }

        .action-panel {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 70%;
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.98) 0%, 
            rgba(30, 41, 59, 0.95) 100%);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 20px;
          transform: translateX(${isSwipedLeft ? '0' : '100%'});
          transition: transform 0.3s ease;
        }

        .action-btn-swipe {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 60px;
        }

        .action-btn-swipe:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: scale(1.05);
        }

        .action-btn-swipe.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-color: #3b82f6;
          color: #ffffff;
        }

        .action-btn-swipe.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #10b981;
          color: #ffffff;
        }

        .action-btn-swipe.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: #f59e0b;
          color: #ffffff;
        }

        .action-btn-swipe.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: #ef4444;
          color: #ffffff;
        }

        .btn-icon {
          font-size: 1.1rem;
        }

        .btn-text {
          font-size: 0.7rem;
          font-weight: 600;
        }

        .swipe-hint {
          position: absolute;
          bottom: 8px;
          right: 12px;
          color: #64748b;
          font-size: 0.7rem;
          opacity: ${isSwipedLeft ? '0' : '0.7'};
          transition: opacity 0.3s ease;
        }

        @media (max-width: 640px) {
          .course-swipe-container {
            height: 100px;
          }
          
          .course-swipe-card {
            padding: 16px;
          }
          
          .uit-swipe {
            font-size: 1rem;
          }
        }
      `}</style>

      <div 
        className="course-swipe-card"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onDetailsView}
      >
        <div className="card-content">
          <div className="course-info-swipe">
            <div className="uit-swipe">
              <i className="fas fa-route"></i>
              {course.uit}
            </div>
            <div className="route-info">
              {course.plecare && course.destinatie ? (
                <>
                  <div className="route-detail">{course.plecare} → {course.destinatie}</div>
                  {course.km && <div className="route-info">{course.km} km</div>}
                </>
              ) : (
                <div className="route-detail">Tap pentru detalii</div>
              )}
            </div>
          </div>
          
          <div className="status-indicator-swipe">
            <i className={`${statusInfo.icon} status-icon`}></i>
            <div className="status-text">{statusInfo.text}</div>
          </div>
        </div>

        {!isSwipedLeft && (
          <div className="swipe-hint">
            <i className="fas fa-chevron-left"></i> Swipe
          </div>
        )}
      </div>

      <div className="action-panel">
        {course.status === 1 && (
          <>
            <button 
              className="action-btn-swipe success" 
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(2);
                setIsSwipedLeft(false);
              }}
              disabled={isLoading}
            >
              <i className="fas fa-play btn-icon"></i>
              <span className="btn-text">START</span>
            </button>
            <button 
              className="action-btn-swipe" 
              onClick={(e) => {
                e.stopPropagation();
                onDetailsView();
              }}
            >
              <i className="fas fa-eye btn-icon"></i>
              <span className="btn-text">DETALII</span>
            </button>
          </>
        )}
        
        {course.status === 2 && (
          <>
            <button 
              className="action-btn-swipe warning" 
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(3);
                setIsSwipedLeft(false);
              }}
              disabled={isLoading}
            >
              <i className="fas fa-pause btn-icon"></i>
              <span className="btn-text">PAUZĂ</span>
            </button>
            <button 
              className="action-btn-swipe danger" 
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(4);
                setIsSwipedLeft(false);
              }}
              disabled={isLoading}
            >
              <i className="fas fa-stop btn-icon"></i>
              <span className="btn-text">STOP</span>
            </button>
          </>
        )}
        
        {course.status === 3 && (
          <>
            <button 
              className="action-btn-swipe success" 
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(2);
                setIsSwipedLeft(false);
              }}
              disabled={isLoading}
            >
              <i className="fas fa-play btn-icon"></i>
              <span className="btn-text">CONTINUĂ</span>
            </button>
            <button 
              className="action-btn-swipe" 
              onClick={(e) => {
                e.stopPropagation();
                onDetailsView();
              }}
            >
              <i className="fas fa-eye btn-icon"></i>
              <span className="btn-text">DETALII</span>
            </button>
          </>
        )}

        <button 
          className="action-btn-swipe" 
          onClick={(e) => {
            e.stopPropagation();
            setIsSwipedLeft(false);
          }}
        >
          <i className="fas fa-times btn-icon"></i>
          <span className="btn-text">ÎNCHIDE</span>
        </button>
      </div>
    </div>
  );
};

export default CourseSwipeCard;