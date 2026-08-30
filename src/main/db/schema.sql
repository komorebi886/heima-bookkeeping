-- ============================================
-- 黑马记账 数据库结构（v1）
-- 金额一律以「分」为单位整数存储，展示时 ÷100
-- ============================================

-- 大类表（一级分类，如"餐饮"）
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT    NOT NULL CHECK (type IN ('expense', 'income')),  -- expense=支出, income=收入
  name        TEXT    NOT NULL,
  icon        TEXT    DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_default  INTEGER NOT NULL DEFAULT 1,   -- 1=系统预设（不可删），0=用户自建（预留）
  created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 小类表（二级分类，如"早餐"）
CREATE TABLE IF NOT EXISTS sub_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_default  INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 流水表（每一笔记账记录）
CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT    NOT NULL CHECK (type IN ('expense', 'income')),
  amount      INTEGER NOT NULL,               -- 金额，单位：分
  category_id INTEGER,                        -- 指向 sub_categories.id
  date        TEXT    NOT NULL,               -- 记账日期，YYYY-MM-DD
  note        TEXT    DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (category_id) REFERENCES sub_categories(id) ON DELETE SET NULL
);

-- 常用查询索引（保证按月查询毫秒级）
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category_id);

-- 表结构版本管理（数据库升级用，禁止裸改表结构）
CREATE TABLE IF NOT EXISTS schema_version (
  version    INTEGER NOT NULL,
  applied_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
