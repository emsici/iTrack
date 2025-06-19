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
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #1e3c72 100%);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
            display: flex;
            align-items: center;
            justify-content: center;
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
            width: 180px;
            height: 120px;
            margin: 0 auto 25px;
            position: relative;
            animation: elegantMotion 6s ease-in-out infinite;
          }

          .corporate-truck {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: pointer;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .corporate-truck:hover {
            transform: scale(1.08) translateY(-3px);
            filter: drop-shadow(0 25px 50px rgba(30, 64, 175, 0.25));
          }

          /* Cabina corporată elegantă */
          .executive-cab {
            width: 45px;
            height: 55px;
            background: linear-gradient(145deg, #1e40af 0%, #3b82f6 25%, #60a5fa 50%, #93c5fd 75%, #dbeafe 100%);
            border-radius: 15px 15px 6px 6px;
            position: absolute;
            top: 10px;
            left: 20px;
            box-shadow: 
              0 12px 35px rgba(30, 64, 175, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.2);
            animation: executiveFloat 5s ease-in-out infinite;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .executive-cab::before {
            content: '';
            width: 38px;
            height: 28px;
            background: linear-gradient(135deg, rgba(219, 234, 254, 0.95) 0%, rgba(147, 197, 253, 0.9) 100%);
            border-radius: 8px;
            position: absolute;
            top: 8px;
            left: 3.5px;
            border: 2px solid rgba(255, 255, 255, 0.4);
            box-shadow: inset 0 1px 2px rgba(59, 130, 246, 0.2);
          }

          .executive-cab::after {
            content: '';
            width: 8px;
            height: 4px;
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            border-radius: 2px;
            position: absolute;
            top: 20px;
            left: 18.5px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          /* Grila premium sofisticată */
          .executive-grille {
            width: 10px;
            height: 30px;
            background: linear-gradient(145deg, #374151 0%, #1f2937 50%, #111827 100%);
            border-radius: 4px;
            position: absolute;
            top: 25px;
            left: 10px;
            box-shadow: 
              inset 0 2px 4px rgba(255, 255, 255, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.3);
          }

          .executive-grille::before {
            content: '';
            width: 8px;
            height: 2px;
            background: linear-gradient(90deg, #9ca3af 0%, #d1d5db 50%, #9ca3af 100%);
            border-radius: 1px;
            position: absolute;
            top: 6px;
            left: 1px;
            box-shadow: 
              0 6px 0 #9ca3af, 
              0 12px 0 #9ca3af, 
              0 18px 0 #9ca3af;
          }

          /* Șasiu executiv */
          .executive-chassis {
            width: 110px;
            height: 16px;
            background: linear-gradient(145deg, #4b5563 0%, #374151 30%, #1f2937 70%, #111827 100%);
            border-radius: 4px;
            position: absolute;
            top: 52px;
            left: 35px;
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.1);
          }

          /* Container corporativ premium */
          .corporate-container {
            width: 90px;
            height: 45px;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 20%, #f1f5f9 40%, #e2e8f0 100%);
            border-radius: 10px;
            position: absolute;
            top: 18px;
            left: 75px;
            box-shadow: 
              0 15px 40px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
            border: 2px solid #e2e8f0;
            animation: corporateGlow 6s ease-in-out infinite;
          }

          .corporate-container::before {
            content: '';
            width: 8px;
            height: 38px;
            background: linear-gradient(145deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
            border-radius: 4px;
            position: absolute;
            top: 3.5px;
            right: 4px;
            box-shadow: 
              0 0 15px rgba(220, 38, 38, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.2);
          }

          /* Brandingul corporativ */
          .corporate-branding {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 35px;
            height: 20px;
            background: linear-gradient(145deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
              0 4px 12px rgba(59, 130, 246, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .corporate-branding::after {
            content: '🏢';
            font-size: 10px;
            filter: brightness(1.2);
          }

          /* Roți executive premium */
          .executive-wheel {
            width: 26px;
            height: 26px;
            background: radial-gradient(circle, #374151 15%, #1f2937 40%, #111827 70%, #000000 90%);
            border-radius: 50%;
            position: absolute;
            top: 68px;
            animation: executiveWheelSpin 1.2s linear infinite;
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.6),
              inset 0 2px 4px rgba(255, 255, 255, 0.1);
            border: 3px solid #4b5563;
          }

          .executive-wheel::before {
            content: '';
            width: 14px;
            height: 14px;
            background: linear-gradient(145deg, #9ca3af 0%, #6b7280 50%, #374151 100%);
            border-radius: 50%;
            position: absolute;
            top: 6px;
            left: 6px;
            border: 2px solid #d1d5db;
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }

          .executive-wheel::after {
            content: '';
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #f3f4f6 30%, #e5e7eb 70%);
            border-radius: 50%;
            position: absolute;
            top: 10px;
            left: 10px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .executive-wheel.front-executive {
            left: 30px;
          }

          .executive-wheel.rear-executive {
            left: 55px;
          }

          .executive-wheel.trailer-front-exec {
            left: 105px;
          }

          .executive-wheel.trailer-rear-exec {
            left: 135px;
          }

          /* Faruri LED executive */
          .executive-headlight {
            width: 10px;
            height: 12px;
            background: linear-gradient(145deg, #ffffff 0%, #f0f9ff 30%, #dbeafe 70%, #bfdbfe 100%);
            border-radius: 6px;
            position: absolute;
            top: 20px;
            left: 12px;
            animation: executiveLEDPulse 4s ease-in-out infinite;
            box-shadow: 
              0 0 25px rgba(255, 255, 255, 0.9),
              0 0 50px rgba(59, 130, 246, 0.6);
            border: 2px solid rgba(59, 130, 246, 0.4);
          }

          .executive-headlight::before {
            content: '';
            width: 6px;
            height: 8px;
            background: radial-gradient(circle, #ffffff 20%, #3b82f6 80%);
            border-radius: 3px;
            position: absolute;
            top: 2px;
            left: 2px;
            animation: headlightBeam 3s ease-in-out infinite;
          }

          /* Comunicații business */
          .executive-antenna {
            width: 3px;
            height: 15px;
            background: linear-gradient(145deg, #9ca3af 0%, #6b7280 50%, #374151 100%);
            border-radius: 2px;
            position: absolute;
            top: 6px;
            left: 42px;
            animation: antennaSignal 5s ease-in-out infinite;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .executive-antenna::after {
            content: '';
            width: 5px;
            height: 5px;
            background: radial-gradient(circle, #10b981 30%, #059669 70%);
            border-radius: 50%;
            position: absolute;
            top: -2px;
            left: -1px;
            animation: connectivityPulse 2s ease-in-out infinite;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
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

          @keyframes executiveWheelSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes iconPulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.1); 
              opacity: 0.8; 
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
            <div className="corporate-truck">
              <div className="executive-cab"></div>
              <div className="executive-grille"></div>
              <div className="executive-chassis"></div>
              <div className="corporate-container">
                <div className="corporate-branding"></div>
              </div>
              <div className="executive-wheel front-executive"></div>
              <div className="executive-wheel rear-executive"></div>
              <div className="executive-wheel trailer-front-exec"></div>
              <div className="executive-wheel trailer-rear-exec"></div>
              <div className="executive-headlight"></div>
              <div className="executive-antenna"></div>
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
            <label className="form-label">
              <i className="fas fa-envelope label-icon"></i>
              Email Corporativ
            </label>
            <div className="input-container">
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="numele@companie.com"
                autoComplete="email"
              />
              <i className="fas fa-building input-icon"></i>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="fas fa-shield-alt label-icon"></i>
              Parolă Securizată
            </label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
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