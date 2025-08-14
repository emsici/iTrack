import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/themes.css';
import './styles/professional.css';


// Import Capacitor plugins
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Initialize native features
  console.log('Running on native platform');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
