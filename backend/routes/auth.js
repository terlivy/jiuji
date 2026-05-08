const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { phone, nickname, province, city } = req.body;
    if (!phone || !nickname || !province || !city) {
      return res.status(400).json({ code: 400, msg: '参数不完整' });
    }
    const exist = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (exist) return res.status(409).json({ code: 409, msg: '手机号已注册' });

    const info = db.prepare(
      'INSERT INTO users (phone, nickname, province, city) VALUES (?, ?, ?, ?)'
    ).run(phone, nickname, province, city);

    const token = jwt.sign(
      { userId: info.lastInsertRowid },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );
    res.json({ code: 0, data: { token, userId: info.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { phone } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );
    delete user.password;
    res.json({ code: 0, data: { token, user } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id,phone,nickname,avatar,province,city,level,points,total_drinks,created_at FROM users WHERE id = ?'
    ).get(req.user.userId);
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });
    res.json({ code: 0, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
