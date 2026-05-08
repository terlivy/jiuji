-- ============================================================
-- 酒友圈 · 数据库建表脚本
-- 数据库: jiuyouquan
-- 字符集: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS `jiuyouquan`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `jiuyouquan`;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE `users` (
  `id`          BIGINT UNSIGNED  AUTO_INCREMENT  PRIMARY KEY  COMMENT '用户ID',
  `phone`       VARCHAR(20)      NOT NULL         UNIQUE       COMMENT '手机号',
  `nickname`    VARCHAR(50)      NOT NULL                        COMMENT '昵称',
  `avatar`      VARCHAR(500)     DEFAULT ''                      COMMENT '头像URL',
  `province`    VARCHAR(30)      NOT NULL                        COMMENT '省份',
  `city`        VARCHAR(30)      NOT NULL                        COMMENT '城市',
  `level`       TINYINT UNSIGNED DEFAULT 1                       COMMENT '等级',
  `points`      INT UNSIGNED     DEFAULT 0                        COMMENT '积分',
  `total_drinks` INT UNSIGNED    DEFAULT 0                        COMMENT '总喝酒次数',
  `openid`      VARCHAR(100)     DEFAULT ''                        COMMENT '微信openid（小程序用）',
  `created_at`  DATETIME         DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_province_city` (`province`, `city`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 喝酒记录表
-- ============================================================
CREATE TABLE `drink_records` (
  `id`             BIGINT UNSIGNED  AUTO_INCREMENT  PRIMARY KEY,
  `user_id`        BIGINT UNSIGNED  NOT NULL,
  `drink_type`     VARCHAR(20)      NOT NULL                        COMMENT '白酒/啤酒/红酒/威士忌/清酒/香槟/其他',
  `drink_name`     VARCHAR(100)     NOT NULL                        COMMENT '酒名',
  `amount`         VARCHAR(30)      NOT NULL                        COMMENT '数量，如：2两、4瓶、半瓶',
  `alcohol_degree` VARCHAR(10)      DEFAULT ''                        COMMENT '酒精度，如：53°、8°',
  `location_name`  VARCHAR(200)     DEFAULT ''                        COMMENT '地点名称',
  `latitude`       DECIMAL(10,6)    DEFAULT NULL                      COMMENT '纬度',
  `longitude`      DECIMAL(11,6)    DEFAULT NULL                      COMMENT '经度',
  `content`        TEXT                                                   COMMENT '文字内容',
  `images`         JSON                                                  COMMENT '图片URL数组',
  `friends`        JSON                                                  COMMENT '同饮好友user_id数组',
  `created_at`     DATETIME         DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_province_city` (`user_id`, `created_at`),
  CONSTRAINT `fk_drink_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='喝酒记录表';

-- ============================================================
-- 3. 排行榜快照表（定时任务刷新）
-- ============================================================
CREATE TABLE `rankings` (
  `id`           BIGINT UNSIGNED  AUTO_INCREMENT  PRIMARY KEY,
  `user_id`      BIGINT UNSIGNED  NOT NULL,
  `province`     VARCHAR(30)      NOT NULL,
  `city`         VARCHAR(30)      NOT NULL,
  `period`       ENUM('total','month','week')  NOT NULL  DEFAULT 'total'  COMMENT '统计周期',
  `drink_count`  INT UNSIGNED     DEFAULT 0,
  `points`       INT UNSIGNED     DEFAULT 0,
  `rank`         INT UNSIGNED     DEFAULT 0,
  `updated_at`   DATETIME         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_period` (`user_id`, `period`),
  INDEX `idx_rank` (`province`, `city`, `period`, `rank`),
  CONSTRAINT `fk_rank_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='排行榜快照表';

-- ============================================================
-- 4. 成就定义表
-- ============================================================
CREATE TABLE `achievements` (
  `id`               BIGINT UNSIGNED  AUTO_INCREMENT  PRIMARY KEY,
  `code`             VARCHAR(50)      NOT NULL  UNIQUE              COMMENT '成就代码',
  `name`             VARCHAR(50)     NOT NULL                        COMMENT '成就名称',
  `icon`             VARCHAR(50)     NOT NULL                        COMMENT '图标emoji',
  `description`      VARCHAR(200)    NOT NULL                        COMMENT '描述',
  `condition_type`   VARCHAR(30)     NOT NULL                        COMMENT '条件类型：drink_count/total_points/followers/continuous_days/single_drinks',
  `condition_value`  INT             NOT NULL                        COMMENT '条件数值',
  `points_reward`    INT UNSIGNED    DEFAULT 0                        COMMENT '积分奖励',
  `created_at`       DATETIME        DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就定义表';

-- ============================================================
-- 5. 用户成就表
-- ============================================================
CREATE TABLE `user_achievements` (
  `user_id`        BIGINT UNSIGNED  NOT NULL,
  `achievement_id` BIGINT UNSIGNED  NOT NULL,
  `unlocked_at`    DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `achievement_id`),
  CONSTRAINT `fk_ua_user`   FOREIGN KEY (`user_id`)        REFERENCES `users`(`id`)         ON DELETE CASCADE,
  CONSTRAINT `fk_ua_achieve` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就表';

-- ============================================================
-- 6. 关注关系表
-- ============================================================
CREATE TABLE `follows` (
  `follower_id`   BIGINT UNSIGNED  NOT NULL  COMMENT '关注者',
  `following_id`  BIGINT UNSIGNED  NOT NULL  COMMENT '被关注者',
  `created_at`    DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`, `following_id`),
  INDEX `idx_following` (`following_id`),
  CONSTRAINT `fk_follow_follower`  FOREIGN KEY (`follower_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_follow_following` FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关注关系表';

-- ============================================================
-- 7. 酒商表（商业化阶段）
-- ============================================================
CREATE TABLE `merchants` (
  `id`           BIGINT UNSIGNED  AUTO_INCREMENT  PRIMARY KEY,
  `name`         VARCHAR(100)     NOT NULL                        COMMENT '商户名称',
  `brand_name`   VARCHAR(100)     DEFAULT ''                        COMMENT '品牌名称',
  `category`     VARCHAR(30)      DEFAULT ''                        COMMENT '品类：白酒/啤酒/红酒...',
  `contact`      VARCHAR(50)      DEFAULT ''                        COMMENT '联系方式',
  `province`     VARCHAR(30)      NOT NULL                        COMMENT '省份',
  `city`         VARCHAR(30)      NOT NULL                        COMMENT '城市',
  `address`      VARCHAR(200)     DEFAULT ''                        COMMENT '地址',
  `logo`         VARCHAR(500)     DEFAULT ''                        COMMENT 'logo URL',
  `intro`        TEXT                                                   COMMENT '简介',
  `status`       TINYINT UNSIGNED DEFAULT 1                        COMMENT '状态：0待审1通过2拒绝',
  `created_at`   DATETIME         DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_province_city` (`province`, `city`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='酒商表';

-- ============================================================
-- 种子数据：成就定义
-- ============================================================
INSERT INTO `achievements` (`code`, `name`, `icon`, `description`, `condition_type`, `condition_value`, `points_reward`) VALUES
-- 白酒系
('baijiu_newbie',   '白酒小白',   '🍶', '喝了10次白酒',                        'drink_count',      10,  50),
('baijiu_master',   '白酒达人',   '🎖️', '喝了50次白酒',                        'drink_count',      50, 200),
('baijiu_god',      '白酒教父',   '🏆', '喝了200次白酒',                       'drink_count',     200, 500),
-- 啤酒系
('pijiu_newbie',   '啤酒新人',   '🍺', '喝了20次啤酒',                        'drink_count',      20,  50),
('pijiu_master',   '啤酒王',     '🍺', '喝了100次啤酒',                       'drink_count',     100, 200),
-- 社交系
('social_1',        '社交达人',   '🤝', '关注了10个酒友',                      'following_count',  10, 100),
('social_2',        '人脉王',     '🌟', '拥有100个粉丝',                       'follower_count',  100, 300),
-- 成就系
('level_5',        'LV.5玩家',   '🎖️', '等级达到5级',                         'level',             5, 100),
('level_10',       'LV.10老炮',  '🏅', '等级达到10级',                        'level',            10, 300),
-- 积分系
('points_1000',    '千元户',     '💰', '积分达到1000',                        'total_points',   1000,  50),
('points_5000',    '五千元户',   '💎', '积分达到5000',                        'total_points',   5000, 200),
('points_10000',   '万元户',     '👑', '积分达到10000',                       'total_points',  10000, 500),
-- 连续系
('continuous_7',   '连续7天',    '🎯', '连续7天记录喝酒',                     'continuous_days',   7, 150),
('continuous_30',  '坚持一个月',  '🌙', '连续30天记录喝酒',                    'continuous_days',  30, 400);

-- ============================================================
-- 存储过程：刷新排行榜
-- ============================================================
DELIMITER $$
CREATE PROCEDURE `refresh_rankings`(IN p_period ENUM('total','month','week'))
BEGIN
  DECLARE p_start DATETIME;

  IF p_period = 'month' THEN
    SET p_start = DATE_FORMAT(CURDATE(), '%Y-%m-01');
  ELSEIF p_period = 'week' THEN
    SET p_start = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);
  ELSE
    SET p_start = '1970-01-01';
  END IF;

  -- 临时表算排名
  DROP TEMPORARY TABLE IF EXISTS tmp_rank;
  CREATE TEMPORARY TABLE tmp_rank AS
  SELECT
    u.id AS user_id,
    u.province,
    u.city,
    COUNT(r.id) AS drink_count,
    u.points,
    @rank:=@rank+1 AS new_rank
  FROM users u
  LEFT JOIN drink_records r ON r.user_id = u.id AND r.created_at >= p_start
  CROSS JOIN (SELECT @rank:=0) vars
  GROUP BY u.id, u.province, u.city, u.points
  ORDER BY drink_count DESC, u.points DESC;

  -- upsert
  INSERT INTO rankings (user_id, province, city, period, drink_count, points, `rank`)
  SELECT user_id, province, city, p_period, drink_count, points, new_rank
  FROM tmp_rank
  ON DUPLICATE KEY UPDATE
    drink_count = VALUES(drink_count),
    points      = VALUES(points),
    `rank`      = VALUES(`rank`),
    updated_at  = NOW();

  DROP TEMPORARY TABLE IF EXISTS tmp_rank;
END$$
DELIMITER ;

-- 每周日凌晨2点执行总榜 + 月榜刷新
-- 每天凌晨2点执行周榜刷新（周一到周日）
-- 0 2 * * 0,1,2,3,4,5,6 CALL refresh_rankings('week');
-- 0 2 1 * * CALL refresh_rankings('month');
-- 0 2 * * 0 CALL refresh_rankings('total');
