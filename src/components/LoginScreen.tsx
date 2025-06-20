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
      // Check for admin credentials
      if (email === 'admin@itrack.app' && password === 'parola123') {
        console.log('Admin login detected');
        onLogin('ADMIN_TOKEN');
        return;
      }

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
            min-height: 100dvh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #1e3c72 100%);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
          }
          
          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(79, 70, 229, 0.2) 0%, transparent 50%);
            animation: backgroundFloat 25s ease-in-out infinite;
            pointer-events: none;
          }

          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
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
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(25px);
            border-radius: 25px;
            padding: 50px;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeInUp 0.8s ease-out;
          }

          .login-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 40px 80px rgba(79, 70, 229, 0.2);
          }

          .login-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .transport-logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 25px;
            position: relative;
            animation: professionalFloat 4s ease-in-out infinite;
          }

          .corporate-emblem {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .corporate-emblem:hover {
            transform: scale(1.08) translateY(-3px);
            filter: drop-shadow(0 25px 50px rgba(30, 64, 175, 0.25));
          }

          .emblem-ring {
            width: 90px;
            height: 90px;
            border: 2px solid rgba(59, 130, 246, 0.2);
            border-radius: 50%;
            position: relative;
            background: linear-gradient(145deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
            box-shadow: 
              0 8px 32px rgba(30, 64, 175, 0.15),
              inset 0 2px 8px rgba(255, 255, 255, 0.7);
            animation: emblemGlow 6s ease-in-out infinite;
          }

          .emblem-core {
            width: 70px;
            height: 70px;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.08),
              inset 0 1px 4px rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(226, 232, 240, 0.5);
          }

          .emblem-center {
            width: 50px;
            height: 50px;
            background: linear-gradient(145deg, #1e40af 0%, #3b82f6 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
              0 4px 16px rgba(30, 64, 175, 0.25),
              inset 0 1px 4px rgba(255, 255, 255, 0.3);
            animation: truckPulse 4s ease-in-out infinite;
          }

          .emblem-center i {
            font-size: 1.5rem;
            color: #ffffff;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          }

          .corporate-emblem:hover .emblem-ring {
            animation: emblemRotate 2s linear infinite;
            box-shadow: 
              0 0 50px rgba(59, 130, 246, 0.4),
              inset 0 0 30px rgba(255, 255, 255, 0.2);
          }

          .corporate-emblem:hover .emblem-center {
            transform: scale(1.1);
            box-shadow: 
              0 12px 40px rgba(30, 64, 175, 0.5),
              inset 0 2px 12px rgba(255, 255, 255, 0.3);
          }

          .app-title {
            font-size: 2.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            animation: slideInFromLeft 0.8s ease-out;
            letter-spacing: -1px;
          }

          @keyframes elegantMotion {
            0%, 100% { 
              transform: translateX(0px) translateY(0px) rotate(0deg); 
            }
            25% { 
              transform: translateX(3px) translateY(-2px) rotate(0.3deg); 
            }
            50% { 
              transform: translateX(6px) translateY(0px) rotate(0deg); 
            }
            75% { 
              transform: translateX(3px) translateY(1px) rotate(-0.2deg); 
            }
          }

          @keyframes executiveFloat {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
              box-shadow: 0 12px 35px rgba(30, 64, 175, 0.4);
            }
            50% { 
              transform: translateY(-3px) rotate(0.5deg); 
              box-shadow: 0 18px 45px rgba(30, 64, 175, 0.6);
            }
          }

          @keyframes corporateGlow {
            0%, 100% { 
              box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
              border-color: #e2e8f0;
            }
            50% { 
              box-shadow: 0 20px 50px rgba(59, 130, 246, 0.15);
              border-color: #bfdbfe;
            }
          }

          @keyframes professionalFloat {
            0%, 100% { 
              transform: translateY(0px); 
            }
            50% { 
              transform: translateY(-8px); 
            }
          }

          @keyframes truckPulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.05); 
              opacity: 0.9; 
            }
          }

          @keyframes gpsPulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.2); 
              opacity: 0.7; 
            }
          }

          @keyframes cargoFloat {
            0%, 100% { 
              transform: translateX(0px); 
            }
            50% { 
              transform: translateX(-3px); 
            }
          }

          @keyframes emblemGlow {
            0%, 100% { 
              box-shadow: 0 8px 32px rgba(30, 64, 175, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.7);
            }
            50% { 
              box-shadow: 0 12px 40px rgba(30, 64, 175, 0.25), inset 0 2px 12px rgba(255, 255, 255, 0.8);
            }
          }

          @keyframes truckPulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 4px 16px rgba(30, 64, 175, 0.25), inset 0 1px 4px rgba(255, 255, 255, 0.3);
            }
            50% { 
              transform: scale(1.02); 
              box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3), inset 0 1px 6px rgba(255, 255, 255, 0.4);
            }
          }

          @keyframes iconFloat {
            0%, 100% { 
              transform: translateY(0px); 
            }
            50% { 
              transform: translateY(-2px); 
            }
          }

          @keyframes inputIconFloat {
            0%, 100% { 
              transform: translateY(-50%) scale(1); 
            }
            50% { 
              transform: translateY(-50%) scale(1.05); 
            }
          }

          @keyframes executiveLEDPulse {
            0%, 100% { 
              opacity: 1; 
              box-shadow: 0 0 25px rgba(255, 255, 255, 0.9), 0 0 50px rgba(59, 130, 246, 0.6);
            }
            50% { 
              opacity: 0.8; 
              box-shadow: 0 0 35px rgba(255, 255, 255, 1), 0 0 70px rgba(59, 130, 246, 0.8);
            }
          }

          @keyframes headlightBeam {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          @keyframes antennaSignal {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            75% { transform: rotate(-1deg); }
          }

          @keyframes connectivityPulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
              box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
            }
            50% { 
              opacity: 0.6; 
              transform: scale(1.2);
              box-shadow: 0 0 20px rgba(16, 185, 129, 0.9);
            }
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
            padding: 18px 20px 18px 55px;
            border: 2px solid #e2e8f0;
            border-radius: 15px;
            background: #ffffff;
            color: #1e293b;
            font-size: 1.1rem;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }

          .form-input::placeholder {
            color: #94a3b8;
            font-weight: 400;
          }

          .form-input:focus {
            outline: none;
            border-color: #4f46e5;
            background: #ffffff;
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.15);
            transform: translateY(-2px);
          }

          .input-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #4f46e5;
            font-size: 1.2rem;
            pointer-events: none;
          }

          .password-container {
            position: relative;
          }

          .password-toggle {
            position: absolute;
            right: 18px;
            top: 50%;
            transform: translateY(-50%);
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            color: #64748b;
            cursor: pointer;
            font-size: 1.1rem;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.3s ease;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .password-toggle:hover {
            color: #4f46e5;
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateY(-50%) scale(1.05);
          }

          .login-button {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
            color: white;
            border: none;
            padding: 20px 30px;
            border-radius: 18px;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 15px;
            box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
            letter-spacing: 0.5px;
            text-transform: uppercase;
            position: relative;
            overflow: hidden;
          }

          .login-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .login-button:hover:not(:disabled) {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 25px 50px rgba(79, 70, 229, 0.5);
          }

          .login-button:hover:not(:disabled)::before {
            left: 100%;
          }

          .login-button:active:not(:disabled) {
            animation: buttonPress 0.2s ease;
          }

          .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
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
            color: #dc2626;
            font-weight: 500;
          }

          .login-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .version-info {
            color: #64748b;
            font-size: 0.9rem;
            font-weight: 500;
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
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 500;
          }

          @media (max-width: 768px) {
            .login-card {
              margin: 20px;
              padding: 35px 25px;
              max-width: 90%;
            }
            
            .app-title {
              font-size: 2.2rem;
            }
            
            .app-subtitle {
              font-size: 1rem;
              letter-spacing: 1.5px;
            }
            
            .app-logo {
              width: 75px;
              height: 75px;
              margin-bottom: 20px;
            }
            
            .form-input {
              padding: 16px 18px 16px 50px;
              font-size: 1rem;
            }
            
            .input-icon {
              left: 16px;
              font-size: 1.1rem;
            }
            
            .password-toggle {
              right: 16px;
              width: 34px;
              height: 34px;
              padding: 6px;
            }
            
            .login-button {
              padding: 18px 25px;
              font-size: 1.1rem;
            }
          }

          @media (max-width: 480px) {
            .login-container {
              padding: 15px;
            }
            
            .login-card {
              margin: 15px;
              padding: 30px 20px;
              max-width: 95%;
            }
            
            .app-title {
              font-size: 1.8rem;
            }
            
            .app-subtitle {
              font-size: 0.9rem;
              letter-spacing: 1px;
            }
            
            .app-logo {
              width: 65px;
              height: 65px;
              margin-bottom: 15px;
            }
            
            .form-input {
              padding: 14px 16px 14px 45px;
              font-size: 0.95rem;
            }
            
            .input-icon {
              left: 14px;
              font-size: 1rem;
            }
            
            .password-toggle {
              right: 14px;
              width: 32px;
              height: 32px;
            }
            
            .login-button {
              padding: 16px 20px;
              font-size: 1rem;
            }
          }

          @media (min-width: 1024px) {
            .login-card {
              padding: 60px;
              max-width: 550px;
            }
            
            .app-title {
              font-size: 3.2rem;
            }
            
            .app-subtitle {
              font-size: 1.3rem;
            }
            
            .app-logo {
              width: 100px;
              height: 100px;
              margin-bottom: 30px;
            }
          }

          /* Safe area for mobile devices */
          @supports (padding: max(0px)) {
            .login-container {
              padding-top: max(20px, env(safe-area-inset-top));
              padding-bottom: max(20px, env(safe-area-inset-bottom));
              padding-left: max(20px, env(safe-area-inset-left));
              padding-right: max(20px, env(safe-area-inset-right));
            }
          }
        `}
      </style>
      
      <div className="login-card">
        <div className="login-header">
          <div className="transport-logo">
            <div className="corporate-emblem">
              <div className="emblem-ring">
                <div className="emblem-core">
                  <div className="emblem-center">
                    <i className="fas fa-truck"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h1 className="app-title">iTrack</h1>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-alert">
              <i className="fas fa-exclamation-triangle error-icon"></i>
              <span className="error-text">{error}</span>
            </div>
          )}

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="Email sau telefon (0733547739)"
                autoComplete="username"
              />
              <i className="fas fa-user input-icon"></i>
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Parolă"
                autoComplete="current-password"
              />
              <i className="fas fa-lock input-icon"></i>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? "Ascunde parola" : "Afișează parola"}
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
                <span>Autentificare</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="version-info">
            <i className="fas fa-code-branch"></i>
            <span>Versiunea 1807.99</span>
          </div>
        
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;