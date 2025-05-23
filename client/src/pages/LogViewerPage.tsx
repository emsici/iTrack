import { useState, useEffect } from 'react';
import { 
  getLogs, 
  clearLogs, 
  filterLogsByLevel, 
  filterLogsBySource, 
  exportLogsAsJson,
  isAdminUser,
  addLog,
  type LogEntry
} from '../lib/logService';
import { processMobileLogFile } from '../lib/mobileLogService';

export default function LogViewerPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [filterSource, setFilterSource] = useState('');
  const [error, setError] = useState('');
  const [mobileLogContent, setMobileLogContent] = useState('');
  const [showMobileLogImport, setShowMobileLogImport] = useState(false);
  
  // Efect pentru a adăuga un log când pagina este accesată și pentru a auto-logare dacă venim de la pagina de login
  useEffect(() => {
    addLog('Pagina de loguri accesată', 'info', 'admin-page');
    
    // Auto-logare pentru admin dacă pagina a fost deschisă prin redirecționare de la login
    // Verificăm localStorage pentru a vedea dacă au fost stocate credențialele admin
    const fromLoginPage = sessionStorage.getItem('fromAdminLogin');
    if (fromLoginPage === 'true') {
      // Precompletăm credențialele de admin și autentificăm automat
      setEmail('admin@itrack.app');
      setPassword('admin123');
      setIsAuthenticated(true);
      refreshLogs();
      // Ștergem flag-ul după utilizare
      sessionStorage.removeItem('fromAdminLogin');
      addLog('Autentificare automată administrator', 'info', 'admin-page');
    }
  }, []);

  // Sursele unice din loguri
  const uniqueSources = Array.from(new Set(getLogs().map(log => log.source)));

  // Autentificare - verifică local pentru admin, apoi eventual către API pentru alți utilizatori
  const handleLogin = async () => {
    try {
      // Verificăm mai întâi dacă sunt credențialele de admin definite local
      if (isAdminUser(email, password)) {
        // Dacă sunt creditențiale de admin, autentificăm direct fără a trimite la API
        setIsAuthenticated(true);
        refreshLogs();
        setError('');
        addLog('Autentificare administrator reușită', 'info', 'admin-page');
        return; // Important - ieșim din funcție, nu mai trimitem date la API
      }
      
      // Dacă nu sunt creditențiale de admin, atunci respingem direct
      // (eventual aici am putea verifica și cu API-ul pentru alte credențiale)
      setError('Credențiale invalide. Accesul este permis doar pentru utilizatorii administratori.');
      addLog('Încercare de autentificare eșuată', 'warn', 'admin-page', { email });
      
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      setError('Eroare la procesarea autentificării. Încercați din nou.');
    }
  };

  // Refresh loguri cu filtre aplicate
  const refreshLogs = () => {
    let filteredLogs = getLogs();
    
    // Aplicăm filtrul de nivel
    if (filterLevel !== 'all') {
      filteredLogs = filterLogsByLevel(filterLevel);
    }
    
    // Aplicăm filtrul de sursă
    if (filterSource) {
      filteredLogs = filterSource === 'all' 
        ? filteredLogs 
        : filteredLogs.filter(log => log.source === filterSource);
    }
    
    // Ordonăm după timestamp (cele mai recente primele)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setLogs(filteredLogs);
  };

  // Exportă logurile ca fișier JSON
  const handleExport = () => {
    const jsonData = exportLogsAsJson();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `itrack_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Șterge toate logurile
  const handleClearLogs = () => {
    if (window.confirm('Sigur doriți să ștergeți toate logurile? Această acțiune nu poate fi anulată.')) {
      clearLogs();
      refreshLogs();
      addLog('Toate logurile au fost șterse', 'info', 'admin-page');
    }
  };
  
  // Procesează loguri mobile din text paste
  const handleMobileLogImport = () => {
    if (!mobileLogContent.trim()) {
      setError('Introduceți conținutul logurilor mobile');
      return;
    }
    
    try {
      // Procesăm conținutul și extragem logurile
      const importedLogs = processMobileLogFile(mobileLogContent);
      
      // Notificăm utilizatorul
      addLog(`Import ${importedLogs.length} loguri mobile`, 'info', 'admin-page');
      
      // Resetăm conținutul și reîmprospătăm lista
      setMobileLogContent('');
      refreshLogs();
      setShowMobileLogImport(false);
    } catch (error) {
      console.error('Eroare la importul logurilor mobile:', error);
      setError('Eroare la procesarea logurilor. Verificați formatul.');
    }
  };

  // Formatare timestamp pentru afișare
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ro-RO', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Determină clasa CSS pentru nivelul de log
  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">iTrack - Vizualizare Loguri</h1>
      
      {!isAuthenticated ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Autentificare Administrator</h2>
          {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Introduceți emailul administratorului"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Parolă</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Introduceți parola"
            />
          </div>
          
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Autentificare
          </button>
          
          <p className="mt-4 text-sm text-gray-600">
            Această pagină este destinată exclusiv personalului administrativ pentru analizarea logurilor aplicației.
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Filtre</h2>
              </div>
              
              <div className="flex flex-wrap gap-2 md:gap-3">
                <div className="w-full sm:w-auto mb-2 sm:mb-0">
                  <label htmlFor="filterLevel" className="block text-xs text-gray-500 mb-1">
                    Nivel
                  </label>
                  <select
                    id="filterLevel"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="w-full sm:w-auto p-2 border rounded-md text-sm"
                  >
                    <option value="all">Toate nivelurile</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div className="w-full sm:w-auto mb-2 sm:mb-0">
                  <label htmlFor="filterSource" className="block text-xs text-gray-500 mb-1">
                    Sursă
                  </label>
                  <select
                    id="filterSource"
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full sm:w-auto p-2 border rounded-md text-sm"
                  >
                    <option value="">Toate sursele</option>
                    {uniqueSources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 w-full sm:w-auto sm:self-end">
                  <button
                    onClick={refreshLogs}
                    className="text-sm bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700"
                  >
                    Reîmprospătează
                  </button>
                  
                  <button
                    onClick={() => setShowMobileLogImport(!showMobileLogImport)}
                    className="text-sm bg-blue-500 text-white py-2 px-3 rounded-md hover:bg-blue-600"
                  >
                    {showMobileLogImport ? 'Ascunde Import' : 'Import Loguri'}
                  </button>
                  
                  <button
                    onClick={handleExport}
                    className="text-sm bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700"
                  >
                    Export
                  </button>
                  
                  <button
                    onClick={handleClearLogs}
                    className="text-sm bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700"
                  >
                    Șterge Loguri
                  </button>
                  
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="text-sm bg-gray-600 text-white py-2 px-3 rounded-md hover:bg-gray-700"
                  >
                    Deconectare
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Secțiune pentru importul logurilor mobile */}
          {showMobileLogImport && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Import Loguri Mobile</h3>
              {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}
              
              <div className="mb-4">
                <label htmlFor="mobileLogContent" className="block text-sm font-medium text-gray-700 mb-1">
                  Conținut Loguri (copiați și lipiți logurile din aplicația mobilă)
                </label>
                <textarea
                  id="mobileLogContent"
                  value={mobileLogContent}
                  onChange={(e) => setMobileLogContent(e.target.value)}
                  className="w-full p-2 border rounded-md h-40 font-mono text-xs"
                  placeholder="Copiați aici conținutul logurilor din aplicația mobilă..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleMobileLogImport}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Procesează Loguri
                </button>
                <button
                  onClick={() => setShowMobileLogImport(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Anulează
                </button>
              </div>
            </div>
          )}
          
          {/* Tabel pentru afișarea logurilor - design responsive */}
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <div className="min-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                      Timestamp
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                      Nivel
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                      Sursă
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                      Mesaj
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 sm:px-6">
                        Nu există loguri disponibile cu filtrele selectate
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-500 sm:px-6 md:whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-3 py-3 sm:px-6">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLogLevelClass(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 sm:px-6 md:whitespace-nowrap">
                          {log.source}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 sm:px-6">
                          <div className="break-words">{log.message}</div>
                          {log.details && (
                            <details className="mt-1">
                              <summary className="text-blue-600 cursor-pointer text-xs">Detalii</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {log.details}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Total loguri: <span className="font-semibold">{logs.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}