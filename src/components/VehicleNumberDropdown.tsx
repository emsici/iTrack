import React, { useState, useEffect, useRef } from 'react';
import { getVehicleNumberHistory, removeVehicleNumberFromHistory } from '../services/storage';

interface VehicleNumberDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}

const VehicleNumberDropdown: React.FC<VehicleNumberDropdownProps> = ({
  value,
  onChange,
  placeholder = "Introduceți numărul vehiculului",
  darkMode = false,
  onKeyPress,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
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
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleVehicleSelect = (vehicle: string) => {
    onChange(vehicle);
    setIsOpen(false);
    setShowInput(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    onChange(cleanValue);
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

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Main Input */}
      {showInput || !value ? (
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyPress={onKeyPress}
          onBlur={() => {
            if (!value) {
              setShowInput(false);
            }
          }}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '20px',
            background: disabled 
              ? (darkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(148, 163, 184, 0.2)')
              : (darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)'),
            border: darkMode ? '2px solid rgba(148, 163, 184, 0.2)' : '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            color: darkMode ? '#ffffff' : '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center',
            outline: 'none',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '20px',
            background: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            border: darkMode ? '2px solid rgba(148, 163, 184, 0.2)' : '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            color: darkMode ? '#ffffff' : '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ flex: 1 }}>{value}</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {filteredHistory.length > 0 && (
              <i 
                className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b',
                  fontSize: '14px',
                  transition: 'transform 0.3s ease'
                }}
              />
            )}
            <i 
              className="fas fa-edit"
              onClick={(e) => {
                e.stopPropagation();
                setShowInput(true);
              }}
              style={{ 
                color: darkMode ? '#60a5fa' : '#2563eb',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px'
              }}
            />
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          /* REMOVED blur pentru telefoane vechi */
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          /* REMOVED heavy shadow pentru telefoane vechi */
          boxShadow: 'none',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-history" style={{
              color: darkMode ? '#60a5fa' : '#2563eb',
              fontSize: '16px'
            }}/>
            <span style={{
              color: darkMode ? '#94a3b8' : '#64748b',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Vehicule recente
            </span>
          </div>

          {/* Add New Vehicle Button */}
          <div
            onClick={() => {
              setShowInput(true);
              setIsOpen(false);
            }}
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              borderBottom: filteredHistory.length > 0 
                ? (darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)')
                : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = darkMode 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(34, 197, 94, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <i className="fas fa-plus" style={{
              color: darkMode ? '#34d399' : '#059669',
              fontSize: '14px'
            }}/>
            <span style={{
              color: darkMode ? '#34d399' : '#059669',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Adaugă număr nou
            </span>
          </div>

          {/* Vehicle History List */}
          {filteredHistory.map((vehicle, index) => (
            <div
              key={vehicle}
              onClick={() => handleVehicleSelect(vehicle)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderBottom: index < filteredHistory.length - 1 
                  ? (darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)')
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = darkMode 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(59, 130, 246, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fas fa-truck" style={{
                  color: darkMode ? '#60a5fa' : '#2563eb',
                  fontSize: '14px'
                }}/>
                <span style={{
                  color: darkMode ? '#f1f5f9' : '#1e293b',
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  {vehicle}
                </span>
              </div>
              <i 
                className="fas fa-times"
                onClick={(e) => handleRemoveVehicle(vehicle, e)}
                style={{
                  color: darkMode ? '#ef4444' : '#dc2626',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = darkMode 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              />
            </div>
          ))}

          {/* Add New Vehicle Button */}
          <div
            onClick={() => {
              setShowInput(true);
              setIsOpen(false);
            }}
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = darkMode 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(34, 197, 94, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <i className="fas fa-plus" style={{
              color: darkMode ? '#4ade80' : '#16a34a',
              fontSize: '14px'
            }}/>
            <span style={{
              color: darkMode ? '#4ade80' : '#16a34a',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Adaugă vehicul nou
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleNumberDropdown;