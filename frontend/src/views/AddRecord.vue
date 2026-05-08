<template>
  <div class="page">
    <div class="header">
      <div class="header-back" @click="$router.back()">←</div>
      <div class="header-title">记一笔</div>
      <div class="header-right" style="font-size:14px;color:#1aad19;font-weight:600;cursor:pointer;" @click="submit">发布</div>
    </div>

    <div style="padding:14px;display:flex;flex-direction:column;gap:12px;">
      <!-- 内容 -->
      <div class="card">
        <div style="font-size:12px;color:#bbb;margin-bottom:6px;">说什么</div>
        <textarea v-model="form.content" style="border:none;outline:none;font-size:15px;width:100%;resize:none;height:80px;background:transparent;" placeholder="今晚喝了什么？和谁喝？"></textarea>
      </div>

      <!-- 酒类选择 -->
      <div class="card">
        <div style="font-size:12px;color:#bbb;margin-bottom:8px;">喝了什么</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <div v-for="t in drinkTypes" :key="t.label"
            class="type-btn" :class="{active: form.drink_type===t.label}"
            @click="form.drink_type=t.label">
            {{ t.label }}
          </div>
        </div>
        <input v-model="form.drink_name" class="input" placeholder="酒名，如：五粮液、雪花纯生">
        <div class="card-divider"></div>
        <div style="display:flex;gap:10px;">
          <input v-model="form.amount" class="input" placeholder="喝了多少，如：2两、4瓶" style="flex:1;">
          <input v-model="form.alcohol_degree" class="input" placeholder="酒精度，如：53°" style="width:80px;">
        </div>
      </div>

      <!-- 地点 -->
      <div class="card" style="cursor:pointer;" @click="showLocation=true">
        <div style="font-size:12px;color:#bbb;margin-bottom:4px;">地点</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:14px;color:#333;">
          <span>📍</span>
          <span style="flex:1;">{{ form.location_name || '点击选择地点' }}</span>
          <span style="color:#ccc;">›</span>
        </div>
      </div>

      <!-- 好友 -->
      <div class="card">
        <div style="font-size:12px;color:#bbb;margin-bottom:4px;">和谁喝</div>
        <input v-model="form.friends" class="input" placeholder="添加好友，多个用逗号分隔">
      </div>

      <!-- 照片 -->
      <div class="card">
        <div style="font-size:12px;color:#bbb;margin-bottom:8px;">照片</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <div v-for="(img,i) in form.images" :key="i"
            style="width:80px;height:80px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;position:relative;">
            {{ img }}
            <span @click="form.images.splice(i,1)" style="position:absolute;top:-6px;right:-6px;background:#999;color:#fff;width:18px;height:18px;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;">×</span>
          </div>
          <div style="width:80px;height:80px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:14px;border:1px dashed #ccc;cursor:pointer;" @click="addPhoto">+ 添加</div>
        </div>
      </div>

      <div class="btn-primary" @click="submit">发布记录</div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const showLocation = ref(false)

const form = ref({
  content: '',
  drink_type: '啤酒',
  drink_name: '',
  amount: '',
  alcohol_degree: '',
  location_name: '',
  latitude: null,
  longitude: null,
  images: [],
  friends: [],
})

const drinkTypes = [
  {label:'🍺 啤酒'},{label:'🍶 白酒'},{label:'🍷 红酒'},
  {label:'🥃 威士忌'},{label:'🍶 清酒'},{label:'🍾 香槟'},
]

function addPhoto() {
  // 实际项目这里调起拍照/相册
  form.value.images.push('📷')
}

async function submit() {
  if (!form.value.drink_name || !form.value.amount) {
    alert('请填写酒名和数量')
    return
  }
  const res = await api.postRecord(form.value)
  if (res.code === 0) {
    router.push('/')
  } else {
    alert(res.msg || '发布失败')
  }
}
</script>

<style scoped>
.card-divider { height:1px; background:#f0f0f0; margin:8px 0; }
.type-btn {
  padding:6px 14px; border-radius:20px; font-size:13px;
  background:#f0f0f0; color:#666; cursor:pointer;
  border:1px solid transparent; transition:.2s;
}
.type-btn.active { background:#e8f9e8;color:#1aad19;border-color:#1aad19;font-weight:600; }
</style>
