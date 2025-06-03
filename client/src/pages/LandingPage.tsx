import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
            <path d="M13 6h3l3 3v4a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M13 9h6" stroke="currentColor" strokeWidth="1"/>
            <circle cx="6" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" fill="white"/>
            <circle cx="16" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" fill="white"/>
            <circle cx="6" cy="17" r="0.8" fill="currentColor"/>
            <circle cx="16" cy="17" r="0.8" fill="currentColor"/>
          </svg>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">iTrack</h1>
          <p className="text-gray-600">Sistem de management transport</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/login">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Autentificare
            </button>
          </Link>
          
          <p className="text-sm text-gray-500">
            Conectează-te pentru a gestiona transporturile tale
          </p>
        </div>
      </div>
    </div>
  );
}