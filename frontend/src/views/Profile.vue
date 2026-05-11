<template>
  <div class="page">
    <!-- 个人信息 -->
    <div class="profile-header">
      <div class="avatar avatar-lg" style="background:rgba(255,255,255,.25);margin:0 auto 10px;">
        {{ user?.avatar || '🍶' }}
      </div>
      <div style="font-size:20px;font-weight:700;color:#fff;">
        {{ user?.nickname }} <span v-if="user?.level>=5" class="vip-badge">V</span>
      </div>
      <div style="font-size:13px;opacity:.8;margin-top:4px;">📍 {{ user?.province }}-{{ user?.city }}</div>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <div style="background:rgba(255,255,255,.2);padding:4px 12px;border-radius:12px;font-size:12px;">🎖️ 白酒达人</div>
        <div style="background:rgba(255,255,255,.2);padding:4px 12px;border-radius:12px;font-size:12px;">🏅 月榜第{{ myRank || '-' }}</div>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">{{ user?.total_drinks || 0 }}</div>
        <div class="stat-label">喝酒次数</div>
      </div>
      <div class="stat-item" @click="$router.push('/points')">
        <div class="stat-num">{{ user?.points || 0 }}</div>
        <div class="stat-label">积分 ›</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ followersCount }}</div>
        <div class="stat-label">粉丝</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ followingCount }}</div>
        <div class="stat-label">关注</div>
      </div>
    </div>

    <!-- 成就 -->
    <div style="padding:0 12px;">
      <div style="font-size:15px;font-weight:600;margin:12px 0 8px;display:flex;align-items:center;gap:6px;">🏆 成就</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <div v-for="a in achievements" :key="a.id"
          class="achievement-item"
          :class="{locked: !a.unlocked}">
          <div style="font-size:28px;">{{ a.icon }}</div>
          <div style="font-size:11px;margin-top:2px;">{{ a.name }}</div>
          <div style="font-size:10px;color:#bbb;">{{ a.unlocked ? '已解锁' : `还差${a.condition_value - (a.current||0)}次` }}</div>
        </div>
      </div>
    </div>

    <!-- 菜单 -->
    <div style="padding:0 12px 12px;">
      <div class="card" style="padding:0;overflow:hidden;">
        <div v-for="(m,i) in menuItems" :key="i" class="menu-item" @click="m.fn()">
          <span style="font-size:20px;">{{ m.icon }}</span>
          <span style="flex:1;font-size:15px;">{{ m.label }}</span>
          <span style="color:#bbb;font-size:13px;">{{ m.value }}</span>
          <span style="color:#ccc;">›</span>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const myRank = ref(null)
const achievements = ref([])
const followersCount = ref(0)
const followingCount = ref(0)

const menuItems = [
  {icon:'📖', label:'我的喝酒记录', value:'', fn:() => router.push('/feed')},
  {icon:'⭐', label:'我的收藏', value:'', fn:() => {}},
  {icon:'🎖️', label:'成就墙', value:'', fn:() => {}},
  {icon:'⚙️', label:'设置', value:'', fn:() => {}},
  {icon:'📝', label:'编辑资料', value:'修改地区', fn:() => {}},
]

onMounted(async () => {
  if (!userStore.user) await userStore.fetchProfile()
  const [achRes, myRankRes, followersRes, followingRes] = await Promise.all([
    api.getAchievements(),
    api.getMyRank({}),
    api.getFollowers(),
    api.getFollowing(),
  ])
  if (achRes.code === 0) achievements.value = achRes.data
  if (myRankRes.code === 0 && myRankRes.data) myRank.value = myRankRes.data.rank
  if (followersRes.code === 0) followersCount.value = followersRes.data.length
  if (followingRes.code === 0) followingCount.value = followingRes.data.length
})
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg,#1aad19,#0d8a0f);
  padding: 24px 16px 50px; text-align: center; color: #fff;
}
.stats-row {
  display: flex; background: #fff; border-radius: 10px;
  margin: -36px 12px 0; box-shadow: 0 2px 8px rgba(0,0,0,.1);
  position: relative; z-index: 1;
}
.stat-item { flex: 1; text-align: center; padding: 14px 0; border-right: 1px solid #f0f0f0; }
.stat-item:last-child { border-right: none; }
.stat-num { font-size: 20px; font-weight: 700; color: #1aad19; }
.stat-label { font-size: 11px; color: #999; margin-top: 2px; }
.achievement-item {
  background: #fff; border-radius: 10px; padding: 12px; width: calc(33.33% - 6px);
  text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer;
}
.achievement-item.locked { opacity: .5; filter: grayscale(1); }
.menu-item {
  display: flex; align-items: center; padding: 13px 14px;
  gap: 10px; border-bottom: 1px solid #f5f5f5; cursor: pointer;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: #fafafa; }
</style>
