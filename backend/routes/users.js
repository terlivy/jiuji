const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', auth, (req, res) => {
  try {
    const user = db.prepare(
      `SELECT u.id,u.nickname,u.avatar,u.province,u.city,u.level,u.points,
              u.total_drinks,u.created_at,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)  AS following_count
       FROM users u WHERE u.id = ?`
    ).get(req.user.userId);
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });
    res.json({ code: 0, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', auth, (req, res) => {
  try {
    const { nickname, avatar, province, city } = req.body;
    db.prepare(
      'UPDATE users SET nickname=COALESCE(?,nickname),avatar=COALESCE(?,avatar),province=COALESCE(?,province),city=COALESCE(?,city) WHERE id=?'
    ).run(nickname||null, avatar||null, province||null, city||null, req.user.userId);
    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', auth, (req, res) => {
  try {
    const uid = parseInt(req.params.id);
    const user = db.prepare(
      `SELECT u.id,u.nickname,u.avatar,u.province,u.city,u.level,u.points,u.total_drinks,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)  AS following_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id=? AND following_id=?) AS is_following
       FROM users u WHERE u.id = ?`
    ).get(req.user.userId, uid, uid);
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });
    res.json({ code: 0, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
