const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/rankings
router.get('/', auth, (req, res) => {
  try {
    const { province, city, period = 'total' } = req.query;

    let where = `r.period = '${period}'`;
    const params = [];

    if (province) {
      where += ` AND r.province = ?`;
      params.push(province);
    }
    if (city) {
      where += ` AND r.city = ?`;
      params.push(city);
    }

    const rows = db.prepare(
      `SELECT u.id, u.nickname, u.avatar, u.province, u.city, u.level,
              u.points, r.drink_count, r.rank
       FROM rankings r, users u
       WHERE r.user_id = u.id AND ${where}
       ORDER BY r.rank ASC
       LIMIT 100`
    ).all(...params);

    // 当前用户排名
    let myRank = null;
    const user = db.prepare('SELECT province, city FROM users WHERE id = ?').get(req.user.userId);
    if (province && city && user) {
      const me = db.prepare(
        "SELECT rank FROM rankings WHERE user_id=? AND period=? AND province=? AND city=?"
      ).get(req.user.userId, period, province, city);
      if (me) myRank = me.rank;
    }

    res.json({ code: 0, data: { list: rows, myRank } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/rankings/my
router.get('/my', auth, (req, res) => {
  try {
    const { province, city, period = 'total' } = req.query;
    const row = db.prepare(
      `SELECT r.*, u.nickname, u.avatar, u.province, u.city
       FROM rankings r, users u
       WHERE r.user_id = u.id AND r.user_id = ? AND r.period = ?`
    ).get(req.user.userId, period);
    res.json({ code: 0, data: row || null });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
