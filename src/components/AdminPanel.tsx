import React, { useState, useEffect } from 'react';
import { getAppLogs, clearAppLogs, AppLog } from '../services/appLogger';

interface AdminPanelProps {
  onLogout?: () => void;
  onClose?: () => void;
  vehicleNumber?: string;
  courses?: any[];
  currentTheme?: string;
  isInline?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onLogout, 
  onClose, 
  vehicleNumber, 
  courses = [], 
  currentTheme = 'dark', 
  isInline = false 
}) => {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AppLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isCopyingLogs, setIsCopyingLogs] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load logs from persistent storage
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const appLogs = await getAppLogs();
        setLogs(appLogs);
      } catch (error) {
        console.error('Eșec la încărcarea log-urilor:', error);
      }
    };

    loadLogs();
    
    // Actualizează log-urile la fiecare 2 secunde pentru a afișa intrări noi
    const interval = setInterval(loadLogs, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Copy logs to clipboard
  const copyLogs = async () => {
    setIsCopyingLogs(true);
    setCopySuccess(false);
    
    try {
      const logText = logs.map(log => 
        `[${log.timestamp}] ${log.level} ${log.category ? `(${log.category})` : ''}: ${log.message}`
      ).join('\n');
      
      const fullText = `iTrack Application Logs\nGenerated: ${new Date().toLocaleString('ro-RO')}\nTotal Logs: ${logs.length}\n\n${logText}`;
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
        setCopySuccess(true);
        console.log('Log-uri copiate cu succes în clipboard');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopySuccess(true);
          console.log('Log-uri copiate folosind metoda de rezervă');
        } else {
          throw new Error('Copierea de rezervă a eșuat');
        }
      }
      
      // Reset success indicator after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
      
    } catch (error) {
      console.error('Eșec la copierea log-urilor:', error);
      alert('Eșec la copierea log-urilor în clipboard. Încercați din nou.');
    } finally {
      setIsCopyingLogs(false);
    }
  };

  // Clear logs functionality
  const handleClearLogs = async () => {
    try {
      await clearAppLogs();
      setLogs([]);
      console.log('Log-uri șterse cu succes');
    } catch (error) {
      console.error('Eroare la ștergerea log-urilor:', error);
    }
  };

  // Removed unused function - cleaned up

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
      case 'ERROR': return '#dc2626';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#2563eb';
      case 'DEBUG': return '#6b7280';
      default: return '#374151';
    }
  };



  // Inline styles for embedded debug panel
  const containerStyle = isInline ? {
    backgroundColor: 'transparent',
    fontFamily: 'monospace',
    fontSize: '12px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    padding: '0'
  } : {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    zIndex: 999999,
    fontFamily: 'monospace',
    overflow: 'hidden',
    padding: '20px',
    boxSizing: 'border-box' as const
  };

  const headerStyle = isInline ? {
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } : {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <div 
      style={containerStyle}
      onClick={isInline ? undefined : (e) => {
        e.stopPropagation();
      }}
    >
      {!isInline && (
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Panou Admin - Consola Debug</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                title="Înapoi la aplicație - NU se deloghează"
              >
                ← Înapoi la App
              </button>
            )}
            {onLogout && (
              <button
                onClick={() => {
                  if (confirm('Sigur vrei să te deloghezi complet din aplicație?')) {
                    onLogout();
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                title="Deloghează complet din aplicație"
              >
                Logout Complet
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Caută în log-uri..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            flex: '1',
            minWidth: '200px'
          }}
        />
        
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        >
          <option value="">Toate Nivelurile</option>
          <option value="ERROR">Eroare</option>
          <option value="WARN">Avertizare</option>
          <option value="INFO">Informare</option>
          <option value="DEBUG">Debug</option>
        </select>

        <button
          onClick={copyLogs}
          disabled={isCopyingLogs}
          style={{
            padding: '8px 16px',
            backgroundColor: copySuccess ? '#22c55e' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isCopyingLogs ? 'not-allowed' : 'pointer',
            marginRight: '8px',
            opacity: isCopyingLogs ? 0.6 : 1
          }}
        >
          {isCopyingLogs ? 'Se copiază...' : copySuccess ? 'Copiat!' : 'Copiază Log-uri'}
        </button>
        
        <button
          onClick={handleClearLogs}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Șterge Log-uri
        </button>
      </div>

      <div style={{
        backgroundColor: '#1e293b',
        color: '#e2e8f0',
        padding: '16px',
        borderRadius: '8px',
        height: 'calc(100vh - 200px)',
        overflow: 'auto',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        <div style={{ marginBottom: '12px', color: '#64748b' }}>
          Se afișează {filteredLogs.length} din {logs.length} log-uri
        </div>
        
        {filteredLogs.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
            Nu există log-uri disponibile. Activitățile GPS și aplicație vor apărea aici.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#334155',
                borderRadius: '4px',
                borderLeft: `4px solid ${getLevelColor(log.level)}`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  color: getLevelColor(log.level),
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  [{log.level}] {log.category || 'APP'}
                </span>
                <span style={{
                  color: '#94a3b8',
                  fontSize: '11px'
                }}>
                  {new Date(log.timestamp).toLocaleString('ro-RO')}
                </span>
              </div>
              <div style={{ color: '#f1f5f9', wordBreak: 'break-word' }}>
                {log.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;