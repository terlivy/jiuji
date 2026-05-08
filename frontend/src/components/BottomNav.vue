<template>
  <div class="bottom-nav">
    <div v-for="item in navItems" :key="item.path"
      class="nav-item"
      :class="{active: $route.path === item.path}"
      @click="$router.push(item.path)">
      <div class="nav-icon">{{ item.icon }}</div>
      <div>{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup>
const navItems = [
  { path: '/',        icon: '🏆', label: '排行榜' },
  { path: '/feed',   icon: '📋', label: '记录' },
  { path: '/add',    icon: '🍶', label: '记一笔' },
  { path: '/profile',icon: '👤', label: '我的' },
]
</script>
