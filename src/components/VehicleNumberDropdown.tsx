import React, { useState, useEffect, useRef } from 'react';
import { getVehicleNumberHistory, removeVehicleNumberFromHistory } from '../services/storage';
import { Theme } from '../services/themeService';

interface VehicleNumberDropdownProps {
  currentVehicle: string;
  currentTheme: Theme;
  onSelectVehicle: (vehicle: string) => void;
  onChangeNumber: () => void;
}

const VehicleNumberDropdown: React.FC<VehicleNumberDropdownProps> = ({
  currentVehicle,
  currentTheme,
  onSelectVehicle,
  onChangeNumber
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getVehicleNumberHistory();
      setVehicleHistory(history);
    };
    loadHistory();
  }, [currentVehicle]);

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

  const handleVehicleSelect = (vehicle: string) => {
    onSelectVehicle(vehicle);
    setIsOpen(false);
  };

  const handleChangeNumber = () => {
    onChangeNumber();
    setIsOpen(false);
  };

  const handleRemoveVehicle = async (vehicle: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent dropdown close
    try {
      await removeVehicleNumberFromHistory(vehicle);
      const updatedHistory = await getVehicleNumberHistory();
      setVehicleHistory(updatedHistory);
    } catch (error) {
      console.error('Error removing vehicle from history:', error);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Main Vehicle Badge */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: currentTheme === 'light' 
            ? 'rgba(71, 85, 105, 0.08)' 
            : currentTheme === 'business'
              ? 'rgba(71, 85, 105, 0.08)' 
              : 'rgba(255, 255, 255, 0.1)', 
          border: currentTheme === 'light' 
            ? '1px solid rgba(71, 85, 105, 0.2)' 
            : currentTheme === 'business'
              ? '1px solid rgba(71, 85, 105, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '8px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer',
          minWidth: '120px',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fas fa-truck" style={{ color: '#60a5fa', fontSize: '14px' }}></i>
        <span style={{ 
          color: currentTheme === 'light' 
            ? '#1e293b' 
            : currentTheme === 'business'
              ? '#1e293b' 
              : '#ffffff', 
          fontSize: '14px', 
          fontWeight: '600',
          letterSpacing: '0.3px'
        }}>
          {currentVehicle}
        </span>
        <i 
          className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} 
          style={{ 
            color: currentTheme === 'light' || currentTheme === 'business' 
              ? '#64748b' 
              : '#9ca3af', 
            fontSize: '10px',
            transition: 'transform 0.2s ease'
          }}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          marginTop: '4px',
          background: currentTheme === 'dark' 
            ? 'rgba(30, 41, 59, 0.95)' 
            : currentTheme === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : currentTheme === 'business'
                ? 'rgba(248, 250, 252, 0.95)'
                : currentTheme === 'nature'
                  ? 'rgba(6, 95, 70, 0.95)'
                  : currentTheme === 'night'
                    ? 'rgba(49, 46, 129, 0.95)'
                    : currentTheme === 'driver'
                      ? 'rgba(41, 37, 36, 0.95)'
                      : 'rgba(30, 41, 59, 0.95)',
          border: currentTheme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          boxShadow: currentTheme === 'dark'
            ? '0 8px 25px rgba(0, 0, 0, 0.3)'
            : '0 8px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {/* Change Number Option */}
          <div
            onClick={handleChangeNumber}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: currentTheme === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'transparent',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTheme === 'dark'
                ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(59, 130, 246, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <i className="fas fa-edit" style={{ 
              color: '#3b82f6', 
              fontSize: '14px',
              width: '16px'
            }}></i>
            <span style={{
              color: currentTheme === 'light' || currentTheme === 'business'
                ? '#1e293b'
                : '#ffffff',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Schimbă numărul
            </span>
          </div>

          {/* Vehicle History */}
          {vehicleHistory.length > 0 && (
            <>
              <div style={{
                padding: '8px 16px',
                color: currentTheme === 'light' || currentTheme === 'business'
                  ? '#64748b'
                  : '#94a3b8',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Istoric numere
              </div>
              {vehicleHistory.map((vehicle, index) => (
                <div
                  key={index}
                  onClick={() => handleVehicleSelect(vehicle)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: vehicle === currentVehicle 
                      ? (currentTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                      : 'transparent',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (vehicle !== currentVehicle) {
                      e.currentTarget.style.background = currentTheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (vehicle !== currentVehicle) {
                      e.currentTarget.style.background = vehicle === currentVehicle 
                        ? (currentTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                        : 'transparent';
                    }
                  }}
                >
                  <i className="fas fa-truck" style={{ 
                    color: vehicle === currentVehicle ? '#3b82f6' : '#9ca3af', 
                    fontSize: '12px',
                    width: '16px'
                  }}></i>
                  <span style={{
                    color: currentTheme === 'light' || currentTheme === 'business'
                      ? '#1e293b'
                      : '#ffffff',
                    fontSize: '14px',
                    fontWeight: vehicle === currentVehicle ? '600' : '500',
                    flex: 1
                  }}>
                    {vehicle}
                  </span>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleRemoveVehicle(vehicle, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s ease',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = currentTheme === 'dark'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                    title={`Șterge ${vehicle} din istoric`}
                  >
                    <i className="fas fa-times" style={{ 
                      color: '#ef4444', 
                      fontSize: '12px'
                    }}></i>
                  </button>
                  
                  {vehicle === currentVehicle && (
                    <i className="fas fa-check" style={{ 
                      color: '#3b82f6', 
                      fontSize: '12px',
                      marginLeft: '8px'
                    }}></i>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleNumberDropdown;