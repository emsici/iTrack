import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreenProfessional';
import AdminPanel from './components/AdminPanel';
// GPS initialization removed - handled by communityGPS when needed
import { getStoredToken, storeToken, clearToken } from './services/storage';

type AppState = 'login' | 'vehicle' | 'admin';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('login');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previousToken, setPreviousToken] = useState<string>('');

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

  const handleLogin = async (authToken: string) => {
    console.log("Login successful, storing token...");
    try {
      if (authToken === 'ADMIN_TOKEN') {
        setPreviousToken(token); // Store current session
        setToken(authToken);
        setCurrentScreen('admin');
      } else {
        await storeToken(authToken);
        console.log("Token stored successfully");
        setToken(authToken);
        setCurrentScreen('vehicle');
      }
    } catch (error) {
      console.error("Failed to store token:", error);
      // Continue anyway
      setToken(authToken);
      setCurrentScreen(authToken === 'ADMIN_TOKEN' ? 'admin' : 'vehicle');
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
      setPreviousToken('');
      setCurrentScreen('login');
      console.log('Logged out - cleared local storage');
    }
  };

  const handleAdminClose = () => {
    // Return to previous session if exists, otherwise go to login
    if (previousToken) {
      setToken(previousToken);
      setPreviousToken('');
      setCurrentScreen('vehicle');
    } else {
      setCurrentScreen('login');
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
        <AdminPanel onLogout={handleLogout} onClose={handleAdminClose} />
      )}
    </div>
  );
};

export default App;
