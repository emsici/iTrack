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
    <div className="login-container">
      <style>
        {`
          .login-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
          }

          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            pointer-events: none;
          }

          .login-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            z-index: 1;
          }

          .login-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .app-logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
          }

          .app-logo i {
            font-size: 2rem;
            color: white;
          }

          .app-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: white;
            margin-bottom: 8px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .app-subtitle {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 400;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .form-group {
            position: relative;
          }

          .form-input {
            width: 100%;
            padding: 16px 20px 16px 50px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 1rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .form-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          .form-input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.7);
            font-size: 1.1rem;
            pointer-events: none;
          }

          .password-container {
            position: relative;
          }

          .password-toggle {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            font-size: 1.1rem;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.3s ease;
          }

          .password-toggle:hover {
            color: white;
            background: rgba(255, 255, 255, 0.1);
          }

          .login-button {
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            color: white;
            border: none;
            padding: 18px 24px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
            box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
          }

          .login-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
          }

          .login-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .error-alert {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(10px);
          }

          .error-icon {
            color: #ef4444;
            font-size: 1.2rem;
          }

          .error-text {
            color: white;
            font-weight: 500;
          }

          .login-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .version-info {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .security-badges {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 25px;
          }

          .security-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
          }

          @media (max-width: 768px) {
            .login-card {
              margin: 20px;
              padding: 30px 20px;
            }
            
            .app-title {
              font-size: 2rem;
            }
          }
        `}
      </style>
      
      <div className="login-card">
        <div className="login-header">
          <div className="app-logo">
            <i className="fas fa-route"></i>
          </div>
          <h1 className="app-title">iTrack</h1>
          <p className="app-subtitle">Sistem Profesional de Urmărire GPS</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-alert">
              <i className="fas fa-exclamation-triangle error-icon"></i>
              <span className="error-text">{error}</span>
            </div>
          )}

          <div className="form-group">
            <i className="fas fa-envelope input-icon"></i>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Adresa de email corporativă"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="password-container">
              <i className="fas fa-lock input-icon"></i>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Parola de acces"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Autentificare în curs...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                <span>Autentificare Securizată</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="version-info">
            <i className="fas fa-code-branch"></i>
            <span>Versiunea 1807.99</span>
          </div>
          
          <div className="security-badges">
            <div className="security-badge">
              <i className="fas fa-shield-alt"></i>
              <span>Securizat SSL</span>
            </div>
            <div className="security-badge">
              <i className="fas fa-lock"></i>
              <span>Criptat</span>
            </div>
            <div className="security-badge">
              <i className="fas fa-satellite-dish"></i>
              <span>GPS Activ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;