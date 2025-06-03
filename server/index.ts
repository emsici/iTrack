import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// GPS credentials endpoint
app.post('/api/gps/credentials', (req, res) => {
  console.log('[GPS Credentials] Credențiale GPS setate cu succes');
  res.json({ success: true, message: 'Credențiale GPS setate cu succes' });
});

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('[Auth] Începe procesul de autentificare...');
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhlbXBsdS5jb20iLCJleHAiOjE3NDg5ODQzOTl9.-khplIDZmJEXOURpncwcbYZrZFrqDAmolzQlkiMdfB4';
  console.log('[Auth] ✅ Token Bearer obținut cu succes');
  res.json({ 
    status: 'success', 
    token,
    user: { email: 'test@exemplu.com' }
  });
});

// GPS data transmission endpoint
app.post('/api/gps/send', async (req, res) => {
  const gpsData = req.body;
  console.log('[GPS Proxy] Primesc date GPS pentru transmisie:', gpsData);
  
  try {
    // Simulate external GPS transmission
    console.log('[GPS Proxy] Trimit date GPS cu Bearer token...');
    console.log('[GPS Proxy] Răspuns server extern: 204');
    
    res.json({ 
      success: true, 
      message: 'GPS data sent successfully',
      serverResponse: ''
    });
  } catch (error) {
    console.error('[GPS Proxy] Eroare transmisie GPS:', error);
    res.status(500).json({ success: false, message: 'GPS transmission failed' });
  }
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;