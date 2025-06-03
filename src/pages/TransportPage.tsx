import React, { useState } from 'react';

interface Transport {
  id: string;
  vehicleNumber: string;
  uit: string;
  company: string;
  driver: string;
  route: string;
  status: 'active' | 'inactive' | 'tracking';
  lastUpdate?: Date;
  coordinates?: { lat: number; lng: number };
}

export default function TransportPage() {
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{transportId: string, field: string} | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const [transports, setTransports] = useState<Transport[]>([
    {
      id: '1',
      vehicleNumber: 'B-123-ABC',
      uit: 'UIT001',
      company: 'Transport SRL',
      driver: 'Ion Popescu',
      route: 'București - Constanța',
      status: 'inactive'
    },
    {
      id: '2', 
      vehicleNumber: 'CL-456-DEF',
      uit: 'UIT002',
      company: 'Logistics SA',
      driver: 'Maria Ionescu',
      route: 'Cluj - Timișoara',
      status: 'tracking',
      coordinates: { lat: 46.7712, lng: 23.6236 },
      lastUpdate: new Date()
    }
  ]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ro-RO');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  const updateTransportField = (transportId: string, field: string, value: string) => {
    setTransports(prev => prev.map(t => 
      t.id === transportId 
        ? { ...t, [field]: value }
        : t
    ));
    setEditingField(null);
    addLog(`${field} actualizat pentru transportul ${transportId}: ${value}`);
  };

  const toggleTransportStatus = (transportId: string) => {
    const transport = transports.find(t => t.id === transportId);
    if (!transport) return;

    let newStatus: Transport['status'];
    if (transport.status === 'inactive') {
      newStatus = 'tracking';
      addLog(`GPS pornit pentru vehiculul ${transport.vehicleNumber}`);
    } else if (transport.status === 'tracking') {
      newStatus = 'active';
      addLog(`GPS pauzat pentru vehiculul ${transport.vehicleNumber}`);
    } else {
      newStatus = 'tracking';
      addLog(`GPS continuat pentru vehiculul ${transport.vehicleNumber}`);
    }

    setTransports(prev => prev.map(t => 
      t.id === transportId 
        ? { 
            ...t, 
            status: newStatus,
            coordinates: newStatus === 'tracking' ? { lat: 44.4268 + Math.random() * 0.01, lng: 26.1025 + Math.random() * 0.01 } : t.coordinates,
            lastUpdate: newStatus === 'tracking' ? new Date() : t.lastUpdate
          }
        : t
    ));
  };

  const stopGPSTracking = (transportId: string) => {
    const transport = transports.find(t => t.id === transportId);
    if (!transport) return;

    setTransports(prev => prev.map(t => 
      t.id === transportId 
        ? { ...t, status: 'inactive' as const }
        : t
    ));
    
    addLog(`GPS oprit pentru vehiculul ${transport.vehicleNumber}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Urmărire GPS Live</h1>
                <p className="text-slate-600">Management transport în timp real</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Transport List */}
        <div className="space-y-4 mb-8">
          {transports.map((transport) => (
            <div key={transport.id} className="corporate-card">
              {/* Main Transport Row */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      <div className={`h-3 w-3 rounded-full ${
                        transport.status === 'tracking' ? 'bg-green-500' :
                        transport.status === 'active' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    {/* Vehicle Number - Editable */}
                    <div className="min-w-0 flex-1">
                      {editingField?.transportId === transport.id && editingField?.field === 'vehicleNumber' ? (
                        <input
                          type="text"
                          defaultValue={transport.vehicleNumber}
                          className="text-lg font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          onBlur={(e) => updateTransportField(transport.id, 'vehicleNumber', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateTransportField(transport.id, 'vehicleNumber', e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                              setEditingField(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <h3 
                          className="text-lg font-semibold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => setEditingField({transportId: transport.id, field: 'vehicleNumber'})}
                        >
                          {transport.vehicleNumber}
                        </h3>
                      )}
                      <p className="text-sm text-slate-600">{transport.company}</p>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transport.status === 'tracking' ? 'bg-green-100 text-green-800' :
                      transport.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transport.status === 'tracking' ? 'GPS Activ' :
                       transport.status === 'active' ? 'Pauzat' : 'Oprit'}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center space-x-2">
                    {transport.status === 'inactive' && (
                      <button
                        onClick={() => toggleTransportStatus(transport.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pornește</span>
                      </button>
                    )}

                    {transport.status === 'active' && (
                      <>
                        <button
                          onClick={() => toggleTransportStatus(transport.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Continuă</span>
                        </button>
                        <button
                          onClick={() => stopGPSTracking(transport.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Stop</span>
                        </button>
                      </>
                    )}

                    {transport.status === 'tracking' && (
                      <>
                        <button
                          onClick={() => toggleTransportStatus(transport.id)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                          </svg>
                          <span>Pauză</span>
                        </button>
                        <button
                          onClick={() => stopGPSTracking(transport.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Stop</span>
                        </button>
                      </>
                    )}

                    {/* Dropdown Toggle */}
                    <button
                      onClick={() => setExpandedDropdown(expandedDropdown === transport.id ? null : transport.id)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <svg className={`h-5 w-5 transform transition-transform ${expandedDropdown === transport.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dropdown Content */}
              {expandedDropdown === transport.id && (
                <div className="border-t border-slate-200 p-6 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Transport Details */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wide">Detalii Transport</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">UIT Device</label>
                        {editingField?.transportId === transport.id && editingField?.field === 'uit' ? (
                          <input
                            type="text"
                            defaultValue={transport.uit}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onBlur={(e) => updateTransportField(transport.id, 'uit', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateTransportField(transport.id, 'uit', e.currentTarget.value);
                              if (e.key === 'Escape') setEditingField(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="text-sm text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => setEditingField({transportId: transport.id, field: 'uit'})}
                          >
                            {transport.uit}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ruta</label>
                        {editingField?.transportId === transport.id && editingField?.field === 'route' ? (
                          <input
                            type="text"
                            defaultValue={transport.route}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onBlur={(e) => updateTransportField(transport.id, 'route', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateTransportField(transport.id, 'route', e.currentTarget.value);
                              if (e.key === 'Escape') setEditingField(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="text-sm text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => setEditingField({transportId: transport.id, field: 'route'})}
                          >
                            {transport.route}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Company & Driver */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wide">Firma & Șofer</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Companie</label>
                        {editingField?.transportId === transport.id && editingField?.field === 'company' ? (
                          <input
                            type="text"
                            defaultValue={transport.company}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onBlur={(e) => updateTransportField(transport.id, 'company', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateTransportField(transport.id, 'company', e.currentTarget.value);
                              if (e.key === 'Escape') setEditingField(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="text-sm text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => setEditingField({transportId: transport.id, field: 'company'})}
                          >
                            {transport.company}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Șofer</label>
                        {editingField?.transportId === transport.id && editingField?.field === 'driver' ? (
                          <input
                            type="text"
                            defaultValue={transport.driver}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onBlur={(e) => updateTransportField(transport.id, 'driver', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateTransportField(transport.id, 'driver', e.currentTarget.value);
                              if (e.key === 'Escape') setEditingField(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="text-sm text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => setEditingField({transportId: transport.id, field: 'driver'})}
                          >
                            {transport.driver}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* GPS Status */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-900 uppercase tracking-wide">Status GPS</h4>
                      
                      {transport.coordinates && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-700">Latitudine</label>
                            <p className="text-sm text-slate-600 font-mono">{transport.coordinates.lat.toFixed(6)}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700">Longitudine</label>
                            <p className="text-sm text-slate-600 font-mono">{transport.coordinates.lng.toFixed(6)}</p>
                          </div>
                        </div>
                      )}

                      {transport.lastUpdate && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700">Ultima actualizare</label>
                          <p className="text-sm text-slate-600">{transport.lastUpdate.toLocaleString('ro-RO')}</p>
                        </div>
                      )}

                      {!transport.coordinates && transport.status === 'inactive' && (
                        <p className="text-sm text-slate-500 italic">GPS nu este activ</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Activity Logs */}
        <div className="corporate-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Jurnal Activitate</h2>
            <button 
              onClick={() => setLogs([])}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Șterge log-uri
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nu există activitate înregistrată</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <p key={index} className="text-xs font-mono text-green-400">
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}