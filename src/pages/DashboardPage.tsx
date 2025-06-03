import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Prezentare generală sistem transport</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="corporate-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-semibold text-slate-900">12</p>
              </div>
            </div>
          </div>

          <div className="corporate-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">În tranzit</p>
                <p className="text-2xl font-semibold text-slate-900">8</p>
              </div>
            </div>
          </div>

          <div className="corporate-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">GPS Tracking</p>
                <p className="text-2xl font-semibold text-slate-900">15</p>
              </div>
            </div>
          </div>

          <div className="corporate-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.348 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Alerte</p>
                <p className="text-2xl font-semibold text-slate-900">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="corporate-card p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Activitate Recentă</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-slate-600">GPS activat pentru B-123-ABC</p>
                <span className="text-xs text-slate-400">15:30</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-slate-600">Pauză în transportul CL-456-DEF</p>
                <span className="text-xs text-slate-400">14:22</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-slate-600">Rută actualizată pentru IS-789-GHI</p>
                <span className="text-xs text-slate-400">13:45</span>
              </div>
            </div>
          </div>

          <div className="corporate-card p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Status Sistem</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Server GPS</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Baza de date</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Conectat</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">API External</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Degradat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}