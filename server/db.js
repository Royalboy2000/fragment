const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db.sqlite'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS watched_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    address TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'viewer',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    network TEXT NOT NULL
  );
`);

// Pre-seed saved_destinations
const seedAddress = '0x5020eefd8c93680510f06daa8096e5f20d34b23b';
const exists = db.prepare('SELECT id FROM saved_destinations WHERE address = ?').get(seedAddress);

if (!exists) {
  db.prepare('INSERT INTO saved_destinations (label, address, network) VALUES (?, ?, ?)')
    .run('Main Receiving Wallet', seedAddress, 'all');
}

module.exports = db;
