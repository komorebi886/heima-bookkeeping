import { ipcMain, BrowserWindow } from 'electron'
import { listAllCategories, getDbInfo } from './categories.js'
import { exportCsv, exportExcel, backupDatabase, restoreDatabase } from './data.js'
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  listMonthTransactions,
  listRecentTransactions
} from './transactions.js'
import { todaySummary, monthSummary, categoryBreakdown, monthlyTrend } from './stats.js'

// 注册所有界面可调用的接口（IPC）。
// 界面（渲染进程）只能通过这些白名单接口访问数据，拿不到任意文件权限。
export function registerIpcHandlers() {
  // ---- 分类 ----
  // 查询全部大类+小类
  ipcMain.handle('categories:listAll', () => listAllCategories())

  // ---- 流水（记账记录）----
  ipcMain.handle('transactions:add', (_e, input) => addTransaction(input))
  ipcMain.handle('transactions:update', (_e, id, input) => updateTransaction(id, input))
  ipcMain.handle('transactions:delete', (_e, id) => deleteTransaction(id))
  ipcMain.handle('transactions:listMonth', (_e, year, month) => listMonthTransactions(year, month))
  ipcMain.handle('transactions:listRecent', (_e, limit) => listRecentTransactions(limit))

  // ---- 统计汇总 ----
  ipcMain.handle('stats:today', () => todaySummary())
  ipcMain.handle('stats:month', (_e, year, month) => monthSummary(year, month))
  ipcMain.handle('stats:breakdown', (_e, type, year, month) => categoryBreakdown(type, year, month))
  ipcMain.handle('stats:trend', (_e, type, months) => monthlyTrend(type, months))

  // ---- 数据导出 / 备份 / 恢复 ----
  const winOf = (e) => BrowserWindow.fromWebContents(e.sender)
  ipcMain.handle('data:exportCsv', (e) => exportCsv(winOf(e)))
  ipcMain.handle('data:exportExcel', (e) => exportExcel(winOf(e)))
  ipcMain.handle('data:backup', (e) => backupDatabase(winOf(e)))
  ipcMain.handle('data:restore', (e) => restoreDatabase(winOf(e)))

  // ---- 数据库状态（启动自检）----
  ipcMain.handle('db:info', () => getDbInfo())
}
