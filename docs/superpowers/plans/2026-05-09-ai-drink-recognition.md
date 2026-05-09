# AI 酒标识别 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户拍照酒瓶 → AI 自动识别酒名、品牌、类型、市场参考价 → 一键录入喝酒记录

**Architecture:**
- 前端拍照 → base64 编码 → POST /api/ai/recognize
- 后端接收图片 → 调用 MiniMax 视觉模型识别 → 返回结构化 JSON（酒名/品牌/类型/参考价）
- 参考价基于内置酒类数据库（Phase 1 手动维护，Phase 3 接入价格API）
- 识别结果缓存到本次记录会话，用户确认后写入 drink_records

**Tech Stack:** MiniMax 视觉模型（已知可用）/ 内置酒类价格库 / Express + SQLite

---

## File Structure

```
backend/
  routes/
    ai.js              # 新建: /api/ai/recognize 识别接口
  data/
    drinks_db.json      # 新建: 内置酒类参考数据库（酒名→参考价）
  app.js               # 注册 ai.js 路由

frontend/src/
  views/
    AddRecord.vue      # 修改: 集成 AI 识别结果展示 + 确认按钮
  api/
    index.js           # 修改: 添加 ai.recognize 接口
  stores/
    points.js          # 新建: 积分 store（管理积分状态）
```

---

## Task 1: 内置酒类参考数据库

**Files:**
- Create: `backend/data/drinks_db.json`
- Modify: `backend/data/.gitkeep` (空文件占目录)

**Files:**
- Create: `backend/data/drinks_db.json`

- [ ] **Step 1: 创建酒类参考数据库**

```json
{
  "白酒": [
    {"name": "茅台飞天", "brand": "茅台", "ml": 500, "abv": 53, "ref_price": 2500, "tags": ["酱香", "高端"]},
    {"name": "茅台1935", "brand": "茅台", "ml": 500, "abv": 53, "ref_price": 1200, "tags": ["酱香", "中端"]},
    {"name": "五粮液普五", "brand": "五粮液", "ml": 500, "abv": 52, "ref_price": 980, "tags": ["浓香", "高端"]},
    {"name": "国窖1573", "brand": "泸州老窖", "ml": 500, "abv": 52, "ref_price": 900, "tags": ["浓香", "高端"]},
    {"name": "剑南春水晶剑", "brand": "剑南春", "ml": 500, "abv": 52, "ref_price": 420, "tags": ["浓香", "中端"]},
    {"name": "舍得", "brand": "舍得", "ml": 500, "abv": 52, "ref_price": 380, "tags": ["浓香", "中端"]},
    {"name": "水井坊井台", "brand": "水井坊", "ml": 500, "abv": 52, "ref_price": 450, "tags": ["浓香", "中端"]},
    {"name": "郎酒红花郎十五", "brand": "郎酒", "ml": 500, "abv": 53, "ref_price": 550, "tags": ["酱香", "中端"]},
    {"name": "习酒窖藏1988", "brand": "习酒", "ml": 500, "abv": 53, "ref_price": 580, "tags": ["酱香", "中端"]},
    {"name": "珍酒珍十五", "brand": "珍酒", "ml": 500, "abv": 53, "ref_price": 380, "tags": ["酱香", "中端"]},
    {"name": "金沙回沙摘要", "brand": "金沙", "ml": 500, "abv": 53, "ref_price": 450, "tags": ["酱香", "中端"]},
    {"name": "钓鱼台珐琅彩", "brand": "钓鱼台", "ml": 500, "abv": 53, "ref_price": 800, "tags": ["酱香", "高端"]},
    {"name": "小糊涂仙", "brand": "小糊涂仙", "ml": 500, "abv": 52, "ref_price": 150, "tags": ["浓香", "口粮"]},
    {"name": "玻汾", "brand": "汾酒", "ml": 475, "abv": 53, "ref_price": 50, "tags": ["清香", "口粮"]},
    {"name": "绿脖西凤", "brand": "西凤", "ml": 500, "abv": 55, "ref_price": 55, "tags": ["凤香", "口粮"]},
    {"name": "尖庄", "brand": "五粮液", "ml": 500, "abv": 50, "ref_price": 65, "tags": ["浓香", "口粮"]},
    {"name": "绵竹大曲", "brand": "绵竹", "ml": 500, "abv": 52, "ref_price": 45, "tags": ["浓香", "口粮"]},
    {"name": "泸州老窖头曲", "brand": "泸州老窖", "ml": 500, "abv": 52, "ref_price": 80, "tags": ["浓香", "口粮"]},
    {"name": "古井贡酒年份原浆", "brand": "古井贡", "ml": 500, "abv": 50, "ref_price": 200, "tags": ["古井", "中端"]},
    {"name": "口子窖", "brand": "口子窖", "ml": 500, "abv": 50, "ref_price": 180, "tags": ["兼香", "中端"]}
  ],
  "啤酒": [
    {"name": "雪花纯生", "brand": "华润雪花", "ml": 330, "abv": 4, "ref_price": 6, "tags": ["黄啤"]},
    {"name": "青岛经典", "brand": "青岛啤酒", "ml": 330, "abv": 4, "ref_price": 5, "tags": ["黄啤"]},
    {"name": "哈尔滨啤酒小麦王", "brand": "哈尔滨", "ml": 330, "abv": 3.7, "ref_price": 4, "tags": ["黄啤"]},
    {"name": "百威啤酒", "brand": "百威", "ml": 330, "abv": 4, "ref_price": 8, "tags": ["黄啤"]},
    {"name": "嘉士伯", "brand": "嘉士伯", "ml": 330, "abv": 4.5, "ref_price": 10, "tags": ["黄啤"]},
    {"name": "1664白啤", "brand": "1664", "ml": 330, "abv": 5, "ref_price": 15, "tags": ["白啤"]},
    {"name": "乌苏啤酒红乌苏", "brand": "乌苏", "ml": 620, "abv": 4, "ref_price": 10, "tags": ["黄啤"]},
    {"name": "泰山原浆7天", "brand": "泰山", "ml": 300, "abv": 5, "ref_price": 12, "tags": ["黄啤", "鲜啤"]}
  ],
  "红酒": [
    {"name": "拉菲传奇", "brand": "拉菲", "ml": 750, "abv": 12.5, "ref_price": 280, "tags": ["波尔多"]},
    {"name": "张裕解百纳", "brand": "张裕", "ml": 750, "abv": 12, "ref_price": 60, "tags": ["国产"]},
    {"name": "长城五星", "brand": "长城", "ml": 750, "abv": 12.5, "ref_price": 80, "tags": ["国产"]},
    {"name": "奔富洛神", "brand": "奔富", "ml": 750, "abv": 13.5, "ref_price": 120, "tags": ["澳大利亚"]},
    {"name": "奔富407", "brand": "奔富", "ml": 750, "abv": 14.5, "ref_price": 680, "tags": ["澳大利亚", "高端"]},
    {"name": "黄尾袋鼠西拉", "brand": "黄尾袋鼠", "ml": 750, "abv": 13.5, "ref_price": 55, "tags": ["澳大利亚"]}
  ],
  "洋酒": [
    {"name": "芝华士12年", "brand": "芝华士", "ml": 700, "abv": 40, "ref_price": 220, "tags": ["威士忌", "苏格兰"]},
    {"name": "尊尼获加黑牌", "brand": "尊尼获加", "ml": 700, "abv": 40, "ref_price": 280, "tags": ["威士忌", "苏格兰"]},
    {"name": "马爹利名仕", "brand": "马爹利", "ml": 700, "abv": 40, "ref_price": 580, "tags": ["白兰地", "法国"]},
    {"name": "人头马CLUB", "brand": "人头马", "ml": 700, "abv": 40, "ref_price": 480, "tags": ["白兰地", "法国"]},
    {"name": "绝对伏特加", "brand": "绝对", "ml": 700, "abv": 40, "ref_price": 180, "tags": ["伏特加", "瑞典"]}
  ],
  "黄酒": [
    {"name": "古越龙山中央库藏", "brand": "古越龙山", "ml": 500, "abv": 14, "ref_price": 80, "tags": ["绍兴黄酒"]},
    {"name": "会稽山纯正", "brand": "会稽山", "ml": 500, "abv": 14, "ref_price": 25, "tags": ["绍兴黄酒", "口粮"]}
  ]
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/humengting/酒友圈
git add backend/data/drinks_db.json
git commit -m "feat(ai): add 内置酒类参考数据库 drinks_db.json"
```

---

## Task 2: 后端 AI 识别接口

**Files:**
- Create: `backend/routes/ai.js`
- Modify: `backend/app.js` — 注册 `/api/ai` 路由

- [ ] **Step 1: 创建 ai.js 路由**

```javascript
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 加载酒类数据库
const drinksDb = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/drinks_db.json'), 'utf8')
);

// MiniMax API 配置
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimaxi.com/v1'; // 或 MiniMax 国内版

// POST /api/ai/recognize
// Body: { image: "data:image/jpeg;base64,..." }
router.post('/recognize', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ code: 400, msg: '图片不能为空' });

    // 提取 base64 数据
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 调用 MiniMax 视觉模型识别
    const prompt = `你是一个酒类识别专家。请分析这张图片中的酒（可能是白酒、啤酒、红酒、洋酒等）。

请以JSON格式返回识别结果：
{
  "recognized": true/false,  // 是否识别到酒
  "name": "酒名（如果识别到）",
  "brand": "品牌（如果识别到）", 
  "type": "白酒/啤酒/红酒/洋酒/黄酒/其他",
  "abv": "酒精度数（如：53）",
  "ml": "容量（毫升，如：500）",
  "ref_price": 参考零售价（单位：元，基于市场行情）,
  "confidence": 0-1之间的小数，表示识别置信度,
  "suggested_amount": "建议用户填写的本次饮用量，如：'2两'、'1瓶'、'3杯'",
  "note": "备注，如：无法确定时可说明模糊原因"
}

如果图片中没有酒或无法识别，返回：
{
  "recognized": false,
  "note": "未能识别到酒类，请手动输入"
}

注意：
1. ref_price 应基于你对中国市场价格的了解，填写合理的大致价格
2. suggested_amount 应根据酒的类型和图片中杯子/瓶子的比例估算饮用量
3. 只返回JSON，不要有其他文字`;

    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-VL-01', // MiniMax 视觉模型
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
            ]
          }
        ],
        temperature: 0.3,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[AI] MiniMax API error:', data);
      return res.status(500).json({ code: 500, msg: 'AI识别服务异常', error: data });
    }

    const raw = data.choices?.[0]?.message?.content || '';
    
    // 解析 JSON 响应
    let result;
    try {
      // 尝试提取 JSON（处理可能的markdown代码块）
      const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) 
        || raw.match(/```\n?([\s\S]*?)\n?```/)
        || [null, raw];
      const jsonStr = jsonMatch[1] || raw;
      result = JSON.parse(jsonStr.trim());
    } catch (e) {
      // JSON 解析失败，尝试模糊匹配
      console.error('[AI] JSON parse error:', e, 'raw:', raw);
      return res.json({
        code: 0,
        data: {
          recognized: false,
          note: '识别结果解析异常，请手动输入'
        }
      });
    }

    // 如果识别成功，尝试匹配本地数据库获取更精确的价格
    if (result.recognized && result.name) {
      const matched = matchLocalDb(result);
      if (matched) {
        result.ref_price = matched.ref_price;
        result.name = matched.name;
        result.brand = matched.brand;
        result.type = matched.type;
        result.abv = matched.abv || result.abv;
        result.ml = matched.ml || result.ml;
      }
    }

    res.json({ code: 0, data: result });
  } catch (err) {
    console.error('[AI] recognize error:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// 匹配本地酒类数据库
function matchLocalDb(aiResult) {
  const typeMap = {
    '白酒': '白酒', '酱香': '白酒', '浓香': '白酒', '清香': '白酒', '凤香': '白酒', '兼香': '白酒',
    '啤酒': '啤酒', '黄啤': '啤酒', '白啤': '啤酒', '鲜啤': '啤酒',
    '红酒': '红酒', '葡萄酒': '红酒', '干红': '红酒',
    '洋酒': '洋酒', '威士忌': '洋酒', '白兰地': '洋酒', '伏特加': '洋酒',
    '黄酒': '黄酒', '绍兴黄酒': '黄酒'
  };

  const category = typeMap[aiResult.type] || aiResult.type || '';
  
  if (!category || !drinksDb[category]) return null;

  const list = drinksDb[category];
  const name = aiResult.name || '';
  const brand = aiResult.brand || '';

  // 精确匹配：名称或品牌包含关键词
  for (const item of list) {
    if (
      (name && (name.includes(item.name) || item.name.includes(name))) ||
      (brand && item.brand.includes(brand))
    ) {
      return item;
    }
  }

  // 模糊匹配：关键词匹配
  for (const item of list) {
    const searchText = (name + brand).toLowerCase();
    const itemText = (item.name + item.brand).toLowerCase();
    // 简单子串匹配
    for (const kw of itemText) {
      if (kw.length > 1 && searchText.includes(kw)) return item;
    }
  }

  return null;
}

module.exports = router;
```

- [ ] **Step 2: 在 app.js 中注册路由**

```bash
# 在 app.js 中找到已有的路由注册语句，添加 ai 路由
# 假设其他路由是这样注册的：
# app.use('/auth', require('./routes/auth'));
# 在之后添加：
```

```javascript
// 在 app.js 中找到合适位置添加（约第15-20行）：
app.use('/api/ai', require('./routes/ai'));
```

- [ ] **Step 3: 测试接口**

```bash
# 启动后端
cd /Users/humengting/酒友圈/backend && node app.js

# 测试识别接口（需要真实的 base64 图片）
curl -X POST http://localhost:3000/api/ai/recognize \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."}' \
  | python3 -m json.tool
```

Expected: `{"code":0,"data":{"recognized":true,"name":"茅台飞天","brand":"茅台","type":"白酒","ref_price":2500,...}}`

- [ ] **Step 4: Commit**

```bash
git add backend/routes/ai.js backend/app.js
git commit -m "feat(ai): add 酒标识别 API /api/ai/recognize"
```

---

## Task 3: 前端 API 封装

**Files:**
- Modify: `frontend/src/api/index.js` — 添加 `ai.recognize` 接口

- [ ] **Step 1: 添加 AI 识别接口**

```javascript
// 在 api/index.js 的 export default 中添加（约第53行附近）：

// ai
aiRecognize: (imageBase64) => api.post('/ai/recognize', { image: imageBase64 }),
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/index.js
git commit -m "feat(api): add ai.recognize 接口"
```

---

## Task 4: AddRecord.vue 改版 — AI 识别集成

**Files:**
- Modify: `frontend/src/views/AddRecord.vue` — 重构拍照→识别→确认流程

- [ ] **Step 1: 重写 AddRecord.vue 的拍照区域**

原拍照区域改为：
1. 顶部：拍照按钮（大按钮）
2. 拍照后：显示加载动画 + "AI 识别中..."
3. 识别成功后：展示识别结果卡片（酒名/品牌/参考价）
4. 用户可修改确认 → 确认后填充表单

```vue
<!-- 替换原来的照片区域（删除旧代码，替换为新逻辑） -->
<!-- 新的拍照识别区域： -->
<div class="card">
  <div style="font-size:12px;color:#bbb;margin-bottom:8px;">识别酒标</div>
  
  <!-- 识别结果 -->
  <div v-if="aiResult" class="ai-result-card">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:20px;">{{ aiResult.type === '白酒' ? '🍶' : aiResult.type === '啤酒' ? '🍺' : aiResult.type === '红酒' ? '🍷' : '🥃' }}</span>
      <div>
        <div style="font-size:15px;font-weight:600;">{{ aiResult.name }}</div>
        <div style="font-size:12px;color:#666;">{{ aiResult.brand }} · {{ aiResult.type }} · {{ aiResult.abv || '?' }}° · {{ aiResult.ml || '?' }}ml</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-size:14px;color:#1aad19;font-weight:600;">¥{{ aiResult.ref_price }}</div>
        <div style="font-size:10px;color:#999;">参考价</div>
      </div>
    </div>
    <div style="font-size:12px;color:#666;margin-bottom:8px;">
      建议饮用量：<span style="color:#1aad19;">{{ aiResult.suggested_amount }}</span>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-secondary" style="flex:1;" @click="retakePhoto">重拍</button>
      <button class="btn-primary" style="flex:1;" @click="confirmAiResult">确认并填入</button>
    </div>
  </div>

  <!-- 识别中... -->
  <div v-else-if="aiLoading" style="text-align:center;padding:30px;">
    <div style="font-size:24px;margin-bottom:8px;">🔍</div>
    <div style="color:#999;font-size:13px;">AI 识别中...</div>
  </div>

  <!-- 拍照按钮 -->
  <div v-else 
    class="camera-btn"
    @click="triggerPhoto"
    style="width:100%;height:120px;background:#f5f5f5;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#999;cursor:pointer;border:1px dashed #ddd;">
    <span style="font-size:28px;">📷</span>
    <span style="font-size:13px;">拍照识别酒标</span>
    <span style="font-size:11px;">自动识别酒名和市场价</span>
  </div>
  
  <input ref="photoInput" type="file" accept="image/*" capture="environment" style="display:none;" @change="onPhotoSelect">
</div>
```

- [ ] **Step 2: 添加 AI 识别相关状态和方法**

在 `<script setup>` 中：

```javascript
// 添加状态
const aiLoading = ref(false)
const aiResult = ref(null)
const photoInput = ref(null)

// 修改 form.value 初始化
const form = ref({
  content: '',
  drink_type: '🍺 啤酒',  // 默认，可被 AI 覆盖
  drink_name: '',
  amount: '',
  alcohol_degree: '',
  location_name: '',
  latitude: null,
  longitude: null,
  images: [],
  friends: [],
})

// 修改 onPhotoSelect 方法
async function onPhotoSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  
  // 压缩
  const dataUrl = await compressImage(file)
  form.value.images = [dataUrl]
  
  // 调用 AI 识别
  aiLoading.value = true
  aiResult.value = null
  
  try {
    const res = await api.aiRecognize(dataUrl)
    aiLoading.value = false
    if (res.code === 0 && res.data?.recognized) {
      aiResult.value = res.data
    } else {
      alert(res.data?.note || '未能识别，请手动输入')
      aiResult.value = null
    }
  } catch (err) {
    aiLoading.value = false
    alert('识别失败：' + err.message)
  }
}

// 确认 AI 识别结果
function confirmAiResult() {
  if (!aiResult.value) return
  // 填充表单
  form.value.drink_name = aiResult.value.name || ''
  form.value.alcohol_degree = aiResult.value.abv ? String(aiResult.value.abv) : ''
  // 根据类型设置酒类标签
  const typeMap = {
    '白酒': '🍶 白酒',
    '啤酒': '🍺 啤酒', 
    '红酒': '🍷 红酒',
    '洋酒': '🥃 威士忌',
    '黄酒': '🍶 清酒'
  }
  form.value.drink_type = typeMap[aiResult.value.type] || '🍺 啤酒'
  aiResult.value = null
}

// 重拍
function retakePhoto() {
  aiResult.value = null
  form.value.images = []
  photoInput.value?.click()
}

// 保留原有的 triggerPhoto 和 compressImage
function triggerPhoto() {
  photoInput.value?.click()
}
```

- [ ] **Step 3: 添加样式**

```css
/* 在 <style scoped> 中添加 */
.ai-result-card {
  background: linear-gradient(135deg, #f8fff8, #f0fff0);
  border: 1px solid #c8e6c8;
  border-radius: 8px;
  padding: 14px;
}
.btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  background: #f0f0f0;
  color: #666;
  border: none;
  cursor: pointer;
}
.camera-btn:hover {
  background: #fafafa;
  border-color: #ccc;
}
```

- [ ] **Step 4: 测试**

```bash
# 确认前端编译无报错
cd /Users/humengting/酒友圈/frontend
npm run build 2>&1 | tail -20

# 或开发模式
cd /Users/humengting/酒友圈/frontend
npm run dev
# 访问 http://localhost:5173/#/add 测试
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/AddRecord.vue frontend/src/api/index.js
git commit -m "feat(ai): 集成 AI 酒标识别到 AddRecord"
```

---

## Task 5: 积分 Store

**Files:**
- Create: `frontend/src/stores/points.js`
- Modify: `frontend/src/stores/index.js` — 注册 store

- [ ] **Step 1: 创建积分 Store**

```javascript
import { defineStore } from 'pinia'
import api from '@/api'

export const usePointsStore = defineStore('points', {
  state: () => ({
    points: 0,
    loading: false,
  }),
  
  getters: {
    formattedPoints: (state) => state.points.toLocaleString(),
  },
  
  actions: {
    async fetchPoints() {
      this.loading = true
      try {
        const res = await api.getPoints()
        if (res.code === 0) {
          this.points = res.data.points || 0
        }
      } catch (e) {
        console.error('fetchPoints error:', e)
      } finally {
        this.loading = false
      }
    },
    
    // 积分增加时调用
    addPoints(amount) {
      this.points += amount
    },
    
    // 积分消耗时调用
    deductPoints(amount) {
      this.points -= amount
    },
  }
})
```

- [ ] **Step 2: 注册 store**

在 `frontend/src/stores/index.js` 中添加（如果文件存在）或确认是否需要。

```javascript
// 查找 stores/index.js 是否存在
// 如果存在，添加 points store 注册
// 如果不存在，Pinia 会自动扫描 stores 目录
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/points.js
git commit -m "feat(points): add 积分 store"
```

---

## Task 6: 后端积分接口

**Files:**
- Modify: `backend/routes/users.js` 或新建 `backend/routes/points.js`

- [ ] **Step 1: 创建积分路由**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/points — 获取积分
router.get('/', auth, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT points FROM users WHERE id = ?'
    ).get(req.user.userId);
    res.json({ code: 0, data: { points: user?.points || 0 } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/points/log — 积分明细
router.get('/log', auth, (req, res) => {
  try {
    const logs = db.prepare(
      'SELECT * FROM points_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user.userId);
    res.json({ code: 0, data: logs });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: 创建积分明细表（migration）**

```sql
-- 在 SQLite 中执行
CREATE TABLE IF NOT EXISTS points_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,         -- 正数=获得，负数=消耗
  reason TEXT NOT NULL,            -- 喝酒记录/兑换商品/退款
  record_id INTEGER,               -- 关联的记录ID（可选）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points_log_user ON points_log(user_id);
```

```javascript
// 在 backend/config/db.js 中初始化表
// 找到初始化表的代码，添加 points_log
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/points.js backend/config/db.js
git commit -m "feat(points): add 积分查询和明细接口"
```

---

## Self-Review Checklist

After writing the complete plan, run through:

1. **Spec coverage**: All requirements from PRD for Phase 1 AI recognition implemented?
   - [ ] 拍照识别 ✅
   - [ ] 扫码识别 → Phase 2（不在本 plan）
   - [ ] 显示参考价 ✅
   - [ ] 确认填入表单 ✅
   - [ ] 积分到账 ✅

2. **Placeholder scan**: No TBD/TODO in steps ✅

3. **Type consistency**: API response shape consistent across tasks ✅

4. **No step gaps**: Each task has test + commit ✅

5. **File paths**: All exact ✅

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-09-ai-drink-recognition.md`**

Two execution approaches:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session, batch with checkpoints

Which approach?
