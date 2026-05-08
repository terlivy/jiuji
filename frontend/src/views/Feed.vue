<template>
  <div class="page">
    <div class="header">
      <div class="header-back"></div>
      <div class="header-title">酒友圈</div>
      <div class="header-right" @click="$router.push('/add')">✏️</div>
    </div>
    <div class="tabs">
      <div v-for="t in types" :key="t.value"
        class="tab" :class="{active: activeType===t.value}"
        @click="activeType=t.value; fetchFeed()">
        {{ t.label }}
      </div>
    </div>

    <div style="padding:12px;display:flex;flex-direction:column;gap:0;">
      <div v-for="r in feed" :key="r.id" class="feed-card">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px 8px;">
          <div class="avatar avatar-sm">{{ r.avatar || '🍶' }}</div>
          <div class="flex-1">
            <div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:5px;">
              {{ r.nickname }}<span v-if="r.level>=5" class="vip-badge">V</span>
            </div>
            <div style="font-size:11px;color:#bbb;margin-top:1px;">
              {{ formatTime(r.created_at) }}
              <span v-if="r.location_name" style="margin-left:6px;color:#576b95;">📍 {{ r.location_name }}</span>
            </div>
          </div>
        </div>
        <div style="padding:0 14px 10px;font-size:14px;line-height:1.6;">{{ r.content }}</div>
        <div style="padding:0 14px 10px;display:flex;gap:6px;flex-wrap:wrap;">
          <span class="tag">{{ r.drink_type }} · {{ r.drink_name }}</span>
          <span class="tag">{{ r.amount }}</span>
        </div>
        <div style="padding:8px 14px 10px;display:flex;gap:20px;border-top:1px solid #f0f0f0;">
          <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#999;cursor:pointer;">
            <span>👍</span> {{ r.likes || 0 }}
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#999;cursor:pointer;">
            <span>💬</span> 评论
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#999;cursor:pointer;margin-left:auto;">
            <span>🔗</span> 送酒
          </div>
        </div>
      </div>
      <div v-if="feed.length===0" style="text-align:center;padding:60px;color:#bbb;font-size:14px;">
        还没有记录，赶快去记一笔吧！
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const feed = ref([])
const activeType = ref('')
const types = [
  {label:'全部',value:''},
  {label:'白酒',value:'白酒'},
  {label:'啤酒',value:'啤酒'},
  {label:'红酒',value:'红酒'},
]

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`
  return `${d.getMonth()+1}月${d.getDate()}日`
}

async function fetchFeed() {
  const params = activeType.value ? { drink_type: activeType.value } : {}
  const res = await api.getFeed(params)
  if (res.code === 0) feed.value = res.data
}

import { onMounted } from 'vue'
onMounted(fetchFeed)
</script>

<style scoped>
.feed-card {
  background: #fff; margin-bottom: 10px; border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
</style>
