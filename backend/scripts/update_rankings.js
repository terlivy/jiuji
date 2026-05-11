const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'jiuyouquan.db');
const db = new Database(DB_PATH);

function getDateRange(period) {
  let startDate, endDate;
  const now = new Date();
  
  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = now;
  } else if (period === 'week') {
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToMonday);
    endDate = now;
  } else {
    return null;
  }
  
  const fmt = d => d.toISOString().split('T')[0];
  return { start: fmt(startDate), end: fmt(endDate) };
}

function updateRankingsForPeriod(period) {
  console.log('\n=== 更新 ' + (period === 'month' ? '月榜' : '周榜') + ' ===');
  
  const range = getDateRange(period);
  if (!range) {
    console.log('无效的 period 参数');
    return;
  }
  
  console.log('统计区间: ' + range.start + ' ~ ' + range.end);
  
  const sql = `
    SELECT 
      dr.user_id,
      u.province,
      u.city,
      COUNT(*) as drink_count,
      COUNT(*) * 10 as points
    FROM drink_records dr
    JOIN users u ON dr.user_id = u.id
    WHERE date(dr.created_at) BETWEEN ? AND ?
    GROUP BY dr.user_id, u.province, u.city
    ORDER BY drink_count DESC
  `;
  
  const stats = db.prepare(sql).all(range.start, range.end);
  console.log('统计到 ' + stats.length + ' 条记录');
  
  if (stats.length === 0) {
    console.log('没有数据，跳过更新');
    return;
  }
  
  const transaction = db.transaction(() => {
    const deleteStmt = db.prepare('DELETE FROM rankings WHERE period = ?');
    const deleteResult = deleteStmt.run(period);
    console.log('删除旧 ' + period + ' 数据: ' + deleteResult.changes + ' 条');
    
    const insertStmt = db.prepare(`
      INSERT INTO rankings (user_id, province, city, period, drink_count, points, rank, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stats.forEach((stat, index) => {
      insertStmt.run(
        stat.user_id,
        stat.province,
        stat.city,
        period,
        stat.drink_count,
        stat.points,
        index + 1
      );
    });
  });
  
  transaction();
  console.log('写入新 ' + period + ' 数据: ' + stats.length + ' 条');
}

function main() {
  console.log('========== 开始更新排行榜 ==========');
  console.log('执行时间: ' + new Date().toISOString());
  
  try {
    updateRankingsForPeriod('month');
    updateRankingsForPeriod('week');
    console.log('\n========== 更新完成 ==========');
  } catch (err) {
    console.error('更新失败:', err.message);
    process.exit(1);
  }
}

main();
