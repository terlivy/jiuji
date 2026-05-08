<template>
  <div class="page">
    <div class="header">
      <div class="header-back" @click="$router.back()">←</div>
      <div class="header-title">个人主页</div>
      <div class="header-right"></div>
    </div>

    <div v-if="profile">
      <div class="other-header">
        <div class="avatar avatar-lg" style="background:rgba(255,255,255,.2);margin:0 auto 10px;">
          {{ profile.avatar || '🍶' }}
        </div>
        <div style="font-size:20px;font-weight:700;color:#fff;">{{ profile.nickname }}</div>
        <div style="font-size:13px;opacity:.8;margin-top:4px;">📍 {{ profile.province }}-{{ profile.city }}</div>
        <div class="follow-btn" :class="{followed: isFollowing}" @click="toggleFollow">
          {{ isFollowing ? '✓ 已关注' : '+ 关注' }}
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-item"><div class="stat-num">{{ profile.total_drinks }}</div><div class="stat-label">喝酒次数</div></div>
        <div class="stat-item"><div class="stat-num">{{ profile.points }}</div><div class="stat-label">积分</div></div>
        <div class="stat-item"><div class="stat-num">{{ profile.followers_count }}</div><div class="stat-label">粉丝</div></div>
        <div class="stat-item"><div class="stat-num">{{ profile.following_count }}</div><div class="stat-label">关注</div></div>
      </div>
    </div>

    <div style="padding:0 12px 12px;">
      <div style="font-size:15px;font-weight:600;margin:12px 0 8px;">📖 最近记录</div>
      <div v-for="r in records" :key="r.id" class="feed-card">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px 8px;">
          <div class="avatar avatar-sm">{{ profile?.avatar || '🍶' }}</div>
          <div>
            <div style="font-size:14px;font-weight:600;">{{ profile?.nickname }}</div>
            <div style="font-size:11px;color:#bbb;">{{ formatTime(r.created_at) }}</div>
          </div>
        </div>
        <div style="padding:0 14px 10px;font-size:14px;line-height:1.5;">{{ r.content }}</div>
        <div style="padding:0 14px 10px;display:flex;gap:6px;">
          <span class="tag">{{ r.drink_type }} · {{ r.drink_name }}</span>
          <span class="tag">{{ r.amount }}</span>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const profile = ref(null)
const records = ref([])
const isFollowing = ref(false)

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getMonth()+1}月${d.getDate()}日`
}

async function toggleFollow() {
  if (isFollowing.value) {
    await api.unfollow(profile.value.id)
  } else {
    await api.follow(profile.value.id)
  }
  isFollowing.value = !isFollowing.value
}

onMounted(async () => {
  const id = route.params.id
  const [userRes, myRecs] = await Promise.all([
    api.getUserById(id),
    api.getMyRecords(),
  ])
  if (userRes.code === 0) {
    profile.value = userRes.data
    isFollowing.value = !!userRes.data.is_following
  }
  if (myRecs.code === 0) {
    records.value = myRecs.data.slice(0, 5)
  }
})
</script>

<style scoped>
.other-header {
  background: linear-gradient(135deg,#576b95,#3d5a80);
  padding: 24px 16px 50px; text-align: center; color: #fff;
}
.follow-btn {
  display: inline-block; margin-top: 12px;
  background: #fff; color: #576b95; padding: 6px 24px;
  border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.follow-btn.followed { background: #e8f9e8; color: #1aad19; }
.stats-row {
  display: flex; background: #fff; border-radius: 10px;
  margin: -36px 12px 0; box-shadow: 0 2px 8px rgba(0,0,0,.1); position: relative; z-index: 1;
}
.stat-item { flex: 1; text-align: center; padding: 14px 0; border-right: 1px solid #f0f0f0; }
.stat-item:last-child { border-right: none; }
.stat-num { font-size: 20px; font-weight: 700; color: #576b95; }
.stat-label { font-size: 11px; color: #999; margin-top: 2px; }
.feed-card { background: #fff; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
</style>
