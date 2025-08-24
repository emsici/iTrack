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
        
        // CRITICAL: Initialize Android GPS callback for network status reporting
        // androidGPSCallback eliminat - BackgroundGPSService nu îl folosește
        console.log('📡 BackgroundGPSService folosește logging direct - nu mai e nevoie de callback');
        
        // Check for stored authentication token (non-blocking)
        const storedToken = await getStoredToken();
        if (storedToken) {
          console.log('Token stocat găsit - login automat');
          setToken(storedToken);
          // ALWAYS go to vehicle screen for normal users - AdminPanel is accessible via 50 clicks
          setCurrentScreen('vehicle');
        } else {
          console.log('Nu există token stocat - se afișează login-ul');
        }
      } catch (error) {
        console.error('Eroare la inițializarea aplicației:', error);
      }
    };

    initApp();
  }, []);

  const handleLogin = async (authToken: string) => {
    // Login successful, storing token
    try {
      // ALWAYS store token and go to vehicle screen - AdminPanel via 50 clicks only
      await storeToken(authToken);
      setToken(authToken);
      setCurrentScreen('vehicle');
    } catch (error) {
      console.error("Eșec la stocarea token-ului:", error);
      // Continue anyway - always go to vehicle screen
      setToken(authToken);
      setCurrentScreen('vehicle');
    }
  };

  const handleLogout = async () => {
    console.log('🚪 LOGOUT INITIATED - clearing state immediately');
    
    // IMMEDIATE UI RESPONSE: Clear state first to prevent blue screen
    setCurrentScreen('login');
    setToken('');
    setPreviousToken('');
    
    // Background cleanup - non-blocking
    setTimeout(async () => {
      try {
        await clearToken();
        console.log('✅ Token cleared from storage');
        
        // API logout cu timeout rapid pentru a nu bloca
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
        
        await CapacitorHttp.post({
          url: `${API_BASE_URL}logout.php`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {}
        });
        clearTimeout(timeoutId);
        console.log('✅ Logout API completed');
      } catch (error) {
        console.log('Logout cleanup finished (some errors ignored)');
      }
    }, 10); // Delay minimal pentru a permite UI să se actualizeze
    
    console.log('✅ LOGOUT UI updated - cleanup running in background');
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
        <AdminPanel isOpen={true} onLogout={handleLogout} onClose={handleAdminClose} />
      )}
    </div>
  );
};

export default App;
