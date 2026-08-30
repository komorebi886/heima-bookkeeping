import { getDb, getDbPath } from '../db/index.js'

// 返回全部大类及其小类（界面分类选择器用）
export function listAllCategories() {
  const db = getDb()
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all()
  const subs = db.prepare('SELECT * FROM sub_categories ORDER BY sort_order, id').all()

  const subMap = {}
  for (const s of subs) {
    if (!subMap[s.category_id]) subMap[s.category_id] = []
    subMap[s.category_id].push({ id: s.id, name: s.name })
  }

  return cats.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    children: subMap[c.id] || []
  }))
}

// 数据库基础信息（启动自检 / 首页验证用）
export function getDbInfo() {
  const db = getDb()
  const expense = db.prepare("SELECT COUNT(*) AS c FROM categories WHERE type = 'expense'").get().c
  const income = db.prepare("SELECT COUNT(*) AS c FROM categories WHERE type = 'income'").get().c
  const subs = db.prepare('SELECT COUNT(*) AS c FROM sub_categories').get().c
  const tx = db.prepare('SELECT COUNT(*) AS c FROM transactions').get().c
  return {
    expenseCategories: expense,
    incomeCategories: income,
    subCategories: subs,
    transactions: tx,
    dbPath: getDbPath()
  }
}
