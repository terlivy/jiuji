const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/leaderboard
// Query params: month (optional, format YYYY-MM) - if not provided, returns total ranking
router.get('/', (req, res) => {
  try {
    const { month } = req.query;
    let rows;

    if (month) {
      // Monthly ranking - count records in the specific month
      rows = db.prepare(`
        SELECT u.id, u.nickname, u.avatar, u.province, u.city, u.level, u.points,
               u.total_drinks, COUNT(dr.id) as drink_count
        FROM users u
        LEFT JOIN drink_records dr ON dr.user_id = u.id AND strftime('%Y-%m', dr.created_at) = ?
        GROUP BY u.id
        ORDER BY drink_count DESC, u.total_drinks DESC
        LIMIT 10
      `).all(month);
    } else {
      // Total ranking - use users.total_drinks
      rows = db.prepare(`
        SELECT id, nickname, avatar, province, city, level, points, total_drinks as drink_count
        FROM users
        ORDER BY total_drinks DESC, points DESC
        LIMIT 10
      `).all();
    }

    const list = rows.map((u, i) => ({
      ...u,
      rank: i + 1
    }));

    res.json({ code: 0, data: { list } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
