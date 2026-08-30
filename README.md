# 黑马记账 📒

一款简单好用的**个人记账桌面应用**，支持 Windows 和 macOS。

- 💰 人民币记账，中文界面
- 🔒 **数据完全保存在本机**，无需联网、无账号、无云端上传
- 🎯 专注记账本身：支出、收入、统计、导出、备份，没有多余的功能

## ✨ 功能特性

| 功能 | 说明 |
| --- | --- |
| 记一笔 | 支出 / 收入双记账，金额键盘 + 分类选择，30 秒记完一笔 |
| 账本 | 按日期浏览全部流水，一目了然 |
| 统计 | 今日 / 本月收支汇总、分类占比图、12 个月趋势图 |
| 导出 | 一键导出 Excel（.xlsx）或 CSV，可用 Excel / WPS 打开 |
| 备份 | 一键创建 .hbak 备份文件，换电脑也能恢复全部数据 |
| 分类体系 | 支出 9 大类 58 小类、收入 4 大类 16 小类，覆盖日常生活 |

## 🖥️ 界面预览

（暂未提供截图）

## 🛠️ 技术栈

- **桌面框架**：[Electron](https://www.electronjs.org/) 44
- **前端框架**：[Vue 3](https://vuejs.org/)（组合式 API）+ [Pinia](https://pinia.vuejs.org/) + [Vue Router](https://router.vuejs.org/)
- **UI 组件库**：[Element Plus](https://element-plus.org/)
- **图表**：[Apache ECharts](https://echarts.apache.org/)
- **数据库**：[SQLite](https://www.sqlite.org/)（[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)）
- **构建 / 打包**：[electron-vite](https://electron-vite.org/) + [electron-builder](https://www.electron.build/)

## 🚀 快速开始

### 直接使用（Windows 用户）

从 [Releases](../../releases) 下载安装包 `黑马记账-安装包-0.1.0.exe`，双击安装即可。

> ⚠️ 由于未购买代码签名证书，Windows 首次运行会提示"Windows 已保护你的电脑"，请点击 **"更多信息" → "仍要运行"** 即可正常打开。macOS 用户请 **右键 → 打开**。

### 从源码运行（开发者）

环境要求：Node.js 18+ 与 npm。

```bash
npm install        # 安装依赖
npm run dev        # 启动开发模式
```

### 打包

```bash
npm run build:win  # 生成 Windows 安装包（须在 Windows 上执行）
npm run build:mac  # 生成 macOS 安装包（须在 macOS 上执行）
```

产物输出到 `dist/` 目录。

## 📁 项目结构

```
├── docs/产品文档.md        # 产品设计文档（功能 / 分类 / 页面 / 技术方案）
├── resources/             # 应用图标
├── src/
│   ├── main/              # 主进程：窗口、SQLite 数据库、导入导出、备份恢复
│   ├── preload/           # 白名单 API 桥接（window.api）
│   └── renderer/          # Vue 3 界面（首页 / 记一笔 / 账本 / 统计 / 设置）
├── electron-builder.yml   # 打包配置
└── electron.vite.config.mjs  # electron-vite 构建配置
```

## 🔒 数据与隐私

- 所有数据保存在本机 SQLite 数据库：`%APPDATA%\heima-bookkeeping\heimabook.db`（Windows）
- 不联网、不上传、无账号系统，删除应用前记得先"创建备份"
- 换电脑迁移：旧电脑"设置 → 创建备份"得到 `.hbak` 文件 → 新电脑安装后"设置 → 从备份恢复"

## ⚖️ 说明

- 金额以「分」为单位整数存储，避免浮点数误差
- 本项目为个人学习与日常使用而开发，欢迎 [Issues](../../issues) 反馈问题或建议
