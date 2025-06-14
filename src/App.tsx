import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreen';
import { initializeGPS } from './services/gps';
import { getStoredToken, clearToken } from './services/storage';

type AppState = 'login' | 'vehicle';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('login');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeGPS();
        
        // Check for stored authentication token
        const storedToken = await getStoredToken();
        if (storedToken) {
          console.log('Found stored token - auto login');
          setToken(storedToken);
          setCurrentScreen('vehicle');
        } else {
          console.log('No stored token - showing login');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
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
