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
  console.log('🍞 TOAST COMPONENT RENDER:', toasts.length, 'toasts');
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
    <div className="toast-container" style={{ border: '2px solid red', backgroundColor: 'rgba(255,0,0,0.1)' }}>
      <style>{`
        .toast-container {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 9999999 !important;
          max-width: 500px !important;
          width: auto !important;
          pointer-events: auto !important;
          background: red !important;
          border: 10px solid yellow !important;
          padding: 30px !important;
        }
        
        .toast {
          pointer-events: auto;
        }

        .toast {
          background: lime !important;
          border: 3px solid black !important;
          border-radius: 10px !important;
          padding: 20px !important;
          margin-bottom: 10px !important;
          color: black !important;
          font-weight: bold !important;
          font-size: 16px !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          width: 300px !important;
          min-height: 60px !important;
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
          color: black !important;
          font-weight: bold !important;
          font-size: 18px !important;
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
          color: black !important;
          font-size: 16px !important;
          line-height: 1.4;
          margin-left: 0px !important;
          font-weight: bold !important;
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

      <div style={{ color: 'white', background: 'red', padding: '20px', marginBottom: '10px', fontSize: '24px', fontWeight: 'bold' }}>
        🚨 TOAST CONTAINER VISIBLE - {toasts.length} toasts 🚨
      </div>
      {toasts.map((toast, index) => (
        <div key={toast.id + '_debug'} style={{ background: 'yellow', color: 'black', padding: '20px', marginBottom: '10px', border: '3px solid black', fontSize: '20px', fontWeight: 'bold' }}>
          🍞 DEBUG TOAST #{index + 1}: {toast.type} - {toast.title}
        </div>
      ))}
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
  console.log('🍞 TOAST ITEM RENDER:', toast.title, toast.type);

  // DISABLED AUTO-REMOVE pentru debug
  // useEffect(() => {
  //   const duration = toast.duration || 5000;
  //   const timer = setTimeout(() => {
  //     handleRemove();
  //   }, duration);

  //   return () => clearTimeout(timer);
  // }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  return (
    <div 
      className="toast"
      style={{ 
        background: 'lime !important',
        border: '3px solid black !important',
        color: 'black !important',
        padding: '20px !important',
        marginBottom: '10px !important'
      }}
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
      {/* DISABLED PROGRESS pentru debug */}
      {/* <div 
        className="toast-progress"
        style={{ 
          animationDuration: `${toast.duration || 5000}ms`
        }}
      ></div> */}
    </div>
  );
};

export default ToastNotification;