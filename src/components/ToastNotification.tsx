import React, { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onRemove }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-info-circle';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="toast-container">
      <style>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          max-width: 400px;
          width: 100%;
          pointer-events: none;
        }
        
        .toast {
          pointer-events: auto;
        }

        .toast {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transform: translateX(100%);
          animation: slideIn 0.3s ease-out forwards;
          position: relative;
          overflow: hidden;
        }

        .toast.removing {
          animation: slideOut 0.3s ease-in forwards;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }

        .toast::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--toast-color);
        }

        .toast-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .toast-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: var(--toast-color);
          font-size: 12px;
        }

        .toast-title {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          flex: 1;
        }

        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .toast-message {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.4;
          margin-left: 36px;
        }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--toast-color);
          animation: progress linear forwards;
        }

        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        @media (max-width: 480px) {
          .toast-container {
            left: 10px;
            right: 10px;
            max-width: none;
          }
        }
      `}</style>

      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          getIcon={getIcon}
          getColor={getColor}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  getIcon: (type: string) => string;
  getColor: (type: string) => string;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, getIcon, getColor }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  return (
    <div 
      className={`toast ${isRemoving ? 'removing' : ''}`}
      style={{ '--toast-color': getColor(toast.type) } as any}
    >
      <div className="toast-header">
        <div className="toast-icon">
          <i className={`fas ${getIcon(toast.type)}`}></i>
        </div>
        <div className="toast-title">{toast.title}</div>
        <button className="toast-close" onClick={handleRemove}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="toast-message">{toast.message}</div>
      <div 
        className="toast-progress"
        style={{ 
          animationDuration: `${toast.duration || 5000}ms`
        }}
      ></div>
    </div>
  );
};

export default ToastNotification;