<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AmountKeyboard from '../components/AmountKeyboard.vue'
import CategoryPicker from '../components/CategoryPicker.vue'
import { api } from '../api'
import { localDateStr } from '../utils/format'

const type = ref('expense') // expense 支出 / income 收入
const amountStr = ref('0')
const categoryId = ref(null)
const date = ref(localDateStr())
const note = ref('')
const saving = ref(false)

// 金额展示：大字号实时显示
const amountDisplay = computed(() => {
  const cur = amountStr.value
  if (cur === '' || cur === '0') return '0'
  return cur.endsWith('.') ? cur : cur
})

// 最近使用的分类（每个类型分开记，最多 4 个，存在本机浏览器存储里）
function getRecentIds() {
  try {
    return JSON.parse(localStorage.getItem(`recent_cats_${type.value}`) || '[]')
  } catch {
    return []
  }
}

function addRecent(id) {
  const list = getRecentIds().filter((x) => x !== id)
  list.unshift(id)
  localStorage.setItem(`recent_cats_${type.value}`, JSON.stringify(list.slice(0, 4)))
}

// 金额（分）校验：必须大于 0
const amountCents = computed(() => {
  const v = parseFloat(amountStr.value)
  if (!isFinite(v) || v <= 0) return 0
  return Math.round(v * 100)
})

async function save() {
  if (amountCents.value <= 0) {
    ElMessage.warning('请输入金额')
    return
  }
  if (!categoryId.value) {
    ElMessage.warning('请选择分类')
    return
  }
  saving.value = true
  try {
    await api.transactions.add({
      type: type.value,
      amount: amountCents.value,
      categoryId: categoryId.value,
      date: date.value,
      note: note.value.trim()
    })
    addRecent(categoryId.value)
    ElMessage.success('已记一笔 ✅')
    // 保存成功：清空金额，方便连续记账
    amountStr.value = '0'
    note.value = ''
  } catch (err) {
    ElMessage.error(err?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 快捷键：Ctrl+Enter 保存（进阶体验，不强制）
function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
</script>

<template>
  <div class="record" @keydown="onKeydown">
    <!-- 支出/收入 切换 -->
    <div class="type-switch">
      <button :class="{ active: type === 'expense' }" @click="type = 'expense'">支出</button>
      <button :class="{ active: type === 'income' }" @click="type = 'income'">收入</button>
    </div>

    <!-- 金额大字号显示 -->
    <div class="amount-area">
      <span class="currency">¥</span>
      <span class="amount">{{ amountDisplay }}</span>
    </div>

    <!-- 分类选择（两级联动） -->
    <CategoryPicker :key="type" :type="type" v-model="categoryId" :recent-ids="getRecentIds()" />

    <!-- 日期与备注 -->
    <div class="meta-row">
      <el-date-picker
        v-model="date"
        type="date"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :clearable="false"
        size="large"
        style="width: 150px"
      />
      <el-input
        v-model="note"
        placeholder="备注（选填，如：地铁到公司）"
        maxlength="50"
        size="large"
        clearable
      />
    </div>

    <!-- 保存按钮 -->
    <el-button
      type="primary"
      size="large"
      class="save-btn"
      :loading="saving"
      @click="save"
    >
      保存（Ctrl+Enter）
    </el-button>

    <!-- 数字键盘 -->
    <AmountKeyboard v-model="amountStr" />
  </div>
</template>

<style scoped>
.record {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.type-switch {
  display: flex;
  background: #e9edf2;
  border-radius: 10px;
  padding: 4px;
}

.type-switch button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 15px;
  color: #606266;
  cursor: pointer;
}

.type-switch button.active {
  background: #ffffff;
  color: #303133;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.amount-area {
  text-align: center;
  padding: 10px 0;
}

.currency {
  font-size: 24px;
  color: #909399;
  margin-right: 4px;
}

.amount {
  font-size: 46px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 1px;
}

.meta-row {
  display: flex;
  gap: 10px;
}

.meta-row .el-input {
  flex: 1;
}

.save-btn {
  width: 100%;
  font-size: 16px;
}
</style>
