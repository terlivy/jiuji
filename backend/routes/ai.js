const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 加载酒类数据库
const drinksDb = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/drinks_db.json'), 'utf8')
);

// MiniMax API 配置（用于图片识别）


const VISION_MODEL = 'MiniMax-VL-01';

// MiniMax API 配置
const MINIMAX_API_KEY = process.env.MINIMAX_CN_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimaxi.com/v1';

// POST /api/ai/recognize
// Body: { image: "data:image/jpeg;base64,..." }
router.post('/recognize', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ code: 400, msg: '图片不能为空' });

    // 提取 base64 数据
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // 调用 OpenRouter 视觉模型识别
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
        model: VISION_MODEL,
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
      console.error('[AI] OpenRouter API error:', data);
      return res.status(500).json({ code: 500, msg: 'AI识别服务异常', error: data });
    }

    const raw = data.choices?.[0]?.message?.content || '';

    // 解析 JSON 响应
    let result;
    try {
      const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/)
        || raw.match(/```\n?([\s\S]*?)\n?```/)
        || [null, raw];
      const jsonStr = jsonMatch[1] || raw;
      result = JSON.parse(jsonStr.trim());
    } catch (e) {
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
    for (const kw of itemText) {
      if (kw.length > 1 && searchText.includes(kw)) return item;
    }
  }

  return null;
}

module.exports = router;
