import React, { useState, useEffect } from 'react';

// Versiune simplificată pentru debugging Android
function SimpleApp() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      console.log('SimpleApp started');
      setIsLoading(false);
    } catch (err) {
      console.error('SimpleApp error:', err);
      setError(String(err));
    }
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <h2 style={{ color: '#d32f2f' }}>iTrack Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Restart App
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h2 style={{ color: '#1976d2' }}>iTrack</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <header style={{ 
        backgroundColor: '#1976d2', 
        color: 'white', 
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>iTrack GPS</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Transport Management System</p>
      </header>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Login</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          console.log('Login attempt');
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email:
            </label>
            <input 
              type="email" 
              defaultValue="test@exemplu.com"
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password:
            </label>
            <input 
              type="password" 
              defaultValue="parola123"
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{ 
              backgroundColor: '#4caf50', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Login
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>System Status</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
            <span>App Status:</span>
            <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>Running</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
            <span>GPS Status:</span>
            <span style={{ fontWeight: 'bold', color: '#f57c00' }}>Not Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <span>Connection:</span>
            <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;