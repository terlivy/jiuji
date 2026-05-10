require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Initialize SQLite ---
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'jiuyouquan.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema_sqlite.sql'), 'utf8');
const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
for (const stmt of statements) {
  try { db.exec(stmt); } catch(e) { /* ignore dup errors */ }
}
console.log('✅ SQLite DB ready:', DB_PATH);

// Make db available to routes
app.set('db', db);

// routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/records',   require('./routes/records'));
app.use('/api/rankings',   require('./routes/rankings'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/follows',    require('./routes/follows'));
app.use('/api/ai',         require('./routes/ai'));

// health check
app.get('/health', (req, res) => res.json({ status: 'ok', db: DB_PATH }));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, msg: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🍶 酒友圈 API running on http://localhost:${PORT}`);
});
