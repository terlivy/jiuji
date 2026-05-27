# 酒友圈 (Jiuji)

一款记录喝酒、排行比拼、认识酒友的社交应用。

## 功能特性

| 模块 | 说明 |
|------|------|
| **登录注册** | 手机号 + 昵称 + 省市，一键注册/登录 |
| **记录喝酒** | 记录酒类、酒名、数量、酒精度、地理位置、文字、图片 |
| **动态广场** | 浏览所有酒友的喝酒记录 |
| **排行榜** | 按省市查看总榜/月榜/周榜排名 |
| **社交关注** | 关注/取关其他酒友 |
| **成就系统** | 15 种成就（白酒达人、啤酒王、社交达人等） |
| **积分体系** | 喝酒得积分，积分换等级 |

## 技术栈

**前端**
- Vue 3 + Composition API
- Vite 5 (构建工具)
- Vue Router 4 (路由)
- Pinia 2 (状态管理)
- Axios (HTTP 请求)

**后端**
- Node.js + Express 4
- better-sqlite3 (SQLite 数据库)
- JWT (用户认证)
- multer (文件上传)

## 项目结构

```
jiuji/
├── frontend/          # Vue 3 前端应用
│   ├── src/
│   │   ├── api/       # API 调用封装
│   │   ├── components/ # 公共组件 (BottomNav 等)
│   │   ├── router/    # 路由配置
│   │   ├── stores/    # Pinia 状态管理 (user, points)
│   │   ├── views/     # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express API 服务
│   ├── routes/        # API 路由
│   │   ├── auth.js       # 注册/登录
│   │   ├── users.js      # 用户资料
│   │   ├── records.js    # 喝酒记录 CRUD
│   │   ├── rankings.js   # 排行榜
│   │   ├── leaderboard.js
│   │   ├── achievements.js
│   │   ├── follows.js    # 关注/粉丝
│   │   ├── ai.js         # AI 相关
│   │   └── points.js
│   ├── config/
│   ├── middleware/
│   ├── data/
│   ├── scripts/
│   ├── app.js         # 入口文件
│   └── .env.example
├── sql/
│   ├── schema.sql          # MySQL 建表脚本
│   └── schema_sqlite.sql   # SQLite 建表脚本
└── docs/
```

## 数据库表

| 表名 | 说明 |
|------|------|
| `users` | 用户表（手机号、昵称、头像、省市、等级、积分、喝酒次数） |
| `drink_records` | 喝酒记录（酒类、酒名、数量、酒精度、地理位置、图片） |
| `rankings` | 排行榜快照（按省/市，总榜/月榜/周榜） |
| `achievements` | 成就定义表 |
| `user_achievements` | 用户已解锁成就 |
| `follows` | 关注关系 |
| `merchants` | 商户信息 |

## 成就一览

| 成就 | 条件 | 奖励积分 |
|------|------|---------|
| 🍶 白酒小白 | 喝 10 次白酒 | 50 |
| 🍶 白酒达人 | 喝 50 次白酒 | 200 |
| 🍶 白酒教父 | 喝 200 次白酒 | 500 |
| 🍺 啤酒新人 | 喝 20 次啤酒 | 50 |
| 🍺 啤酒王 | 喝 100 次啤酒 | 200 |
| 🤝 社交达人 | 关注 10 个酒友 | 100 |
| 🌟 人脉王 | 拥有 100 粉丝 | 300 |
| LV.5 玩家 | 等级达到 5 级 | 100 |
| LV.10 老炮 | 等级达到 10 级 | 300 |
| 💰 千元户 | 积分达到 1000 | 50 |
| 💎 五千元户 | 积分达到 5000 | 200 |
| 👑 万元户 | 积分达到 10000 | 500 |
| 🎯 连续 7 天 | 连续 7 天记录 | 150 |
| 🌙 坚持一个月 | 连续 30 天记录 | 400 |

## 快速开始

### 环境要求

- Node.js >= 16
- npm 或 bun

### 1. 克隆项目

```bash
git clone https://github.com/terlivy/jiuji.git
cd jiuji
```

### 2. 启动后端

```bash
cd backend
cp .env.example .env   # 编辑配置（可选）
npm install
npm run dev            # 或直接 node app.js
```

默认服务运行在 `http://localhost:3000`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认服务运行在 `http://localhost:5173`，API 代理到 `http://localhost:3000`

### 4. 配置数据库

SQLite（默认，无需配置）：
```bash
# 直接使用，数据库文件创建在 backend/jiuyouquan.db
```

MySQL：
```bash
# 导入 sql/schema.sql 到 MySQL
# 修改 backend/.env 中的数据库配置
```

## API 列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| GET | `/api/users/profile` | 获取个人资料 |
| PUT | `/api/users/profile` | 更新个人资料 |
| GET | `/api/records` | 获取喝酒记录（动态广场） |
| GET | `/api/records/mine` | 获取我的记录 |
| POST | `/api/records` | 发布喝酒记录 |
| GET | `/api/rankings` | 排行榜 |
| GET | `/api/achievements` | 成就列表 |
| POST | `/api/follows` | 关注用户 |
| DELETE | `/api/follows/:id` | 取消关注 |
| GET | `/api/follows/followers` | 我的粉丝 |
| GET | `/api/follows/following` | 我的关注 |

## 前端页面

| 路径 | 页面 |
|------|------|
| `/` | 首页（排行榜） |
| `/feed` | 动态广场 |
| `/add` | 记一笔（发布记录） |
| `/profile` | 个人主页 |
| `/points` | 积分明细 |
| `/user/:id` | 访问他人主页 |
| `/login` | 登录页 |

## 环境变量 (.env)

```env
PORT=3000
DB_PATH=./jiuyouquan.db        # SQLite 路径（默认）
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

MySQL 配置（可选）：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jiuyouquan
```

## 开发说明

### 前端开发

```bash
cd frontend
npm run dev    # 开发服务器 (localhost:5173)
npm run build  # 生产构建
npm run preview # 预览生产构建
```

### 后端开发

```bash
cd backend
npm run dev    # 使用 nodemon 热重载
# 或
node app.js    # 直接运行
```

### 路由守卫

前端所有页面需要登录后才能访问（`/login` 除外）。未登录用户会自动跳转到登录页。

### 图片上传

当前实现将图片以 Base64 形式存储在 `drink_records.images` 字段。如需生产使用，建议配置七牛云或其他 OSS 服务。

### 地理定位

使用腾讯地图逆地址解析 API 获取位置名称。可在 `.env` 中配置腾讯地图 key。

## License

MIT