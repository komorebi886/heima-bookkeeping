import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecordView from '../views/RecordView.vue'
import LedgerView from '../views/LedgerView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/record', name: 'record', component: RecordView },
  { path: '/ledger', name: 'ledger', component: LedgerView },
  { path: '/stats', name: 'stats', component: StatsView },
  { path: '/settings', name: 'settings', component: SettingsView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
