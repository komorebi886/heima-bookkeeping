import Database from 'better-sqlite3'
import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
// 通过 ?raw 把 schema.sql 作为文本直接打包进程序（避免运行时找不到 SQL 文件）
import schema from './schema.sql?raw'
import { seedCategories } from './seed.js'

let db = null
let dbPath = null

// 数据库文件放在系统给本应用分配的专属数据目录
// Windows: C:\Users\你的用户名\AppData\Roaming\heima-bookkeeping\heimabook.db
// macOS:   ~/Library/Application Support/heima-bookkeeping/heimabook.db
export function initDatabase() {
  const dbDir = app.getPath('userData')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  dbPath = path.join(dbDir, 'heimabook.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')   // WAL 模式：读写更稳，备份更安全
  db.pragma('foreign_keys = ON')

  // 1. 建表（schema.sql 里的语句都是"不存在才建"，重复执行安全）
  db.exec(schema)

  // 2. 版本迁移：记录当前结构版本，未来升级表结构时按版本逐级迁移
  migrate(db)

  // 3. 预设分类种子：分类表为空时写入全部内置分类
  const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c
  if (catCount === 0) {
    seedCategories(db)
  }

  return db
}

export function getDb() {
  if (!db) throw new Error('数据库尚未初始化')
  return db
}

export function getDbPath() {
  return dbPath
}

// 关闭数据库（恢复备份前调用；关闭时 SQLite 会自动把数据完整写入文件）
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    dbPath = null
  }
}

// 表结构版本迁移（当前 v1；以后升级结构时在此追加 migrateV2、V3...）
function migrate(db) {
  const row = db.prepare('SELECT MAX(version) AS v FROM schema_version').get()
  const current = row?.v ?? 0
  if (current < 1) {
    db.prepare('INSERT INTO schema_version (version) VALUES (1)').run()
  }
}
