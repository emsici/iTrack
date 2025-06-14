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
    <div className="login-container">
      <div className="login-overlay">
        <div className="container-fluid h-100">
          <div className="row h-100">
            {/* Left side - Branding */}
            <div className="col-lg-6 d-none d-lg-flex login-brand-side">
              <div className="d-flex flex-column justify-content-center align-items-center text-white p-5">
                <div className="brand-logo">
                  <div className="logo-icon">📍</div>
                  <h1 className="brand-title">iTrack</h1>
                </div>
                <div className="brand-subtitle">
                  Sistem profesional de tracking pentru șoferi
                </div>
                <div className="brand-features">
                  <div className="feature-item">
                    <span className="feature-icon">🚛</span>
                    <span>Monitorizare în timp real</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span>Rapoarte detaliate</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🛡️</span>
                    <span>Securitate avansată</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="col-lg-6 d-flex align-items-center justify-content-center">
              <div className="login-form-container">
                <div className="text-center mb-5 d-lg-none">
                  <div className="mobile-logo">
                    <div className="logo-icon">📍</div>
                    <h1 className="brand-title text-white">iTrack</h1>
                  </div>
                </div>

                <div className="login-form-card">
                  <div className="form-header">
                    <h2 className="form-title">Conectare</h2>
                    <p className="form-subtitle">Acces pentru șoferi autorizați</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <span className="alert-icon">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Adresa de email
                      </label>
                      <div className="input-group">
                        <span className="input-icon">✉️</span>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="exemplu@euscagency.com"
                          disabled={loading}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        Parola
                      </label>
                      <div className="input-group">
                        <span className="input-icon">🔒</span>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          disabled={loading}
                          autoComplete="current-password"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-login w-100"
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
    </div>
  );
};

export default LoginScreen;