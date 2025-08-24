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
          // Ensure we're on login screen even if token check fails
          setCurrentScreen('login');
        }
      } catch (error) {
        console.error('❌ Eroare la inițializarea aplicației:', error);
        // CRITICAL FIX: Ensure app doesn't stay in loading state on error
        setCurrentScreen('login');
        setToken('');
      }
    };

    initApp();
  }, []);

  const handleLogin = async (authToken: string, isAdmin: boolean = false) => {
    // Login successful, storing token
    try {
      // Store token first for consistency
      await storeToken(authToken);
      setToken(authToken);
      
      // ADMIN ACCESS LOGIC: Set previousToken for admin mode
      if (isAdmin) {
        setPreviousToken(token); // Save current token for return
        setCurrentScreen('admin');
        console.log('👑 Admin access granted - previous session saved');
      } else {
        // ALWAYS go to vehicle screen for normal users
        setCurrentScreen('vehicle');
      }
    } catch (error) {
      console.error("❌ Eșec la stocarea token-ului:", error);
      // Continue anyway - set token and screen
      setToken(authToken);
      if (isAdmin) {
        setPreviousToken(token);
        setCurrentScreen('admin');
      } else {
        setCurrentScreen('vehicle');
      }
    }
  };

  const handleLogout = async () => {
    console.log('🚪 LOGOUT INITIATED - clearing state immediately');
    
    // CRITICAL FIX: Save token before clearing for API call
    const currentToken = token;
    
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
        // FIXED: Use saved token instead of cleared state token
        if (currentToken) {
          try {
            // CRITICAL FIX: Real timeout cu Promise.race (AbortController nu funcționează cu CapacitorHttp)
            const logoutPromise = CapacitorHttp.post({
              url: `${API_BASE_URL}logout.php`,
              headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
              },
              data: {}
            });

            // Timeout real de 2 secunde cu Promise.race
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Logout timeout')), 2000)
            );

            await Promise.race([logoutPromise, timeoutPromise]);
            console.log('✅ Logout API completed successfully');
          } catch (apiError) {
            console.log('⚠️ Logout API failed (ignored):', apiError);
          }
        } else {
          console.log('⚠️ No token available for logout API call');
        }
      } catch (error) {
        console.log('Logout cleanup finished (some errors ignored):', error);
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
