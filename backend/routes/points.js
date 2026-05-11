const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/points — 当前用户积分概览
router.get('/', auth, (req, res) => {
  try {
    const userId = req.user.userId;

    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });

    const points = user.points || 0;

    // 历史总获得（正 amount 加总）
    const earnedRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM points_history WHERE user_id = ? AND amount > 0'
    ).get(userId);
    const totalEarned = earnedRow.total;

    // 历史总消耗（负 amount 加总，取绝对值）
    const spentRow = db.prepare(
      'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM points_history WHERE user_id = ? AND amount < 0'
    ).get(userId);
    const totalSpent = spentRow.total;

    // 积分排行名次（有多少人比当前用户积分高，则 rank = count + 1）
    const rankRow = db.prepare(
      'SELECT COUNT(*) as cnt FROM users WHERE points > ?'
    ).get(points);
    const rank = rankRow.cnt + 1;

    res.json({
      code: 0,
      data: {
        points,
        totalEarned,
        totalSpent,
        rank
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/points/history — 积分变化记录（分页）
router.get('/history', auth, (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    const rows = db.prepare(
      'SELECT id, reason, amount, balance, created_at FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(userId, pageLimit, offset);

    const data = rows.map(r => ({
      ...r,
      amount: r.amount  // 正数=获得，负数=消耗
    }));

    res.json({ code: 0, data });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
