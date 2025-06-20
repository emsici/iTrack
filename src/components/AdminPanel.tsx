import React, { useState, useEffect } from 'react';
import { getAppLogs, clearAppLogs, AppLog } from '../services/appLogger';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AppLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  // Capture console logs and store them
  useEffect(() => {
    const capturedLogs: AppLog[] = [];
    
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    };

    const addLog = (level: AppLog['level'], message: string) => {
      const newLog: AppLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleString('ro-RO'),
        level,
        message
      };
      
      capturedLogs.unshift(newLog);
      if (capturedLogs.length > 200) capturedLogs.pop(); // Keep only last 200 logs
      setLogs([...capturedLogs]);
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('INFO', args.join(' '));
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('WARN', args.join(' '));
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('ERROR', args.join(' '));
    };

    console.debug = (...args) => {
      originalConsole.debug(...args);
      addLog('DEBUG', args.join(' '));
    };

    // Add initial logs
    addLog('INFO', 'Admin Panel - Console logging started');
    addLog('INFO', 'Ready for debugging on mobile device');
    
    // Cleanup function
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, []);

  // Filter logs based on search criteria
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedLevel]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return '#10b981';
      case 'WARN': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      case 'DEBUG': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const clearLogs = () => {
    setLogs([]);
    console.log('Logs cleared by admin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>
            🔧 Admin Debug Panel
          </h2>
          <button
            onClick={onLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <input
            type="text"
            placeholder="Caută în logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '14px'
            }}
          />
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '14px'
            }}
          >
            <option value="">Toate nivelurile</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          <button
            onClick={clearLogs}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          📊 Total logs: {filteredLogs.length}
        </div>
      </div>

      {/* Logs Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}>
        {filteredLogs.length > 0 ? (
          <div>
            {filteredLogs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    background: getLevelColor(log.level),
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    minWidth: '45px',
                    textAlign: 'center'
                  }}>
                    {log.level}
                  </span>
                  <span style={{
                    color: '#6b7280',
                    fontSize: '11px',
                    minWidth: '120px'
                  }}>
                    {log.timestamp}
                  </span>
                </div>
                <div style={{
                  color: '#374151',
                  marginLeft: '57px',
                  wordBreak: 'break-word',
                  fontFamily: 'Monaco, Menlo, monospace',
                  fontSize: '12px'
                }}>
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📱</div>
            <div>Niciun log găsit</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Interacționează cu aplicația pentru a vedea log-urile
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;