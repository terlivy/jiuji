const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/follows
router.post('/', auth, (req, res) => {
  try {
    const { following_id } = req.body;
    if (following_id == req.user.userId) return res.status(400).json({ code: 400, msg: '不能关注自己' });
    db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.userId, following_id);
    res.json({ code: 0, msg: '关注成功' });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/follows/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.user.userId, req.params.id);
    res.json({ code: 0, msg: '已取消关注' });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/follows/followers
router.get('/followers', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT u.id,u.nickname,u.avatar,u.province,u.city,u.level,u.points
       FROM follows f, users u WHERE f.follower_id=u.id AND f.following_id=?`
    ).all(req.user.userId);
    res.json({ code: 0, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/follows/following
router.get('/following', auth, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT u.id,u.nickname,u.avatar,u.province,u.city,u.level,u.points
       FROM follows f, users u WHERE f.following_id=u.id AND f.follower_id=?`
    ).all(req.user.userId);
    res.json({ code: 0, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
