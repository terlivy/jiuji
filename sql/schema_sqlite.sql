-- 酒友圈 SQLite 建表脚本

CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  phone        TEXT NOT NULL UNIQUE,
  nickname     TEXT NOT NULL,
  avatar       TEXT DEFAULT '',
  province     TEXT NOT NULL,
  city         TEXT NOT NULL,
  title        TEXT DEFAULT '',
  level        INTEGER DEFAULT 1,
  points       INTEGER DEFAULT 0,
  total_drinks INTEGER DEFAULT 0,
  openid       TEXT DEFAULT '',
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drink_records (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  drink_type      TEXT NOT NULL,
  drink_name      TEXT NOT NULL,
  amount          TEXT NOT NULL,
  alcohol_degree  TEXT DEFAULT '',
  location_name   TEXT DEFAULT '',
  latitude        REAL,
  longitude       REAL,
  content         TEXT DEFAULT '',
  images          TEXT DEFAULT '[]',
  friends         TEXT DEFAULT '[]',
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rankings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  province    TEXT NOT NULL,
  city        TEXT NOT NULL,
  period      TEXT NOT NULL DEFAULT 'total',
  drink_count INTEGER DEFAULT 0,
  points      INTEGER DEFAULT 0,
  rank        INTEGER DEFAULT 0,
  updated_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, period)
);

CREATE TABLE IF NOT EXISTS achievements (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  icon            TEXT NOT NULL,
  description     TEXT NOT NULL,
  condition_type  TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  points_reward   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at    TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id  INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS merchants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  brand_name  TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  contact     TEXT DEFAULT '',
  province    TEXT NOT NULL,
  city        TEXT NOT NULL,
  address     TEXT DEFAULT '',
  logo        TEXT DEFAULT '',
  intro       TEXT DEFAULT '',
  status      INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- 成就种子数据
INSERT OR IGNORE INTO achievements (code, name, icon, description, condition_type, condition_value, points_reward) VALUES
('baijiu_newbie',   '白酒小白',   '🍶', '喝了10次白酒',                        'drink_count',      10,  50),
('baijiu_master',   '白酒达人',   '🎖️', '喝了50次白酒',                        'drink_count',      50, 200),
('baijiu_god',     '白酒教父',   '🏆', '喝了200次白酒',                       'drink_count',     200, 500),
('pijiu_newbie',   '啤酒新人',   '🍺', '喝了20次啤酒',                        'drink_count',      20,  50),
('pijiu_master',   '啤酒王',     '🍺', '喝了100次啤酒',                       'drink_count',     100, 200),
('social_1',       '社交达人',   '🤝', '关注了10个酒友',                      'following_count',  10, 100),
('social_2',       '人脉王',     '🌟', '拥有100个粉丝',                       'follower_count',  100, 300),
('level_5',        'LV.5玩家',   '🎖️', '等级达到5级',                         'level',             5, 100),
('level_10',       'LV.10老炮',  '🏅', '等级达到10级',                        'level',            10, 300),
('points_1000',    '千元户',     '💰', '积分达到1000',                        'total_points',   1000,  50),
('points_5000',    '五千元户',   '💎', '积分达到5000',                        'total_points',   5000, 200),
('points_10000',   '万元户',     '👑', '积分达到10000',                       'total_points',  10000, 500),
('continuous_7',   '连续7天',    '🎯', '连续7天记录喝酒',                     'continuous_days',   7, 150),
('continuous_30',  '坚持一个月',  '🌙', '连续30天记录喝酒',                    'continuous_days',  30, 400);
