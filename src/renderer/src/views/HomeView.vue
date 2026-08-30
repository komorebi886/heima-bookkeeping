<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { formatMoney, formatDay } from '../utils/format'

const router = useRouter()

const todaySum = ref({ expense: 0, income: 0 })
const monthSum = ref({ expense: 0, income: 0 })
const recent = ref([])
const loading = ref(false)

const todayBalance = computed(() => todaySum.value.income - todaySum.value.expense)
const monthBalance = computed(() => monthSum.value.income - monthSum.value.expense)

async function load() {
  loading.value = true
  try {
    const [today, month, list] = await Promise.all([
      api.stats.today(),
      api.stats.month(new Date().getFullYear(), new Date().getMonth() + 1),
      api.transactions.listRecent(5)
    ])
    todaySum.value = today
    monthSum.value = month
    recent.value = list
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="home" v-loading="loading">
    <h2 class="greeting">今天，{{ new Date().getDate() }}日</h2>

    <!-- 今日卡片 -->
    <div class="card today-card">
      <div class="card-title">今日</div>
      <div class="today-main">
        支出
        <span class="big expense">{{ formatMoney(todaySum.expense) }}</span>
      </div>
      <div class="today-sub">
        <span>收入 {{ formatMoney(todaySum.income) }}</span>
        <span class="balance" :class="todayBalance < 0 ? 'neg' : 'pos'">
          结余 {{ formatMoney(todayBalance) }}
        </span>
      </div>
    </div>

    <!-- 本月卡片 -->
    <div class="card month-card">
      <div class="card-title">本月</div>
      <div class="month-row">
        <span>支出 <b class="expense">{{ formatMoney(monthSum.expense) }}</b></span>
        <span>收入 <b class="income">{{ formatMoney(monthSum.income) }}</b></span>
        <span class="balance" :class="monthBalance < 0 ? 'neg' : 'pos'">
          结余 {{ formatMoney(monthBalance) }}
        </span>
      </div>
    </div>

    <!-- 最近 5 笔 -->
    <div class="card recent-card">
      <div class="card-title">
        最近记录
        <span class="more" @click="router.push('/ledger')">查看全部 ›</span>
      </div>

      <div v-if="recent.length === 0" class="recent-empty">
        还没有记账，点击下方按钮记下第一笔吧！
      </div>

      <div v-for="item in recent" :key="item.id" class="recent-item">
        <div class="recent-icon">{{ item.main_name?.slice(0, 1) || '记' }}</div>
        <div class="recent-info">
          <span class="recent-name">{{ item.sub_name || '未分类' }}</span>
          <span class="recent-date">{{ formatDay(item.date) }}</span>
        </div>
        <span class="recent-amount" :class="item.type">
          {{ item.type === 'expense' ? '-' : '+' }}{{ formatMoney(item.amount) }}
        </span>
      </div>
    </div>

    <!-- 记一笔 大按钮 -->
    <el-button type="primary" size="large" class="add-btn" @click="router.push('/record')">
      ＋ 记一笔
    </el-button>
  </div>
</template>

<style scoped>
.home {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 20px;
}

.greeting {
  font-size: 22px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.more {
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
}

.today-main {
  font-size: 16px;
  color: #606266;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.big {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 1px;
}

.today-sub {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.month-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
}

.month-row b {
  font-weight: 600;
}

.expense {
  color: #303133;
}

.income {
  color: #67c23a;
}

.balance.pos {
  color: #67c23a;
}

.balance.neg {
  color: #f56c6c;
}

.recent-empty {
  color: #909399;
  font-size: 13px;
  padding: 10px 0;
  text-align: center;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f4f7;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.recent-name {
  font-size: 14px;
}

.recent-date {
  font-size: 11px;
  color: #c0c4cc;
}

.recent-amount {
  font-size: 15px;
  font-weight: 600;
}

.recent-amount.expense {
  color: #303133;
}

.recent-amount.income {
  color: #67c23a;
}

.add-btn {
  width: 100%;
  height: 48px;
  font-size: 17px;
  border-radius: 12px;
  margin-top: 4px;
}
</style>
