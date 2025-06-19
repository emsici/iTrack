import React, { useState, useEffect } from 'react';

interface AdminPanelProps {
  onLogout: () => void;
}

interface AppLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  message: string;
  details?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AppLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

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

    const addLog = (level: AppLog['level'], component: string, message: string, details?: any) => {
      const newLog: AppLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        level,
        component,
        message,
        details
      };
      
      capturedLogs.unshift(newLog);
      if (capturedLogs.length > 500) capturedLogs.pop(); // Keep only last 500 logs
      setLogs([...capturedLogs]);
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('INFO', 'Console', args.join(' '));
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('WARN', 'Console', args.join(' '));
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('ERROR', 'Console', args.join(' '));
    };

    console.debug = (...args) => {
      originalConsole.debug(...args);
      addLog('DEBUG', 'Console', args.join(' '));
    };

    // Add some initial logs
    addLog('INFO', 'AdminPanel', 'Admin panel initialized');
    addLog('INFO', 'System', 'Console logging intercepted for debugging');
    
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
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.component.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (selectedComponent) {
      filtered = filtered.filter(log => log.component === selectedComponent);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedLevel, selectedComponent]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return '#10b981';
      case 'WARN': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      case 'DEBUG': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const uniqueComponents = [...new Set(logs.map(log => log.component))];

  const clearLogs = () => {
    setLogs([]);
    console.log('Admin logs cleared');
  };

  return (
    <div className="admin-panel">
      <style jsx>{`
        .admin-panel {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
          padding: env(safe-area-inset-top, 20px) 20px calc(80px + env(safe-area-inset-bottom, 20px)) 20px;
        }

        .admin-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .admin-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .admin-title h1 {
          color: #1e293b;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .admin-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(145deg, #3b82f6, #1d4ed8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .logout-btn {
          background: linear-gradient(145deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        .filters-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .filter-group {
          position: relative;
        }

        .filter-input,
        .filter-select {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          border: 2px solid rgba(59, 130, 246, 0.2);
        }

        .toggle-switch {
          position: relative;
          width: 50px;
          height: 24px;
          background: ${autoRefresh ? '#10b981' : '#d1d5db'};
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: ${autoRefresh ? '26px' : '2px'};
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .logs-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logs-header {
          background: linear-gradient(145deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 20px 25px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logs-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
        }

        .logs-table th {
          background: #f8fafc;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          font-size: 0.9rem;
        }

        .logs-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.85rem;
          color: #374151;
        }

        .logs-table tr:hover {
          background: #f9fafb;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-align: center;
        }

        .coordinates {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .no-logs {
          text-align: center;
          padding: 40px;
          color: #6b7280;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .logs-table {
            font-size: 0.8rem;
          }
          
          .logs-table th,
          .logs-table td {
            padding: 8px 6px;
          }
          
          .filters-section {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-header">
        <div className="admin-title">
          <h1>
            <div className="admin-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            Admin Panel - GPS Logs
          </h1>
          <button className="logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              placeholder="Caută vehicul sau UIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">Toate vehiculele</option>
              {uniqueVehicles.map(vehicle => (
                <option key={vehicle} value={vehicle}>{vehicle}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Toate statusurile</option>
              <option value="2">Activ</option>
              <option value="3">Pauză</option>
              <option value="4">Oprit</option>
            </select>
          </div>

          <div className="auto-refresh-toggle">
            <span>Auto-refresh</span>
            <div 
              className="toggle-switch" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="logs-container">
        <div className="logs-header">
          <span>
            <i className="fas fa-satellite-dish"></i> GPS Transmissions
          </span>
          <div className="logs-count">
            {filteredLogs.length} înregistrări
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Vehicul</th>
                <th>UIT</th>
                <th>Coordonate</th>
                <th>Viteză</th>
                <th>Status</th>
                <th>Acuratețe</th>
                <th>Baterie</th>
                <th>GSM</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td><strong>{log.vehicleNumber}</strong></td>
                  <td>{log.uit}</td>
                  <td className="coordinates">
                    {log.latitude.toFixed(6)}<br/>
                    {log.longitude.toFixed(6)}
                  </td>
                  <td>{log.speed} km/h</td>
                  <td>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(log.status) }}
                    >
                      {getStatusText(log.status)}
                    </div>
                  </td>
                  <td>{log.accuracy}m</td>
                  <td>{log.battery}%</td>
                  <td>{log.gsmSignal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-logs">
            <i className="fas fa-satellite-dish" style={{ fontSize: '3rem', marginBottom: '20px', color: '#d1d5db' }}></i>
            <br />
            Niciun log GPS găsit pentru criteriile de căutare.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;