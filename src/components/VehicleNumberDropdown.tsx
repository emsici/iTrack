import React, { useState, useEffect, useRef } from 'react';
import { getVehicleNumberHistory, removeVehicleNumberFromHistory } from '../services/storage';

interface VehicleNumberDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  onNavigateToInput?: () => void; // Callback pentru navigare la pagina de input
  // Noi props pentru header usage
  currentVehicle?: string;
  onVehicleSelect?: (vehicle: string) => void;
  theme?: 'default' | 'header';
  currentTheme?: string; // Pentru compatibilitate cu sistemul de teme
}

const VehicleNumberDropdown: React.FC<VehicleNumberDropdownProps> = ({
  value,
  onChange,
  darkMode = false,
  disabled = false,
  onNavigateToInput,
  // Noi props
  currentVehicle,
  onVehicleSelect,
  theme = 'default',
  currentTheme = 'dark'
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
    // Header theme folosește onVehicleSelect, default theme folosește onChange
    if (theme === 'header' && onVehicleSelect) {
      onVehicleSelect(vehicle);
    } else if (onChange) {
      onChange(vehicle);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    setInputValue(cleanValue);
  };

  const handleInputConfirm = () => {
    console.log('🔄 handleInputConfirm apelat - inputValue:', inputValue.trim());
    console.log('🔄 funția onChange disponibilă:', typeof onChange);
    
    if (inputValue.trim()) {
      console.log('✅ Apelez callback cu valoarea:', inputValue.trim());
      
      // Header theme folosește onVehicleSelect, default theme folosește onChange
      if (theme === 'header' && onVehicleSelect) {
        onVehicleSelect(inputValue.trim());
      } else if (onChange) {
        onChange(inputValue.trim());
      }
      
      console.log('✅ Închid pagina de input și curăț starea');
      setShowInputPage(false);
      setInputValue('');
      setIsOpen(false);
      
      console.log('✅ Numărul vehiculului adăugat cu succes!');
    } else {
      console.log('❌ Valoarea input este goală, nu trimit');
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

  const filteredHistory = vehicleHistory.filter(v => v !== (value || currentVehicle));

  // Funcție pentru obținerea culorilor temei curente
  const getThemeColors = () => {
    const themes: Record<string, {bg: string, text: string, cardBg: string, border: string}> = {
      dark: {
        bg: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        text: '#ffffff',
        cardBg: 'rgba(45, 55, 72, 0.98)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      light: {
        bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        text: '#1e293b',
        cardBg: 'rgba(255, 255, 255, 0.98)',
        border: 'rgba(0, 0, 0, 0.1)'
      },
      business: {
        bg: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
        text: '#ffffff',
        cardBg: 'rgba(30, 58, 138, 0.98)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      driver: {
        bg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        text: '#ffffff',
        cardBg: 'rgba(6, 95, 70, 0.98)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      nature: {
        bg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        text: '#ffffff',
        cardBg: 'rgba(22, 101, 52, 0.98)',
        border: 'rgba(255, 255, 255, 0.2)'
      },
      night: {
        bg: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)',
        text: '#ffffff',
        cardBg: 'rgba(76, 29, 149, 0.98)',
        border: 'rgba(255, 255, 255, 0.2)'
      }
    };
    return themes[currentTheme] || themes.dark;
  };

  const themeColors = getThemeColors();

  if (showInputPage) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: themeColors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1000,
        padding: '20px',
        paddingTop: '5px', // MUTAT FOARTE SUS pentru tastatura
        paddingBottom: '20px',
        minHeight: '100vh',
        overflowY: 'auto'
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
              background: ${themeColors.cardBg};
              backdrop-filter: blur(15px);
              border: 2px solid ${themeColors.border};
              border-radius: 20px;
              padding: 32px 24px;
              box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
              max-width: 380px;
              width: 100%;
              position: relative;
              overflow: hidden;
              margin-top: -20px; /* MUTAT MAI SUS pentru tastatura */
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
              padding: 20px 24px; /* MĂRIT PADDING pentru confort */
              background: ${currentTheme === 'light' ? 'rgba(248, 250, 252, 0.8)' : 'rgba(15, 23, 42, 0.6)'};
              border: 2px solid ${themeColors.border};
              border-radius: 12px;
              color: ${themeColors.text};
              fontSize: 16px;
              fontWeight: 600;
              textAlign: center;
              outline: none;
              letterSpacing: 2px;
              textTransform: uppercase;
              transition: all 0.3s ease;
              margin-bottom: 16px;
            }

            .vehicle-input:focus {
              border-color: #22c55e;
              box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
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
        
        <div className="input-container" style={{ marginTop: '-40px' }}>
          {/* Header with Icon - COMPACT pentru tastatura */}
          <div style={{
            textAlign: 'center',
            marginBottom: '8px' // REDUS pentru spatiu
          }}>
            <div style={{
              width: '40px', // REDUS
              height: '40px', // REDUS
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '12px', // REDUS
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px', // REDUS
              fontSize: '18px', // REDUS
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
            }}>
              🚗
            </div>
            
            <h2 style={{
              color: themeColors.text,
              fontSize: '18px', // REDUS
              fontWeight: '700',
              margin: 0,
              textAlign: 'center'
            }}>
              Adaugă Vehicul Nou
            </h2>
            
            <p style={{
              color: currentTheme === 'light' ? 'rgba(100, 116, 139, 0.8)' : 'rgba(148, 163, 184, 0.8)',
              fontSize: '12px', // REDUS
              margin: '4px 0 0', // REDUS
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

  // Header theme - doar dropdown styling fără input pagina
  if (theme === 'header') {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Header dropdown button */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'rgba(74, 85, 104, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '14px', color: '#cbd5e0' }}>
            {currentVehicle || 'VEHICUL'}
          </span>
          <i className="fas fa-chevron-down" style={{ 
            fontSize: '12px', 
            color: '#cbd5e0',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}></i>
        </div>

        {/* Dropdown menu pentru header */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            minWidth: '200px',
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            marginTop: '8px',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}>
            {/* Istoric vehicule */}
            {filteredHistory.length > 0 && (
              <>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Istoric
                </div>
                {filteredHistory.slice(0, 5).map((vehicle) => (
                  <div
                    key={vehicle}
                    onClick={() => handleVehicleSelect(vehicle)}
                    style={{
                      padding: '12px 16px',
                      color: '#cbd5e0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{vehicle}</span>
                    <i className="fas fa-arrow-right" style={{ fontSize: '10px', opacity: 0.5 }}></i>
                  </div>
                ))}
              </>
            )}

            {/* Adaugă nou */}
            <div style={{
              padding: '12px 16px',
              borderTop: filteredHistory.length > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              color: '#4ade80',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setIsOpen(false);
              setShowInputPage(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}>
              <i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
              Adaugă vehicul nou
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default theme
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
                color: (darkMode || currentTheme === 'dark') ? '#ffffff' : '#1e293b',
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