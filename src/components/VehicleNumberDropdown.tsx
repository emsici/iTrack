import React, { useState, useEffect, useRef } from 'react';
import { getVehicleNumberHistory, removeVehicleNumberFromHistory } from '../services/storage';

interface VehicleNumberDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  onNavigateToInput?: () => void; // Callback pentru navigare la pagina de input
}

const VehicleNumberDropdown: React.FC<VehicleNumberDropdownProps> = ({
  value,
  onChange,
  darkMode = false,
  disabled = false,
  onNavigateToInput
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<string[]>([]);
  const [showInputPage, setShowInputPage] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getVehicleNumberHistory();
      setVehicleHistory(history);
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (showInputPage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInputPage]);

  const handleVehicleSelect = (vehicle: string) => {
    onChange(vehicle);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    setInputValue(cleanValue);
  };

  const handleInputConfirm = () => {
    console.log('🔄 handleInputConfirm called - inputValue:', inputValue.trim());
    console.log('🔄 onChange function available:', typeof onChange);
    
    if (inputValue.trim()) {
      console.log('✅ Calling onChange with value:', inputValue.trim());
      onChange(inputValue.trim());
      
      console.log('✅ Closing input page and clearing state');
      setShowInputPage(false);
      setInputValue('');
      setIsOpen(false);
      
      console.log('✅ Vehicle number successfully added!');
    } else {
      console.log('❌ Input value is empty, not submitting');
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputConfirm();
    } else if (e.key === 'Escape') {
      setShowInputPage(false);
      setInputValue('');
    }
  };

  const handleRemoveVehicle = async (vehicle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await removeVehicleNumberFromHistory(vehicle);
      const updatedHistory = await getVehicleNumberHistory();
      setVehicleHistory(updatedHistory);
    } catch (error) {
      console.error('Eroare la eliminarea vehiculului din istoric:', error);
    }
  };

  const filteredHistory = vehicleHistory.filter(v => v !== value);

  if (showInputPage) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: darkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '40px 20px',
        paddingTop: 'max(40px, env(safe-area-inset-top))',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
        minHeight: '100vh'
      }}>
        {/* Decorative Background Elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: darkMode 
            ? 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: darkMode 
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite reverse'
        }}></div>

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            
            .input-container {
              background: ${darkMode 
                ? 'rgba(30, 41, 59, 0.8)' 
                : 'rgba(255, 255, 255, 0.95)'
              };
              backdrop-filter: blur(10px);
              border: 1px solid ${darkMode 
                ? 'rgba(148, 163, 184, 0.2)' 
                : 'rgba(203, 213, 225, 0.4)'
              };
              border-radius: 24px;
              padding: 40px;
              box-shadow: ${darkMode 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
              };
              max-width: 400px;
              width: 100%;
              position: relative;
              overflow: hidden;
            }
            
            .input-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #22c55e 0%, #3b82f6 50%, #8b5cf6 100%);
            }

            .vehicle-input {
              width: 100%;
              padding: 20px 24px;
              background: ${darkMode 
                ? 'rgba(15, 23, 42, 0.6)' 
                : 'rgba(248, 250, 252, 0.8)'
              };
              border: 2px solid ${darkMode 
                ? 'rgba(148, 163, 184, 0.3)' 
                : 'rgba(203, 213, 225, 0.5)'
              };
              border-radius: 16px;
              color: ${darkMode ? '#ffffff' : '#1e293b'};
              fontSize: 18px;
              fontWeight: 600;
              textAlign: center;
              outline: none;
              letterSpacing: 2px;
              textTransform: uppercase;
              transition: all 0.3s ease;
              margin-bottom: 32px;
            }

            .vehicle-input:focus {
              border-color: #22c55e;
              box-shadow: 0 0 0 4px ${darkMode 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(34, 197, 94, 0.1)'
              };
              transform: scale(1.02);
            }

            .button-primary {
              padding: 16px 32px;
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: #ffffff;
              border: none;
              border-radius: 14px;
              fontSize: 16px;
              fontWeight: 700;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 14px 0 rgba(34, 197, 94, 0.3);
              text-transform: uppercase;
              letter-spacing: 1px;
              position: relative;
              overflow: hidden;
            }

            .button-primary:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px 0 rgba(34, 197, 94, 0.4);
            }

            .button-primary:active:not(:disabled) {
              transform: translateY(0px);
            }

            .button-primary:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
              background: ${darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.3)'};
            }

            .button-secondary {
              padding: 16px 32px;
              background: ${darkMode 
                ? 'rgba(239, 68, 68, 0.8)' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              };
              color: #ffffff;
              border: none;
              border-radius: 14px;
              fontSize: 16px;
              fontWeight: 700;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3);
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .button-secondary:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px 0 rgba(239, 68, 68, 0.4);
            }

            .button-secondary:active {
              transform: translateY(0px);
            }
          `}
        </style>
        
        <div className="input-container">
          {/* Header with Icon */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: darkMode 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px',
              color: '#ffffff',
              boxShadow: darkMode 
                ? '0 8px 32px rgba(34, 197, 94, 0.3)'
                : '0 8px 32px rgba(59, 130, 246, 0.3)'
            }}>
              🚗
            </div>
            
            <h2 style={{
              color: darkMode ? '#ffffff' : '#1e293b',
              fontSize: '28px',
              fontWeight: '700',
              margin: 0,
              textAlign: 'center',
              background: darkMode 
                ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Adaugă Vehicul Nou
            </h2>
            
            <p style={{
              color: darkMode ? 'rgba(148, 163, 184, 0.8)' : 'rgba(100, 116, 139, 0.8)',
              fontSize: '14px',
              margin: '12px 0 0',
              fontWeight: '500'
            }}>
              Introdu numărul de înmatriculare
            </p>
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Ex: B123ABC"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyPress}
            className="vehicle-input"
            autoFocus
          />
          
          {/* Action Buttons - Submit în DREAPTA conform cerințelor */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            justifyContent: 'space-between'
          }}>
            {/* ANULEAZĂ - în STÂNGA */}
            <button
              onClick={() => {
                setShowInputPage(false);
                setInputValue('');
              }}
              className="button-secondary"
              type="button"
            >
              ✕
            </button>
            
            {/* CONFIRMĂ - în DREAPTA (submit) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('🔄 Submit click - inputValue:', inputValue.trim());
                if (inputValue.trim()) {
                  handleInputConfirm();
                }
              }}
              disabled={!inputValue.trim()}
              className="button-primary"
              type="submit"
            >
              ✓
            </button>
          </div>

          {/* Helper Text */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: darkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)',
            fontStyle: 'italic'
          }}>
            Apasă Enter pentru confirmare rapidă
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '200px', minWidth: '160px' }}>
      {/* Compact Display Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          border: darkMode ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: '10px',
          color: darkMode ? '#ffffff' : '#1e293b',
          fontSize: '13px',
          fontWeight: '600',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ flex: 1 }}>
          {value || 'Vehicul'}
        </span>
        <span style={{ 
          fontSize: '12px', 
          marginLeft: '8px',
          opacity: 0.7,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          border: darkMode ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: '10px',
          marginTop: '4px',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Add New Button */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              // Folosește callback pentru navigare la pagina de input în loc de popup
              if (onNavigateToInput) {
                onNavigateToInput();
              } else {
                setShowInputPage(true);
              }
            }}
            style={{
              padding: '12px 16px',
              color: darkMode ? '#22c55e' : '#16a34a',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'center',
              cursor: 'pointer',
              borderBottom: filteredHistory.length > 0 
                ? (darkMode ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)')
                : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'transparent',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            <span>Adaugă vehicul nou</span>
          </div>

          {/* Vehicle History */}
          {filteredHistory.map((vehicle, index) => (
            <div
              key={vehicle}
              style={{
                padding: '12px 16px',
                color: darkMode ? '#ffffff' : '#1e293b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: index < filteredHistory.length - 1 
                  ? (darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)')
                  : 'none',
                transition: 'background 0.2s ease'
              }}
              onClick={() => handleVehicleSelect(vehicle)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{vehicle}</span>
              <button
                onClick={(e) => handleRemoveVehicle(vehicle, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: darkMode ? '#ef4444' : '#dc2626',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Elimină din istoric"
              >
                ✕
              </button>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div style={{
              padding: '16px',
              color: darkMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)',
              fontSize: '12px',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Niciun vehicul în istoric
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleNumberDropdown;