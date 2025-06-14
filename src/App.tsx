import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreen';
import { initializeGPS } from './services/gps';

type AppState = 'login' | 'vehicle';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('login');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    initializeGPS();
  }, []);

  const handleLogin = (authToken: string) => {
    setToken(authToken);
    setCurrentScreen('vehicle');
  };

  const handleLogout = () => {
    setToken('');
    setCurrentScreen('login');
  };

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
