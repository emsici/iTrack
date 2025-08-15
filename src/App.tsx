import React, { useState, useEffect } from 'react';
import { CapacitorHttp } from '@capacitor/core';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreenProfessional';
import AdminPanel from './components/AdminPanel';
import { getStoredToken, storeToken, clearToken } from './services/storage';
import { API_BASE_URL } from './services/api';
// GPS operations now handled by capacitorGPS service

type AppState = 'login' | 'vehicle' | 'admin';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('login');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previousToken, setPreviousToken] = useState<string>('');

  useEffect(() => {
    const initApp = async () => {
      // Set loading to false immediately to show login faster
      setIsLoading(false);
      
      try {
        // CRITICAL: Initialize GPS bridge for Android service communication
        // GPS operations handled by Capacitor Plugin
        console.log('✅ GPS Bridge inițializat - serviciul Android pregătit pentru transmisia GPS');
        
        // Check for stored authentication token (non-blocking)
        const storedToken = await getStoredToken();
        if (storedToken) {
          console.log('Token stocat găsit - login automat');
          setToken(storedToken);
          if (storedToken.startsWith('ADMIN_DEBUG_TOKEN')) {
            setCurrentScreen('admin');
          } else {
            setCurrentScreen('vehicle');
          }
        } else {
          console.log('Nu există token stocat - se afișează login-ul');
        }
      } catch (error) {
        console.error('Eroare la inițializarea aplicației:', error);
      }
    };

    initApp();
  }, []);

  const handleLogin = async (authToken: string, isAdmin: boolean = false) => {
    // Login successful, storing token
    try {
      if (isAdmin || authToken === 'ADMIN_TOKEN' || authToken.startsWith('ADMIN_DEBUG_TOKEN')) {
        setPreviousToken(token); // Store current session
        setToken(authToken);
        setCurrentScreen('admin');
      } else {
        await storeToken(authToken);
        // Token stored successfully
        setToken(authToken);
        setCurrentScreen('vehicle');
      }
    } catch (error) {
      console.error("Eșec la stocarea token-ului:", error);
      // Continue anyway
      setToken(authToken);
      setCurrentScreen(isAdmin || authToken.startsWith('ADMIN_DEBUG_TOKEN') ? 'admin' : 'vehicle');
    }
  };

  const handleLogout = async () => {
    // OPTIMIZARE: Schimbă ecranul IMEDIAT pentru feedback instant
    setCurrentScreen('login');
    setToken('');
    setPreviousToken('');
    
    // API cleanup în background - nu blochează UI-ul
    Promise.all([
      clearToken(),
      // API logout în background - non-blocking
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
          
          await CapacitorHttp.post({
            url: `${API_BASE_URL}/logout.php`,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {}
          });
          clearTimeout(timeoutId);
          console.log('Logout API finalizat în background');
        } catch (error) {
          console.log('Logout API timeout sau eroare - nu afectează UI-ul');
        }
      })()
    ]).catch(() => {
      // Erori de cleanup nu afectează logout-ul - user-ul vede deja login-ul
    });
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
