import { contextBridge, ipcRenderer } from 'electron'

// 通过 contextBridge 把白名单 API 暴露给界面（window.api.xxx）。
// 界面永远拿不到 Node 和文件系统权限，只能调用这里列出的功能。
contextBridge.exposeInMainWorld('api', {
  db: {
    info: () => ipcRenderer.invoke('db:info')
  },
  categories: {
    listAll: () => ipcRenderer.invoke('categories:listAll')
  },
  transactions: {
    add: (input) => ipcRenderer.invoke('transactions:add', input),
    update: (id, input) => ipcRenderer.invoke('transactions:update', id, input),
    delete: (id) => ipcRenderer.invoke('transactions:delete', id),
    listMonth: (year, month) => ipcRenderer.invoke('transactions:listMonth', year, month),
    listRecent: (limit) => ipcRenderer.invoke('transactions:listRecent', limit)
  },
  stats: {
    today: () => ipcRenderer.invoke('stats:today'),
    month: (year, month) => ipcRenderer.invoke('stats:month', year, month),
    breakdown: (type, year, month) => ipcRenderer.invoke('stats:breakdown', type, year, month),
    trend: (type, months) => ipcRenderer.invoke('stats:trend', type, months)
  },
  data: {
    exportCsv: () => ipcRenderer.invoke('data:exportCsv'),
    exportExcel: () => ipcRenderer.invoke('data:exportExcel'),
    backup: () => ipcRenderer.invoke('data:backup'),
    restore: () => ipcRenderer.invoke('data:restore')
  }
})
