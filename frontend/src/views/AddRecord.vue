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
      <div class="card" style="cursor:pointer;" @click="pickLocation">
        <div style="font-size:12px;color:#bbb;margin-bottom:4px;">地点</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:14px;color:#333;">
          <span>📍</span>
          <span style="flex:1;">{{ form.location_name || '点击选择地点' }}</span>
          <span v-if="form.latitude" style="font-size:11px;color:#1aad19;">✓ 已定位</span>
          <span style="color:#ccc;">›</span>
        </div>
      </div>

      <!-- 定位中... -->
      <div v-if="locating" class="card" style="padding:12px;text-align:center;color:#999;font-size:13px;">
        📍 定位中...
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
            style="width:80px;height:80px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;position:relative;overflow:hidden;">
            <img v-if="img.startsWith('data:')" :src="img" style="width:100%;height:100%;object-fit:cover;">
            <span v-else>{{ img }}</span>
            <span @click="form.images.splice(i,1)" style="position:absolute;top:-6px;right:-6px;background:#999;color:#fff;width:18px;height:18px;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1;">×</span>
          </div>
          <div style="width:80px;height:80px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:14px;border:1px dashed #ccc;cursor:pointer;" @click="triggerPhoto">+ 添加</div>
        </div>
        <input ref="photoInput" type="file" accept="image/*" capture="environment" style="display:none;" @change="onPhotoSelect">
      </div>

      <div class="btn-primary" @click="submit">发布记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const showLocation = ref(false)
const locating = ref(false)
const photoInput = ref(null)

const form = ref({
  content: '',
  drink_type: '🍺 啤酒',
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

function triggerPhoto() {
  photoInput.value?.click()
}

// compress image to target size (KB)
function compressImage(file, maxKB = 500) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        const scale = Math.min(1, Math.sqrt((maxKB * 1024) / (width * height * 0.75)))
        if (scale < 1) {
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function onPhotoSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  compressImage(file).then((dataUrl) => {
    form.value.images.push(dataUrl)
  })
}

async function pickLocation() {
  if (!navigator.geolocation) {
    alert('浏览器不支持定位')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      form.value.latitude = latitude
      form.value.longitude = longitude
      // 逆地址解析
      try {
        const res = await fetch(
          `https://apis.map.qq.com/jsapi?qt=addr&point=${latitude},${longitude}&key=&encode=1`
        )
        const text = await res.text()
        // 简单解析返回的地址
        const match = text.match(/\"addr\":\"([^\"]+)\"/)
        form.value.location_name = match ? match[1] : `${latitude.toFixed(4)},${longitude.toFixed(4)}`
      } catch {
        form.value.location_name = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
      }
      locating.value = false
    },
    (err) => {
      locating.value = false
      alert('定位失败：' + err.message)
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function submit() {
  if (!form.value.drink_name || !form.value.amount) {
    alert('请填写酒名和数量')
    return
  }
  const payload = {
    content: form.value.content,
    drink_type: form.value.drink_type,
    drink_name: form.value.drink_name,
    amount: form.value.amount,
    alcohol_degree: form.value.alcohol_degree,
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    location_name: form.value.location_name,
  }
  // 真实图片：传 base64 字符串列表（后端需要支持）
  if (form.value.images.length > 0 && form.value.images[0]?.startsWith('data:')) {
    payload.images = form.value.images
  }
  const res = await api.postRecord(payload)
  if (res.code === 0) {
    router.push('/feed')
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
