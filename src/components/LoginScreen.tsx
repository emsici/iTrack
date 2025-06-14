import React, { useState } from 'react';
import { login } from '../services/api';

interface LoginScreenProps {
  onLogin: (token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Te rog să completezi toate câmpurile');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      
      if (response.token) {
        onLogin(response.token);
      } else {
        setError(response.error || 'Date de conectare incorecte');
      }
    } catch (err: any) {
      setError(err.message || 'Eroare la conectare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-app">
      <div className="vehicle-input-screen">
        <div className="vehicle-input-container">
          <div className="vehicle-input-header">
            <h1 className="vehicle-input-title">iTrack</h1>
            <p className="vehicle-input-subtitle">Autentificare în sistem</p>
          </div>

          <form onSubmit={handleLogin} className="vehicle-input-form">
            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠</span>
                <span className="error-text">{error}</span>
              </div>
            )}

            <div className="input-group">
              <input
                type="email"
                className="vehicle-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="Introduceți email-ul"
              />
            </div>

            <div className="input-group">
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="vehicle-input password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Introduceți parola"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="load-courses-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Se conectează...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">🔐</span>
                  <span>Conectare</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="version-footer">
          <span className="version-text">Versiunea 1807.99</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;