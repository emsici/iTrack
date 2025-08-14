import React, { useEffect } from 'react';
import { themeService } from './services/themeService';
import LoginScreen from './components/LoginScreen';
import VehicleScreen from './components/VehicleScreenProfessional';
import { getStoredToken } from './services/storage';

const App: React.FC = () => {
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Initialize theme on app startup
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize theme first
        await themeService.initializeTheme();
        
        // Then check for stored token
        const storedToken = await getStoredToken();
        setToken(storedToken);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div className="text-center">
          <i className="fas fa-spinner fa-spin fa-2x mb-3"></i>
          <div>Se încarcă aplicația...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {token ? (
        <VehicleScreen token={token} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;