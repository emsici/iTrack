import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreenProfessional';
import AdminPanel from './components/AdminPanel';
// GPS initialization removed - handled by communityGPS when needed
import { getStoredToken, clearToken } from './services/storage';

type AppState = 'login' | 'vehicle' | 'admin';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('login');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // GPS initialization handled by communityGPS service when tracking starts
        
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
    if (authToken === 'ADMIN_TOKEN') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('vehicle');
    }
  };

  const handleLogout = async () => {
    try {
      // Send logout request to login.php with iesire: 1
      const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/login.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "iesire": 1
        })
      });
      
      console.log('Logout API response:', response.status);
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      // Clear local storage and reset state regardless of API response
      await clearToken();
      setToken('');
      setCurrentScreen('login');
      console.log('Logged out - cleared local storage');
    }
  };

  if (isLoading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
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
      {currentScreen === 'admin' && (
        <AdminPanel onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
