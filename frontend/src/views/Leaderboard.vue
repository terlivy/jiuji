<template>
  <div class="page">
    <div class="header">
      <div class="header-back" @click="$router.back()">←</div>
      <div class="header-title">🏆 排行榜</div>
      <div class="header-right"></div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <div v-for="t in tabItems" :key="t.value"
        class="tab" :class="{active: activeTab===t.value}"
        @click="activeTab=t.value; fetchLeaderboard()">
        {{ t.label }}
      </div>
    </div>

    <!-- Month selector (only for monthly) -->
    <div v-if="activeTab==='month'" class="month-selector">
      <span class="month-nav" @click="prevMonth">‹</span>
      <span class="month-label">{{ monthLabel }}</span>
      <span class="month-nav" @click="nextMonth">›</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- List -->
    <div v-else style="padding:12px;display:flex;flex-direction:column;gap:10px;">
      <div v-for="u in list" :key="u.id" class="rank-card" @click="$router.push('/user/'+u.id)">
        <div class="rank-num" :class="getRankClass(u.rank)">{{ u.rank }}</div>
        <div class="avatar">{{ u.avatar || '🍶' }}</div>
        <div class="flex-1" style="min-width:0;">
          <div style="font-size:15px;font-weight:600;display:flex;align-items:center;gap:5px;">
            {{ u.nickname }}
            <span class="title-badge">{{ getTitle(u.drink_count) }}</span>
            <span v-if="u.level>=5" class="vip-badge">V</span>
          </div>
          <div class="text-sm text-gray" style="display:flex;gap:8px;flex-wrap:wrap;">
            <span>📍{{ u.province }}-{{ u.city }}</span>
            <span>💰{{ u.points }}积分</span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:#1aad19;">{{ u.drink_count || 0 }}</div>
          <div class="text-xs text-gray">次</div>
        </div>
      </div>
      <div v-if="list.length === 0" style="text-align:center;padding:40px;color:#bbb;font-size:14px;">
        暂无数据
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const activeTab = ref('total')
const list = ref([])
const loading = ref(false)
const currentDate = new Date()

const tabItems = [
  { label: '总榜', value: 'total' },
  { label: '月榜', value: 'month' }
]

const monthLabel = computed(() => {
  const y = currentDate.getFullYear()
  const m = String(currentDate.getMonth() + 1).padStart(2, '0')
  return `${y}年${m}月`
})

const monthParam = computed(() => {
  const y = currentDate.getFullYear()
  const m = String(currentDate.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

function getRankClass(rank) {
  if (rank === 1) return 'top1'
  if (rank === 2) return 'top2'
  if (rank === 3) return 'top3'
  return 'other'
}

function getTitle(totalDrinks) {
  if (totalDrinks > 100) return '🍶酒神'
  if (totalDrinks > 50) return '🥃酒仙'
  if (totalDrinks > 20) return '🍷酒魁'
  if (totalDrinks > 5) return '🍵酒客'
  return ''
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1)
  fetchLeaderboard()
}

function nextMonth() {
  const now = new Date()
  if (currentDate.getFullYear() < now.getFullYear() ||
      (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() < now.getMonth())) {
    currentDate.setMonth(currentDate.getMonth() + 1)
    fetchLeaderboard()
  }
}

async function fetchLeaderboard() {
  loading.value = true
  try {
    const params = activeTab.value === 'month' ? { month: monthParam.value } : {}
    const res = await api.getLeaderboard(params)
    if (res.code === 0) {
      list.value = res.data.list || []
    }
  } catch (err) {
    console.error('fetchLeaderboard error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped>
.rank-card {
  background: #fff; border-radius: 10px; padding: 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer;
}
.rank-num {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.top1 { background: #ffd700; color: #fff; }
.top2 { background: #c0c0c0; color: #fff; }
.top3 { background: #cd7f32; color: #fff; }
.other { background: #f0f0f0; color: #666; }
.title-badge { font-size: 11px; background: #fff3e0; color: #e65100; padding: 1px 5px; border-radius: 4px; }
.vip-badge { background: #ff6b6b; color: #fff; font-size: 10px; padding: 1px 4px; border-radius: 3px; }
.month-selector {
  display: flex; align-items: center; justify-content: center; gap: 20px;
  padding: 10px; background: #f9f9f9;
}
.month-nav { font-size: 22px; color: #1aad19; cursor: pointer; padding: 0 10px; }
.month-label { font-size: 14px; font-weight: 600; color: #333; }
.loading { text-align: center; padding: 40px; color: #999; font-size: 14px; }
</style>
