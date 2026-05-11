const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// 计算爵位
function calcTitle(totalDrinks) {
  if (totalDrinks > 100) return '🍶酒神';
  if (totalDrinks > 50)  return '🥃酒仙';
  if (totalDrinks > 20)  return '🍷酒魁';
  if (totalDrinks > 5)   return '🍵酒客';
  return '🍃新手';
}

// GET /api/records
router.get('/', auth, (req, res) => {
  try {
    const { page = 1, limit = 20, drink_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'r.user_id = u.id';
    if (drink_type) where += ` AND r.drink_type = '${drink_type.replace(/'/g,"''")}'`;

    const rows = db.prepare(
      `SELECT r.*, u.nickname, u.avatar, u.province, u.city, u.level, u.title
       FROM drink_records r, users u
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(parseInt(limit), offset);

    const data = rows.map(r => ({
      ...r,
      images:  r.images  ? JSON.parse(r.images)  : [],
      friends: r.friends ? JSON.parse(r.friends) : [],
    }));
    res.json({ code: 0, data });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/records
router.post('/', auth, (req, res) => {
  try {
    const { drink_type, drink_name, amount, alcohol_degree, location_name,
            latitude, longitude, content, images, friends } = req.body;
    const userId = req.user.userId;

    const info = db.prepare(
      `INSERT INTO drink_records
        (user_id,drink_type,drink_name,amount,alcohol_degree,location_name,latitude,longitude,content,images,friends)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      userId, drink_type, drink_name, amount, alcohol_degree || '',
      location_name || '', latitude || null, longitude || null,
      content || '',
      images ? JSON.stringify(images) : '[]',
      friends ? JSON.stringify(friends) : '[]'
    );

    // 更新用户统计（爵位逻辑）
    const row = db.prepare('SELECT total_drinks FROM users WHERE id=?').get(userId);
    const newTotal = (row?.total_drinks || 0) + 1;
    const newTitle = calcTitle(newTotal);
    db.prepare('UPDATE users SET total_drinks=?, title=?, points=points+10 WHERE id=?').run(newTotal, newTitle, userId);

    // 写积分记录
    const updatedUser = db.prepare('SELECT points FROM users WHERE id=?').get(userId);
    const newPoints = updatedUser.points;
    db.prepare(
      'INSERT INTO points_history (user_id, reason, amount, balance) VALUES (?, ?, ?, ?)'
    ).run(userId, '发帖奖励', 10, newPoints);

    // 刷新排行
    refreshRanking(userId);

    // 检查成就
    checkAchievements(userId);

    res.json({ code: 0, data: { id: info.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/records/mine
router.get('/mine', auth, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM drink_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
    ).all(req.user.userId);
    const data = rows.map(r => ({
      ...r,
      images:  r.images  ? JSON.parse(r.images)  : [],
      friends: r.friends ? JSON.parse(r.friends) : [],
    }));
    res.json({ code: 0, data });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

function refreshRanking(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return;

  // 统计喝酒次数（总榜）
  const countRow = db.prepare(
    "SELECT COUNT(*) as cnt FROM drink_records WHERE user_id = ?"
  ).get(userId);

  db.prepare(
    `INSERT OR REPLACE INTO rankings (user_id, province, city, period, drink_count, points, rank)
     VALUES (?, ?, ?, 'total', ?, ?, 0)`
  ).run(userId, user.province, user.city, countRow.cnt, user.points);

  // 重新算 rank
  const all = db.prepare(
    "SELECT * FROM rankings WHERE period='total' ORDER BY drink_count DESC, points DESC"
  ).all();
  all.forEach((r, i) => {
    db.prepare("UPDATE rankings SET rank=? WHERE user_id=? AND period='total'").run(i+1, r.user_id);
  });
}

function checkAchievements(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const unlocked = db.prepare(
    'SELECT achievement_id FROM user_achievements WHERE user_id = ?'
  ).all(userId).map(r => r.achievement_id);

  const all = db.prepare('SELECT * FROM achievements').all();

  for (const a of all) {
    if (unlocked.includes(a.id)) continue;
    let ok = false;
    switch (a.condition_type) {
      case 'drink_count':   ok = user.total_drinks >= a.condition_value; break;
      case 'total_points':   ok = user.points >= a.condition_value; break;
      case 'level':          ok = user.level >= a.condition_value; break;
    }
    if (ok) {
      db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?,?)').run(userId, a.id);
      if (a.points_reward > 0) {
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(a.points_reward, userId);
      }
    }
  }
}

module.exports = router;
