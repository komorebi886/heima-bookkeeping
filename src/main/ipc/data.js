import { dialog } from 'electron'
import fs from 'node:fs'
import * as XLSX from 'xlsx'
import { getDb, getDbPath, closeDatabase, initDatabase } from '../db/index.js'

// 本地日期字符串，用于生成默认文件名（如 2026-08-29）
function dateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 全部流水（带分类名），金额换算成「元」
function allRows() {
  const db = getDb()
  return db
    .prepare(
      `SELECT t.date, t.type, c.name AS main_name, sc.name AS sub_name, t.amount, t.note
       FROM transactions t
       LEFT JOIN sub_categories sc ON t.category_id = sc.id
       LEFT JOIN categories c ON sc.category_id = c.id
       ORDER BY t.date DESC, t.id DESC`
    )
    .all()
    .map((r) => ({
      日期: r.date,
      类型: r.type === 'expense' ? '支出' : '收入',
      一级分类: r.main_name || '',
      二级分类: r.sub_name || '未分类',
      金额: r.amount / 100,
      备注: r.note || ''
    }))
}

// CSV 单元格转义：含逗号/引号/换行时加引号包裹
function csvCell(v) {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// 导出 CSV（带 BOM，Excel 打开中文不乱码）
export async function exportCsv(win) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: '导出 CSV',
    defaultPath: `黑马记账流水-${dateStr()}.csv`,
    filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
  })
  if (canceled || !filePath) return { canceled: true }

  const rows = allRows()
  const header = ['日期', '类型', '一级分类', '二级分类', '金额(元)', '备注']
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [r.日期, r.类型, r.一级分类, r.二级分类, r.金额.toFixed(2), csvCell(r.备注)].join(',')
    )
  }
  // ﻿ BOM：让 Excel 正确识别 UTF-8 编码的中文
  fs.writeFileSync(filePath, '﻿' + lines.join('\r\n'), 'utf8')
  return { canceled: false, count: rows.length }
}

// 导出 Excel（.xlsx）
export async function exportExcel(win) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: '导出 Excel',
    defaultPath: `黑马记账流水-${dateStr()}.xlsx`,
    filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
  })
  if (canceled || !filePath) return { canceled: true }

  const rows = allRows()
  rows.forEach((r) => {
    r.金额 = Math.round(r.金额 * 100) / 100 // 保留两位小数
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 24 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '流水')
  XLSX.writeFile(wb, filePath)
  return { canceled: false, count: rows.length }
}

// 创建备份（.hbak）——用 better-sqlite3 的在线备份接口，保证备份文件完整一致
export async function backupDatabase(win) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: '创建备份',
    defaultPath: `黑马记账备份-${dateStr()}.hbak`,
    filters: [{ name: '黑马记账备份', extensions: ['hbak'] }]
  })
  if (canceled || !filePath) return { canceled: true }

  await getDb().backup(filePath)
  return { canceled: false }
}

// 从备份恢复：关闭数据库 → 用备份文件覆盖 → 重新打开
export async function restoreDatabase(win) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: '选择备份文件',
    filters: [{ name: '黑马记账备份', extensions: ['hbak'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths[0]) return { canceled: true }

  const file = filePaths[0]
  // 校验文件确实是 SQLite 数据库，防止误选其他文件
  const header = fs.readFileSync(file).subarray(0, 16).toString('latin1')
  if (!header.startsWith('SQLite format 3')) {
    throw new Error('所选文件不是有效的黑马记账备份')
  }

  // 先记住数据库文件路径（closeDatabase 会清空路径记录）
  const target = getDbPath()
  closeDatabase()
  try {
    fs.copyFileSync(file, target)
    // 清理可能残留的 WAL 临时文件，避免新旧数据混淆
    for (const suffix of ['-wal', '-shm']) {
      try {
        fs.unlinkSync(target + suffix)
      } catch {
        /* 不存在则跳过 */
      }
    }
    initDatabase()
  } catch (err) {
    // 恢复失败时尽量恢复可用状态
    try {
      initDatabase()
    } catch {
      /* 忽略 */
    }
    throw err
  }
  return { canceled: false }
}
