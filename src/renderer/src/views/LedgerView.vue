<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CategoryPicker from '../components/CategoryPicker.vue'
import { api } from '../api'
import { useCategoriesStore } from '../stores/categories'
import { formatMoney, formatCents, formatDay } from '../utils/format'

const store = useCategoriesStore()

// 当前月份（YYYY-MM 字符串）
const today = new Date()
const month = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

const records = ref([]) // 当月流水
const summary = ref({ expense: 0, income: 0 })
const loading = ref(false)

// 按月翻页
function prevMonth() {
  const [y, m] = month.value.split('-').map(Number)
  month.value = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
function nextMonth() {
  const [y, m] = month.value.split('-').map(Number)
  month.value = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${y}年${Number(m)}月`
})

// 按日期分组：[{ date, expense, income, items: [] }]
const groups = computed(() => {
  const map = new Map()
  for (const r of records.value) {
    if (!map.has(r.date)) {
      map.set(r.date, { date: r.date, expense: 0, income: 0, items: [] })
    }
    const g = map.get(r.date)
    g.items.push(r)
    g[r.type] += r.amount
  }
  return Array.from(map.values())
})

async function load() {
  loading.value = true
  try {
    const [y, m] = month.value.split('-').map(Number)
    const [list, sum] = await Promise.all([
      api.transactions.listMonth(y, m),
      api.stats.month(y, m)
    ])
    records.value = list
    summary.value = { expense: sum.expense, income: sum.income }
  } catch (err) {
    ElMessage.error(err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// ---------- 编辑 / 删除 ----------
const editVisible = ref(false)
const editing = ref(null) // 正在编辑的流水（编辑前快照）
const editForm = ref({ type: 'expense', amount: 0, categoryId: null, date: '', note: '' })

function openEdit(item) {
  editing.value = item
  editForm.value = {
    type: item.type,
    amount: item.amount,
    categoryId: item.category_id,
    date: item.date,
    note: item.note || ''
  }
  editVisible.value = true
}

async function saveEdit() {
  if (!(editForm.value.amount > 0)) {
    ElMessage.warning('金额必须大于 0')
    return
  }
  try {
    await api.transactions.update(editing.value.id, {
      type: editForm.value.type,
      amount: editForm.value.amount,
      categoryId: editForm.value.categoryId,
      date: editForm.value.date,
      note: editForm.value.note.trim()
    })
    ElMessage.success('已保存')
    editVisible.value = false
    load()
  } catch (err) {
    ElMessage.error(err?.message || '保存失败')
  }
}

async function removeItem(item) {
  try {
    await ElMessageBox.confirm(`确定删除这笔${item.type === 'expense' ? '支出' : '收入'}吗？删除后无法恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户取消
  }
  try {
    await api.transactions.delete(item.id)
    ElMessage.success('已删除')
    load()
  } catch (err) {
    ElMessage.error(err?.message || '删除失败')
  }
}

// 编辑表单里金额以「分」存，输入框以「元」显示
const editAmountYuan = computed({
  get: () => editForm.value.amount / 100,
  set: (v) => {
    editForm.value.amount = Math.round((Number(v) || 0) * 100)
  }
})

onMounted(async () => {
  await store.ensureLoaded()
  load()
})
</script>

<template>
  <div class="ledger">
    <!-- 月份切换 + 汇总 -->
    <div class="month-bar">
      <button class="arrow" @click="prevMonth">◀</button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="arrow" @click="nextMonth">▶</button>
    </div>

    <div class="summary-bar">
      <div class="sum-item">
        <span class="sum-label">支出</span>
        <span class="sum-value expense">-{{ formatMoney(summary.expense) }}</span>
      </div>
      <div class="sum-item">
        <span class="sum-label">收入</span>
        <span class="sum-value income">+{{ formatMoney(summary.income) }}</span>
      </div>
    </div>

    <!-- 流水列表（按日分组） -->
    <div v-loading="loading" class="list">
      <div v-if="groups.length === 0" class="empty">
        <el-empty description="这个月还没有记录，去「记一笔」吧" />
      </div>

      <div v-for="g in groups" :key="g.date" class="day-group">
        <div class="day-header">
          <span class="day-date">{{ formatDay(g.date) }}</span>
          <span class="day-sum">
            <template v-if="g.expense">支出 {{ formatMoney(g.expense) }}</template>
            <template v-if="g.expense && g.income"> · </template>
            <template v-if="g.income">收入 {{ formatMoney(g.income) }}</template>
          </span>
        </div>

        <div v-for="item in g.items" :key="item.id" class="item" @click="openEdit(item)">
          <div class="item-icon">{{ item.main_name?.slice(0, 1) || '记' }}</div>
          <div class="item-info">
            <span class="item-name">{{ item.sub_name || '未分类' }}</span>
            <span v-if="item.note" class="item-note">{{ item.note }}</span>
          </div>
          <span class="item-amount" :class="item.type">
            {{ item.type === 'expense' ? '-' : '+' }}{{ formatMoney(item.amount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 编辑抽屉 -->
    <el-dialog v-model="editVisible" title="编辑这笔账" width="90%" style="max-width: 460px">
      <div class="edit-form">
        <div class="edit-row">
          <el-radio-group v-model="editForm.type" size="large">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </div>

        <div class="edit-row">
          <el-input-number
            v-model="editAmountYuan"
            :min="0.01"
            :max="9999999"
            :precision="2"
            :step="1"
            size="large"
            style="width: 100%"
            controls-position="right"
          />
        </div>

        <div class="edit-row">
          <CategoryPicker
            :key="editForm.type + (editing?.id || '')"
            :type="editForm.type"
            v-model="editForm.categoryId"
          />
        </div>

        <div class="edit-row">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            style="width: 100%"
          />
        </div>

        <div class="edit-row">
          <el-input v-model="editForm.note" placeholder="备注（选填）" maxlength="50" clearable />
        </div>
      </div>

      <template #footer>
        <el-button type="danger" plain @click="removeItem(editing)">删除</el-button>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ledger {
  max-width: 640px;
  margin: 0 auto;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
}

.arrow {
  border: none;
  background: #e9edf2;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  color: #606266;
}

.arrow:hover {
  background: #dce4ec;
}

.month-label {
  font-size: 18px;
  font-weight: 600;
  min-width: 110px;
  text-align: center;
}

.summary-bar {
  display: flex;
  justify-content: space-around;
  background: #ffffff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sum-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sum-label {
  font-size: 12px;
  color: #909399;
}

.sum-value {
  font-size: 20px;
  font-weight: 700;
}

.sum-value.expense {
  color: #303133;
}

.sum-value.income {
  color: #67c23a;
}

.day-group {
  margin-bottom: 14px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 4px;
  font-size: 13px;
  color: #909399;
}

.day-sum {
  font-size: 12px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.15s;
}

.item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
}

.item-note {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.item-amount.expense {
  color: #303133;
}

.item-amount.income {
  color: #67c23a;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
