import express from 'express';
import cors from 'cors';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = join(__dirname, 'db.json');
const SECRET_KEY = 'weather-portfolio-secret-key-do-not-use-in-prod';

// Initialize DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: {} }));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware for auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const newUser = { id: Date.now().toString(), email, password }; // In production, hash the password!
  db.users.push(newUser);
  writeDB(db);
  
  const token = jwt.sign({ id: newUser.id, email }, SECRET_KEY);
  res.json({ token, user: { id: newUser.id, email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ id: user.id, email }, SECRET_KEY);
  res.json({ token, user: { id: user.id, email } });
});

// Favorites Routes
app.get('/api/favorites', authenticateToken, (req, res) => {
  const db = readDB();
  const userFavs = db.favorites[req.user.id] || [];
  res.json(userFavs);
});

app.post('/api/favorites', authenticateToken, (req, res) => {
  const { city } = req.body; // Expects {name, lat, lon}
  const db = readDB();
  
  if (!db.favorites[req.user.id]) db.favorites[req.user.id] = [];
  
  const favs = db.favorites[req.user.id];
  const exists = favs.find(f => f.lat === city.lat && f.lon === city.lon);
  
  if (exists) {
    db.favorites[req.user.id] = favs.filter(f => f.lat !== city.lat || f.lon !== city.lon);
  } else {
    db.favorites[req.user.id].push(city);
  }
  
  writeDB(db);
  res.json(db.favorites[req.user.id]);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Backend server running on http://localhost:' + PORT);
});
