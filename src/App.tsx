import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreen';
import { getStoredToken } from './services/storage';
import { initializeGPS } from './services/gps';

type AppState = 'login' | 'vehicle';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('login');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingToken();
    initializeGPS();
  }, []);

  const checkExistingToken = async () => {
    try {
      const storedToken = await getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        setCurrentScreen('vehicle');
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (authToken: string) => {
    setToken(authToken);
    setCurrentScreen('vehicle');
  };

  const handleLogout = () => {
    setToken('');
    setCurrentScreen('login');
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {currentScreen === 'vehicle' && (
        <VehicleScreen token={token} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
