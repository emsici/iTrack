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
    if (inputValue.trim()) {
      onChange(inputValue.trim());
      setShowInputPage(false);
      setInputValue('');
      setIsOpen(false);
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
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '40px 20px', // Padding top/bottom mărit pentru safe area
        paddingTop: 'max(40px, env(safe-area-inset-top))', // Safe area pentru bara de sistem
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))' // Safe area pentru bara de navigare
      }}>
        <h3 style={{
          color: darkMode ? '#ffffff' : '#1e293b',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          Adaugă număr vehicul nou
        </h3>
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Ex: B123ABC"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyPress}
          style={{
            width: '280px',
            padding: '15px 20px',
            background: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            border: darkMode ? '2px solid rgba(148, 163, 184, 0.3)' : '2px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            color: darkMode ? '#ffffff' : '#1e293b',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            outline: 'none',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '30px'
          }}
        />
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={handleInputConfirm}
            disabled={!inputValue.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: !inputValue.trim() 
                ? (darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.3)')
                : (darkMode ? '#22c55e' : '#16a34a'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: !inputValue.trim() ? 0.5 : 1
            }}
          >
            ✓ Confirmă
          </button>
          
          <button
            onClick={() => {
              setShowInputPage(false);
              setInputValue('');
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.8)' : '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✕ Anulează
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '220px' }}>
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
          fontSize: '14px',
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