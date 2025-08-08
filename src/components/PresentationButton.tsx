import React, { useState } from 'react';
import ClientPresentation from './ClientPresentation';

const PresentationButton: React.FC = () => {
  const [showPresentation, setShowPresentation] = useState(false);

  if (showPresentation) {
    return (
      <div>
        <ClientPresentation />
        <button
          onClick={() => setShowPresentation(false)}
          style={{
            position: 'fixed',
            top: '30px',
            left: '30px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            border: 'none',
            padding: '15px 25px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            zIndex: 10000,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
          Închide Prezentarea
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPresentation(true)}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '15px 25px',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
      }}
    >
      <i className="fas fa-presentation" style={{ marginRight: '8px' }}></i>
      Prezentare Clienți
    </button>
  );
};

export default PresentationButton;