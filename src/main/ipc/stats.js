import { getDb } from '../db/index.js'

// 按日期区间汇总：返回 { expense, income, count }
function summaryByRange(start, end) {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
       FROM transactions WHERE date BETWEEN ? AND ? GROUP BY type`
    )
    .all(start, end)
  const result = { expense: 0, income: 0, count: 0 }
  for (const row of rows) {
    result[row.type] = row.total
    result.count += row.cnt
  }
  return result
}

// 今日汇总（首页）
export function todaySummary() {
  const date = new Date()
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
  return { ...summaryByRange(today, today), date: today }
}

// 某月汇总（首页/账本页）
export function monthSummary(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-31`
  return summaryByRange(start, end)
}

// 某月分类占比（按小类聚合，带大类名；统计页环形图用）
export function categoryBreakdown(type, year, month) {
  const db = getDb()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-31`
  return db
    .prepare(
      `SELECT c.name AS main_name, sc.name AS sub_name, SUM(t.amount) AS total
       FROM transactions t
       JOIN sub_categories sc ON t.category_id = sc.id
       JOIN categories c ON sc.category_id = c.id
       WHERE t.type = ? AND t.date BETWEEN ? AND ?
       GROUP BY sc.id
       ORDER BY total DESC`
    )
    .all(type, start, end)
}

// 近 N 个月收支趋势（按自然月聚合，缺月补 0；统计页折线图用）
export function monthlyTrend(type, months = 12) {
  const db = getDb()
  const now = new Date()
  const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`

  const rows = db
    .prepare(
      `SELECT substr(date, 1, 7) AS month, SUM(amount) AS total
       FROM transactions
       WHERE type = ? AND date BETWEEN ? AND ?
       GROUP BY substr(date, 1, 7)
       ORDER BY month`
    )
    .all(type, startStr, endStr)

  // 补齐没有记录的月份（金额为 0），保证折线图横轴连续
  const result = []
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const found = rows.find((r) => r.month === key)
    result.push({ month: key, total: found ? found.total : 0 })
  }
  return result
}
