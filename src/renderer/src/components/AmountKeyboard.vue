<script setup>
// 金额数字键盘：九宫格输入，支持小数点（最多两位）和退格
// 用法：<AmountKeyboard v-model="amountStr" />
const props = defineProps({
  modelValue: { type: String, default: '0' }
})
const emit = defineEmits(['update:modelValue'])

function press(key) {
  let cur = props.modelValue
  if (key === '.') {
    if (!cur.includes('.')) emit('update:modelValue', cur + '.')
    return
  }
  if (key === 'back') {
    const next = cur.length > 1 ? cur.slice(0, -1) : '0'
    emit('update:modelValue', next)
    return
  }
  // 数字：整数位最多 7 位，小数位最多 2 位
  if (cur === '0') {
    emit('update:modelValue', key)
    return
  }
  const [intPart, decPart = ''] = cur.split('.')
  if (decPart.length >= 2) return // 已到两位小数
  if (!cur.includes('.') && intPart.length >= 7) return // 整数位上限
  emit('update:modelValue', cur + key)
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back']
</script>

<template>
  <div class="amount-keyboard">
    <button
      v-for="k in keys"
      :key="k"
      class="key"
      :class="{ 'key-back': k === 'back' }"
      @click="press(k)"
    >
      <template v-if="k === 'back'">⌫</template>
      <template v-else>{{ k }}</template>
    </button>
  </div>
</template>

<style scoped>
.amount-keyboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px 0;
}

.key {
  height: 52px;
  font-size: 22px;
  border: none;
  border-radius: 10px;
  background: #ffffff;
  color: #303133;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: background 0.1s;
}

.key:hover {
  background: #f0f2f5;
}

.key:active {
  background: #e4e7ed;
}

.key-back {
  font-size: 20px;
}
</style>
