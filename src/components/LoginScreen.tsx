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
    <div className="modern-login-app">
      {/* Modern Header - same as main app */}
      <div className="modern-header">
        <div className="container">
          <div className="header-content">
            <div className="app-info">
              <div className="app-icon">📍</div>
              <div className="app-details">
                <h1 className="app-title">iTrack</h1>
                <div className="app-subtitle">Tracking profesional pentru șoferi</div>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="help-btn"
                onClick={() => alert('iTrack v1.0\n\nAplicație profesională de tracking GPS pentru șoferi.\n\nFuncții:\n• GPS tracking în timp real\n• Monitorizare curse active\n• Status reporting automat\n• Background tracking pe Android\n\n© 2025 EUSC Agency')}
                title="Informații despre aplicație"
              >
                ❓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="login-content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="login-card">
                <div className="login-card-header">
                  <h2 className="login-title">Conectare</h2>
                  <p className="login-subtitle">Introduceți datele de autentificare</p>
                </div>

                {error && (
                  <div className="alert alert-danger">
                    <span>⚠️ {error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplu@euscagency.com"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Parola</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-btn"
                    disabled={loading || !email || !password}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Se conectează...
                      </>
                    ) : (
                      <>
                        Conectare →
                      </>
                    )}
                  </button>
                </form>

                <div className="form-footer">
                  <p className="security-note">
                    🔐 Conexiune securizată SSL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;