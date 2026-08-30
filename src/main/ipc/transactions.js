import { getDb } from '../db/index.js'

// 流水查询 SQL：带出所属小类名和大类名（LEFT JOIN 保证无分类时也能显示）
const SELECT_BASE = `
  SELECT t.*, sc.name AS sub_name, c.name AS main_name
  FROM transactions t
  LEFT JOIN sub_categories sc ON t.category_id = sc.id
  LEFT JOIN categories c ON sc.category_id = c.id
`

// 输入校验：金额必须为正整数（单位分），分类必须属于对应收支类型
function validateInput({ type, amount, categoryId, date, note }) {
  if (type !== 'expense' && type !== 'income') throw new Error('收支类型不合法')
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('金额必须大于 0')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('日期格式不正确')
  if (!categoryId) throw new Error('请选择分类')

  // 校验分类存在且大类类型与流水类型一致
  const row = getDb()
    .prepare(
      `SELECT c.type FROM sub_categories sc JOIN categories c ON sc.category_id = c.id WHERE sc.id = ?`
    )
    .get(categoryId)
  if (!row || row.type !== type) throw new Error('所选分类与收支类型不符')
}

// 新增一笔流水
export function addTransaction(input) {
  validateInput(input)
  const db = getDb()
  const info = db
    .prepare('INSERT INTO transactions (type, amount, category_id, date, note) VALUES (?, ?, ?, ?, ?)')
    .run(input.type, input.amount, input.categoryId, input.date, input.note || '')
  return info.lastInsertRowid
}

// 修改一笔流水
export function updateTransaction(id, input) {
  validateInput(input)
  const db = getDb()
  const info = db
    .prepare(
      `UPDATE transactions
       SET type = ?, amount = ?, category_id = ?, date = ?, note = ?, updated_at = datetime('now', 'localtime')
       WHERE id = ?`
    )
    .run(input.type, input.amount, input.categoryId, input.date, input.note || '', id)
  if (info.changes === 0) throw new Error('流水不存在或已被删除')
}

// 删除一笔流水
export function deleteTransaction(id) {
  const db = getDb()
  const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  if (info.changes === 0) throw new Error('流水不存在或已被删除')
}

// 按月份查询流水（含分类名），按日期倒序、同日内按时间倒序
export function listMonthTransactions(year, month) {
  const db = getDb()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-31`
  return db
    .prepare(`${SELECT_BASE} WHERE t.date BETWEEN ? AND ? ORDER BY t.date DESC, t.id DESC`)
    .all(start, end)
}

// 最近 N 笔流水（首页用）
export function listRecentTransactions(limit = 5) {
  const db = getDb()
  return db.prepare(`${SELECT_BASE} ORDER BY t.id DESC LIMIT ?`).all(limit)
}
