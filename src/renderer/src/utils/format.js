// 金额格式化工具：数据库存的是「分」整数，这里转成界面显示用的「元」字符串

// 分 → "1,234.56"（千分位 + 两位小数）
export function formatCents(cents) {
  const yuan = (cents / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return yuan
}

// 分 → "¥1,234.56"
export function formatMoney(cents) {
  return `¥${formatCents(cents)}`
}

// 本地日期 → "YYYY-MM-DD"（用本地时间，避免时区偏移）
export function localDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "2026-08-29" → "8月29日"
export function formatDay(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}月${Number(d)}日`
}
