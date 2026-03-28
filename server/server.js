const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3001;

// Hardcoded Configuration
const WALLETCONNECT_PROJECT_ID = '71aee37d416435724b88c898b71df97a';
const ETH_RPC = 'https://eth.llamarpc.com';
const BNB_RPC = 'https://bsc-dataseed.binance.org';
const POLYGON_RPC = 'https://polygon-rpc.com';
const JWT_SECRET = 'samiristhegoat';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'samiristhegoat';

const RPC_ENDPOINTS = {
  ethereum: ETH_RPC,
  bnb: BNB_RPC,
  polygon: POLYGON_RPC
};

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('jwt', token, { httpOnly: true, secure: false, sameSite: 'strict' });
    return res.json({ message: 'Logged in', user: { username, role: 'admin' } });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out' });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json(req.user);
});

// Wallets (Watched Address Book)
app.get('/api/wallets', authenticate, (req, res) => {
  const wallets = db.prepare('SELECT * FROM watched_wallets').all();
  res.json(wallets);
});

app.post('/api/wallets', authenticate, (req, res) => {
  const { label, address, role } = req.body;
  try {
    db.prepare('INSERT INTO watched_wallets (label, address, role) VALUES (?, ?, ?)')
      .run(label, address.toLowerCase(), role || 'viewer');
    res.json({ message: 'Wallet added' });
  } catch (err) {
    res.status(400).json({ message: 'Error adding wallet (likely already exists)' });
  }
});

// Destinations (Saved Destinations)
app.get('/api/destinations', authenticate, (req, res) => {
  const dests = db.prepare('SELECT * FROM saved_destinations').all();
  res.json(dests);
});

app.post('/api/destinations', authenticate, (req, res) => {
  const { label, address, network } = req.body;
  db.prepare('INSERT INTO saved_destinations (label, address, network) VALUES (?, ?, ?)')
    .run(label, address.toLowerCase(), network);
  res.json({ message: 'Destination added' });
});

app.delete('/api/destinations/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM saved_destinations WHERE id = ?').run(req.params.id);
  res.json({ message: 'Destination deleted' });
});

// Cross-Chain Balance Fetching (Server-side)
app.get('/api/balances/:address', authenticate, async (req, res) => {
  const { address } = req.params;
  const results = {};

  const providers = {
    ethereum: new ethers.JsonRpcProvider(RPC_ENDPOINTS.ethereum),
    bnb: new ethers.JsonRpcProvider(RPC_ENDPOINTS.bnb),
    polygon: new ethers.JsonRpcProvider(RPC_ENDPOINTS.polygon)
  };

  try {
    const fetchPromises = Object.entries(providers).map(async ([network, provider]) => {
      try {
        const balance = await provider.getBalance(address);
        results[network] = ethers.formatEther(balance);
      } catch (e) {
        results[network] = "0.0";
        console.error(`Failed to fetch ${network} balance:`, e);
      }
    });

    await Promise.all(fetchPromises);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching balances' });
  }
});

// Serve static build from client/dist (for production)
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
