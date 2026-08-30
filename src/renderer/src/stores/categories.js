import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'

// 分类数据全局状态：整个应用只加载一次
export const useCategoriesStore = defineStore('categories', () => {
  const all = ref([]) // [{ id, type, name, children: [{id, name}] }]
  const loaded = ref(false)

  async function ensureLoaded() {
    if (loaded.value) return
    all.value = await api.categories.listAll()
    loaded.value = true
  }

  // 按类型取大类列表（expense 支出 / income 收入）
  function byType(type) {
    return all.value.filter((c) => c.type === type)
  }

  // 根据小类 id 找所属大类
  function mainOf(subId) {
    for (const c of all.value) {
      if (c.children.some((s) => s.id === subId)) return c
    }
    return null
  }

  // 根据小类 id 找小类
  function subOf(subId) {
    for (const c of all.value) {
      const s = c.children.find((s) => s.id === subId)
      if (s) return s
    }
    return null
  }

  return { all, loaded, ensureLoaded, byType, mainOf, subOf }
})
