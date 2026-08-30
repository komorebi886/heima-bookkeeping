// 界面统一入口：页面只调用这里的函数，不直接碰 window.api
// （window.api 由主进程通过 preload 白名单暴露）
export const api = {
  db: {
    info: () => window.api.db.info()
  },
  categories: {
    listAll: () => window.api.categories.listAll()
  },
  transactions: {
    add: (input) => window.api.transactions.add(input),
    update: (id, input) => window.api.transactions.update(id, input),
    delete: (id) => window.api.transactions.delete(id),
    listMonth: (year, month) => window.api.transactions.listMonth(year, month),
    listRecent: (limit = 5) => window.api.transactions.listRecent(limit)
  },
  stats: {
    today: () => window.api.stats.today(),
    month: (year, month) => window.api.stats.month(year, month),
    breakdown: (type, year, month) => window.api.stats.breakdown(type, year, month),
    trend: (type, months = 12) => window.api.stats.trend(type, months)
  },
  data: {
    exportCsv: () => window.api.data.exportCsv(),
    exportExcel: () => window.api.data.exportExcel(),
    backup: () => window.api.data.backup(),
    restore: () => window.api.data.restore()
  }
}
