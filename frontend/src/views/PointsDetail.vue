<template>
  <div class="page">
    <div class="header">
      <div class="header-back" @click="$router.back()">←</div>
      <div class="header-title">💰 积分中心</div>
      <div class="header-right"></div>
    </div>

    <!-- 积分概览卡片 -->
    <div class="points-card">
      <div class="points-balance">{{ overview.points || 0 }}</div>
      <div class="points-label">当前积分</div>
      <div class="points-row">
        <div class="points-stat">
          <div class="stat-val text-green">+{{ overview.totalEarned || 0 }}</div>
          <div class="stat-key">累计获得</div>
        </div>
        <div class="points-divider"></div>
        <div class="points-stat">
          <div class="stat-val text-red">-{{ overview.totalSpent || 0 }}</div>
          <div class="stat-key">累计消耗</div>
        </div>
        <div class="points-divider"></div>
        <div class="points-stat">
          <div class="stat-val">第{{ overview.rank || '-' }}名</div>
          <div class="stat-key">积分排行</div>
        </div>
      </div>
    </div>

    <!-- 积分规则 -->
    <div class="rules-box">
      <div class="rules-title">📋 积分规则</div>
      <div class="rule-item">🍺 发帖记录喝酒 +10 积分/次</div>
      <div class="rule-item">🏆 达成成就 +积分奖励</div>
      <div class="rule-item">🎁 积分可兑换商城商品</div>
    </div>

    <!-- 积分明细 -->
    <div class="section-title">📜 积分明细</div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="history.length === 0" class="empty">暂无记录</div>
    <div v-else class="history-list">
      <div v-for="h in history" :key="h.id" class="history-item">
        <div class="history-icon">{{ h.amount > 0 ? '🍺' : '🎁' }}</div>
        <div class="history-info">
          <div class="history-reason">{{ h.reason }}</div>
          <div class="history-date">{{ formatDate(h.created_at) }}</div>
        </div>
        <div class="history-amount" :class="h.amount > 0 ? 'text-green' : 'text-red'">
          {{ h.amount > 0 ? '+' : '' }}{{ h.amount }}
        </div>
        <div class="history-balance">余额 {{ h.balance }}</div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="history.length >= pageSize" class="load-more" @click="loadMore">
      {{ hasMore ? '加载更多' : '没有更多了' }}
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const overview = ref({})
const history = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const hasMore = ref(false)

onMounted(() => {
  fetchOverview()
  fetchHistory()
})

async function fetchOverview() {
  try {
    const res = await api.get('/points')
    if (res.code === 0) overview.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function fetchHistory() {
  loading.value = true
  try {
    const res = await api.get(`/points/history?page=${page.value}&limit=${pageSize}`)
    if (res.code === 0) {
      history.value = res.data
      hasMore.value = res.data.length === pageSize
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value) return
  page.value++
  try {
    const res = await api.get(`/points/history?page=${page.value}&limit=${pageSize}`)
    if (res.code === 0) {
      history.value.push(...res.data)
      hasMore.value = res.data.length === pageSize
    }
  } catch (e) {
    console.error(e)
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; border-bottom: 1px solid #eee; }
.header-back { font-size: 20px; color: #333; }
.header-title { font-size: 17px; font-weight: 600; }
.points-card { background: linear-gradient(135deg,#1aad19,#0d8a0f); color: #fff; padding: 28px 20px 20px; text-align: center; }
.points-balance { font-size: 52px; font-weight: 700; line-height: 1.1; }
.points-label { font-size: 13px; opacity: 0.8; margin: 4px 0 16px; }
.points-row { display: flex; justify-content: space-around; align-items: center; background: rgba(255,255,255,0.15); border-radius: 12px; padding: 14px 0; }
.points-stat { text-align: center; }
.stat-val { font-size: 17px; font-weight: 700; }
.stat-key { font-size: 11px; opacity: 0.75; margin-top: 2px; }
.points-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.3); }
.text-green { color: #4caf50; }
.text-red { color: #e57373; }
.rules-box { margin: 12px; background: #fff; border-radius: 10px; padding: 14px 16px; }
.rules-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.rule-item { font-size: 13px; color: #666; padding: 4px 0; }
.section-title { padding: 12px 16px 8px; font-size: 15px; font-weight: 600; }
.history-list { background: #fff; }
.history-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; }
.history-icon { font-size: 24px; flex-shrink: 0; }
.history-info { flex: 1; min-width: 0; }
.history-reason { font-size: 14px; font-weight: 500; color: #333; }
.history-date { font-size: 12px; color: #aaa; margin-top: 2px; }
.history-amount { font-size: 16px; font-weight: 700; flex-shrink: 0; }
.history-balance { font-size: 11px; color: #bbb; flex-shrink: 0; }
.loading { text-align: center; padding: 30px; color: #999; }
.empty { text-align: center; padding: 40px; color: #bbb; }
.load-more { text-align: center; padding: 14px; color: #1aad19; font-size: 14px; cursor: pointer; background: #fff; }
</style>
