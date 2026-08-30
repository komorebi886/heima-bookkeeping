<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { api } from '../api'
import { formatMoney, formatCents } from '../utils/format'

// 折线图纵轴数据已是「元」（非分），此处直接格式化
function formatYuan(v) {
  return `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

echarts.use([PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const type = ref('expense') // expense 支出 / income 收入
const todaySum = ref({ expense: 0, income: 0 })
const monthSum = ref({ expense: 0, income: 0 })

const ringRef = ref(null)
const lineRef = ref(null)
let ringChart = null
let lineChart = null

const monthLabel = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

const monthBalance = computed(() => monthSum.value.income - monthSum.value.expense)

// ---------- 数据加载 ----------
async function loadSummary() {
  const now = new Date()
  const [today, month] = await Promise.all([
    api.stats.today(),
    api.stats.month(now.getFullYear(), now.getMonth() + 1)
  ])
  todaySum.value = today
  monthSum.value = month
}

// 环形图：本月分类占比
async function renderRing() {
  const now = new Date()
  const data = await api.stats.breakdown(type.value, now.getFullYear(), now.getMonth() + 1)
  if (!ringChart) return

  if (data.length === 0) {
    ringChart.clear()
    ringChart.setOption({ title: { text: '本月暂无记录', left: 'center', top: 'middle', textStyle: { color: '#c0c4cc', fontSize: 14, fontWeight: 'normal' } } })
    return
  }

  const total = data.reduce((s, d) => s + d.total, 0)
  ringChart.setOption({
    color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9c6ade', '#4db6ac', '#f06292', '#7986cb', '#ffb74d'],
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const d = data.find((x) => x.sub_name === p.name)
        return `${d ? d.main_name + '·' : ''}${p.name}<br/>¥${formatCents(p.value)}（${p.percent}%）`
      }
    },
    legend: { bottom: 0, type: 'scroll', icon: 'circle', itemWidth: 8, itemHeight: 8 },
    series: [
      {
        name: type.value === 'expense' ? '支出' : '收入',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{d}%', color: '#606266', fontSize: 11 },
        labelLine: { length: 8, length2: 6 },
        data: data.map((d) => ({ name: d.sub_name, value: d.total }))
      }
    ]
  })
}

// 折线图：近 12 个月趋势
async function renderLine() {
  const data = await api.stats.trend(type.value, 12)
  if (!lineChart) return

  lineChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `${p.axisValue}<br/>${type.value === 'expense' ? '支出' : '收入'}：${formatYuan(p.value)}`
      }
    },
    grid: { left: 56, right: 16, top: 24, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => `${Number(d.month.split('-')[1])}月`),
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#909399',
        formatter: (v) => (v >= 10000 ? `${v / 10000}万` : v)
      },
      splitLine: { lineStyle: { color: '#f0f2f5' } }
    },
    series: [
      {
        name: type.value === 'expense' ? '支出' : '收入',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 3, color: '#409eff' },
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.08)' },
        data: data.map((d) => Math.round(d.total / 100))
      }
    ]
  })
}

// 支出/收入切换时刷新两张图
watch(type, () => {
  renderRing()
  renderLine()
})

function onResize() {
  ringChart?.resize()
  lineChart?.resize()
}

onMounted(async () => {
  await loadSummary()
  await nextTick()
  ringChart = echarts.init(ringRef.value)
  lineChart = echarts.init(lineRef.value)
  await Promise.all([renderRing(), renderLine()])
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  ringChart?.dispose()
  lineChart?.dispose()
})
</script>

<template>
  <div class="stats">
    <!-- 汇总卡片 -->
    <div class="cards">
      <div class="card">
        <div class="card-title">今日</div>
        <div class="card-rows">
          <span>支出 <b class="expense">{{ formatMoney(todaySum.expense) }}</b></span>
          <span>收入 <b class="income">{{ formatMoney(todaySum.income) }}</b></span>
        </div>
      </div>
      <div class="card">
        <div class="card-title">{{ monthLabel }}</div>
        <div class="card-rows">
          <span>支出 <b class="expense">{{ formatMoney(monthSum.expense) }}</b></span>
          <span>收入 <b class="income">{{ formatMoney(monthSum.income) }}</b></span>
          <span>结余 <b :class="monthBalance < 0 ? 'neg' : 'pos'">{{ formatMoney(monthBalance) }}</b></span>
        </div>
      </div>
    </div>

    <!-- 支出/收入切换 -->
    <div class="type-switch">
      <button :class="{ active: type === 'expense' }" @click="type = 'expense'">支出</button>
      <button :class="{ active: type === 'income' }" @click="type = 'income'">收入</button>
    </div>

    <!-- 分类占比环形图 -->
    <div class="chart-card">
      <div class="chart-title">{{ monthLabel }}分类占比</div>
      <div ref="ringRef" class="chart ring-chart"></div>
    </div>

    <!-- 月度趋势折线图 -->
    <div class="chart-card">
      <div class="chart-title">近 12 个月趋势</div>
      <div ref="lineRef" class="chart line-chart"></div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.card-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
  color: #606266;
}

.expense {
  color: #303133;
}

.income {
  color: #67c23a;
}

.pos {
  color: #67c23a;
}

.neg {
  color: #f56c6c;
}

.type-switch {
  display: flex;
  background: #e9edf2;
  border-radius: 10px;
  padding: 4px;
  margin-top: 2px;
}

.type-switch button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 9px 0;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.type-switch button.active {
  background: #ffffff;
  color: #303133;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
  margin-bottom: 6px;
}

.ring-chart {
  height: 340px;
}

.line-chart {
  height: 260px;
}
</style>
