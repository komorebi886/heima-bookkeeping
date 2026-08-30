import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { initDatabase } from './db/index.js'
import { registerIpcHandlers } from './ipc/index.js'

// 记账应用对画面要求不高，禁用 GPU 硬件加速可避免部分 Windows 环境下
// 显卡驱动问题导致的应用崩溃（虚拟机/远程桌面/老驱动尤为常见）
app.disableHardwareAcceleration()

// 单实例锁：防止用户重复打开第二个窗口，避免两个程序同时写同一个数据库
const gotLock = app.requestSingleInstanceLock()
console.log('[黑马记账] 单实例锁:', gotLock)
if (!gotLock) {
  console.log('[黑马记账] 已有实例在运行，退出本进程')
  app.quit()
} else {
  let mainWindow = null

  function createWindow() {
    mainWindow = new BrowserWindow({
      title: '黑马记账',
      width: 1080,
      height: 720,
      minWidth: 900,
      minHeight: 640,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        // 安全基线：界面进程不能直接接触 Node 和文件系统，只走 preload 白名单 API
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
    })

    // 开发模式加载开发服务器（改代码实时生效）；生产模式加载编译后的界面文件
    if (process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }

  app.whenReady().then(() => {
    console.log('[黑马记账] 应用就绪，开始初始化…')
    // 1. 初始化数据库（建表 + 写入预设分类）
    initDatabase()
    // 2. 注册界面可调用的接口（IPC）
    registerIpcHandlers()
    // 3. 创建主窗口
    createWindow()
    console.log('[黑马记账] 窗口创建完成')

    // macOS：点击 Dock 图标且没有窗口时，重新开一个窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // 所有窗口关闭时退出（macOS 习惯除外）
  app.on('window-all-closed', () => {
    console.log('[黑马记账] 所有窗口已关闭，退出应用')
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('quit', () => {
    console.log('[黑马记账] 应用正在退出')
  })

  // 用户再次启动程序时，把已开的窗口激活到前台
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
