<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCategoriesStore } from '../stores/categories'

// 两级分类选择器：左侧大类、右侧小类（最近使用的 4 个小类置顶）
// 用法：<CategoryPicker :type="'expense'" v-model="categoryId" :recentIds="[1,2]" />
const props = defineProps({
  type: { type: String, required: true }, // 'expense' | 'income'
  modelValue: { type: Number, default: null },
  recentIds: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const store = useCategoriesStore()

const mains = computed(() => store.byType(props.type))
const activeMainId = ref(null)
const activeSubId = ref(null)

// 当前大类下的小类（最近使用的排在最前面）
const subs = computed(() => {
  const main = mains.value.find((c) => c.id === activeMainId.value)
  if (!main) return []
  const recent = main.children.filter((s) => props.recentIds.includes(s.id))
  const rest = main.children.filter((s) => !props.recentIds.includes(s.id))
  return [...recent, ...rest]
})

function selectMain(id) {
  activeMainId.value = id
  const first = mains.value.find((c) => c.id === id)
  if (first?.children?.length) {
    activeSubId.value = first.children[0].id
    emit('update:modelValue', activeSubId.value)
  }
}

function selectSub(id) {
  activeSubId.value = id
  emit('update:modelValue', id)
}

onMounted(async () => {
  await store.ensureLoaded()
  // 初始选中：第一个大类及其第一个小类
  if (mains.value.length > 0) {
    const target = props.modelValue ? store.mainOf(props.modelValue) : null
    activeMainId.value = target?.id ?? mains.value[0].id
    const main = mains.value.find((c) => c.id === activeMainId.value)
    const keepSub = main?.children.some((s) => s.id === props.modelValue)
    activeSubId.value = keepSub
      ? props.modelValue
      : main?.children?.[0]?.id ?? null
    if (activeSubId.value) emit('update:modelValue', activeSubId.value)
  }
})

// 外部切换 type 时重新初始化
watch(
  () => props.type,
  () => {
    if (mains.value.length > 0) {
      activeMainId.value = mains.value[0].id
      const main = mains.value[0]
      activeSubId.value = main?.children?.[0]?.id ?? null
      if (activeSubId.value) emit('update:modelValue', activeSubId.value)
    }
  }
)
</script>

<template>
  <div class="category-picker">
    <!-- 左列：一级大类 -->
    <div class="main-col">
      <button
        v-for="c in mains"
        :key="c.id"
        class="main-item"
        :class="{ active: c.id === activeMainId }"
        @click="selectMain(c.id)"
      >
        {{ c.name }}
      </button>
    </div>

    <!-- 右列：二级小类 -->
    <div class="sub-col">
      <button
        v-for="s in subs"
        :key="s.id"
        class="sub-item"
        :class="{ active: s.id === activeSubId }"
        @click="selectSub(s.id)"
      >
        {{ s.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-picker {
  display: flex;
  gap: 10px;
  height: 260px;
}

.main-col {
  width: 110px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f5f7fa;
  border-radius: 10px;
  padding: 8px;
}

.main-item {
  border: none;
  background: transparent;
  padding: 10px 8px;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.main-item:hover {
  background: #ecf5ff;
}

.main-item.active {
  background: #409eff;
  color: #ffffff;
  font-weight: 600;
}

.sub-col {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-content: start;
}

.sub-item {
  border: 1px solid #e4e7ed;
  background: #ffffff;
  padding: 10px 4px;
  border-radius: 8px;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  transition: all 0.1s;
}

.sub-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.sub-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}
</style>
