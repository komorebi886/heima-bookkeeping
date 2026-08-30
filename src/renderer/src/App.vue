<script setup>
// 底部导航：首页 / 记一笔 / 账本 / 统计 / 设置
import { House, EditPen, Notebook, TrendCharts, Setting } from '@element-plus/icons-vue'

const navItems = [
  { path: '/', label: '首页', icon: House },
  { path: '/record', label: '记一笔', icon: EditPen },
  { path: '/ledger', label: '账本', icon: Notebook },
  { path: '/stats', label: '统计', icon: TrendCharts },
  { path: '/settings', label: '设置', icon: Setting }
]
</script>

<template>
  <div class="app-shell">
    <main class="page-content">
      <router-view />
    </main>

    <nav class="bottom-nav">
      <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item">
        <el-icon :size="22"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, -apple-system, sans-serif;
  background: #f5f7fa;
  color: #303133;
  -webkit-user-select: none;
  user-select: none;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 底部导航栏 */
.bottom-nav {
  display: flex;
  border-top: 1px solid #e4e7ed;
  background: #ffffff;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: #909399;
  font-size: 11px;
  transition: color 0.15s;
}

.nav-item:hover {
  color: #409eff;
}

.nav-item.router-link-active {
  color: #409eff;
  font-weight: 600;
}
</style>
