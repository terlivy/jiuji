const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/achievements
router.get('/', auth, (req, res) => {
  try {
    const all = db.prepare('SELECT * FROM achievements ORDER BY condition_value ASC').all();
    const unlocked = db.prepare(
      'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?'
    ).all(req.user.userId);
    const unlockedMap = new Map(unlocked.map(u => [u.achievement_id, u.unlocked_at]));

    const data = all.map(a => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id) || null
    }));
    res.json({ code: 0, data });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
