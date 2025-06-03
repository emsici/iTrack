import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import { createServer } from "http";
import path from "path";

const app = express();

// Configure CORS for mobile access
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple session management
app.use(session({
  secret: 'itrack-gps-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Simple in-memory users store
const users = new Map();
users.set('admin', { id: 1, username: 'admin', password: 'admin123' });

// Auth routes
app.post('/api/login', (req: any, res) => {
  const { username, password } = req.body;
  
  const user = users.get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  res.json({ user: { id: user.id, username: user.username } });
});

app.post('/api/register', (req: any, res) => {
  const { username, password } = req.body;
  
  if (users.has(username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  const newUser = { id: users.size + 1, username, password };
  users.set(username, newUser);
  
  req.session.userId = newUser.id;
  res.json({ user: { id: newUser.id, username: newUser.username } });
});

app.get('/api/me', (req: any, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = Array.from(users.values()).find((u: any) => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({ user: { id: user.id, username: user.username } });
});

app.post('/api/logout', (req: any, res) => {
  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// GPS data endpoint
app.post('/api/gps', (req: any, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  console.log('GPS Data received:', req.body);
  res.json({ message: 'GPS data received successfully', data: req.body });
});

(async () => {
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Serve static files for SPA
  app.use(express.static(path.join(process.cwd(), 'dist')));
  
  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });

  const server = createServer(app);

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Default login: admin / admin123`);
  });
})();