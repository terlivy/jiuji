const db = require('../config/db');
const { ensureUserTitleColumn } = require('../config/migrate');

ensureUserTitleColumn(db);

const columns = db.prepare('PRAGMA table_info(users)').all().map(column => column.name);
if (!columns.includes('title')) {
  throw new Error('users.title column is required by profile and records routes');
}

db.prepare(
  `SELECT u.id,u.nickname,u.avatar,u.province,u.city,u.level,u.points,
          u.total_drinks,u.title,u.created_at,
          (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)  AS following_count
   FROM users u LIMIT 1`
).all();

console.log('User profile query check passed');
