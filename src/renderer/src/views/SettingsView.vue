<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

const busy = ref('') // 正在进行的操作标识（按钮 loading）
const dbInfo = ref(null)

async function run(action, fn, successMsg) {
  busy.value = action
  try {
    const res = await fn()
    if (res?.canceled) return // 用户在系统对话框里点了取消
    ElMessage.success(successMsg + (res?.count != null ? `（共 ${res.count} 笔）` : ''))
  } catch (err) {
    ElMessage.error(err?.message || '操作失败')
  } finally {
    busy.value = ''
  }
}

// 导出 CSV / Excel
function exportCsv() {
  run('csv', api.data.exportCsv, 'CSV 已导出')
}
function exportExcel() {
  run('excel', api.data.exportExcel, 'Excel 已导出')
}
// 创建备份
function backup() {
  run('backup', api.data.backup, '备份已创建')
}
// 从备份恢复（红色警示确认）
async function restore() {
  try {
    await ElMessageBox.confirm(
      '恢复将【覆盖】当前全部数据，且无法撤销！\n建议先创建一份备份再操作。确定继续吗？',
      '⚠️ 危险操作',
      {
        type: 'error',
        confirmButtonText: '覆盖并恢复',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return // 用户取消
  }
  await run('restore', api.data.restore, '恢复成功')
}

onMounted(async () => {
  try {
    dbInfo.value = await api.db.info()
  } catch {
    /* 忽略，首页自检页已展示异常 */
  }
})
</script>

<template>
  <div class="settings">
    <!-- 数据导出 -->
    <div class="card">
      <div class="card-title">导出账本</div>
      <p class="card-desc">把全部流水导出成文件，可用 Excel / WPS 打开查看或打印。</p>
      <div class="btn-row">
        <el-button type="primary" :loading="busy === 'excel'" @click="exportExcel">
          导出 Excel（.xlsx）
        </el-button>
        <el-button :loading="busy === 'csv'" @click="exportCsv">导出 CSV（.csv）</el-button>
      </div>
    </div>

    <!-- 数据备份 -->
    <div class="card">
      <div class="card-title">数据备份</div>
      <p class="card-desc">
        备份会把全部数据打包成一个 .hbak 文件。建议定期备份，防止误删或电脑故障导致数据丢失。
      </p>
      <div class="btn-row">
        <el-button type="success" :loading="busy === 'backup'" @click="backup">
          创建备份
        </el-button>
        <el-button type="danger" plain :loading="busy === 'restore'" @click="restore">
          从备份恢复…
        </el-button>
      </div>
    </div>

    <!-- 关于 -->
    <div class="card">
      <div class="card-title">关于</div>
      <div class="about-rows">
        <span><b>黑马记账</b> v0.1.0</span>
        <span class="about-note">你的数据完全保存在这台电脑上，不会上传任何服务器。</span>
        <span v-if="dbInfo?.dbPath" class="about-path">
          数据文件位置：<code>{{ dbInfo.dbPath }}</code>
        </span>
        <span class="about-note">已有流水 {{ dbInfo?.transactions ?? '-' }} 笔</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.7;
  margin-bottom: 12px;
}

.btn-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.about-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.7;
}

.about-note {
  color: #909399;
}

.about-path code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
}
</style>
