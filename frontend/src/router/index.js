import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Feed from '@/views/Feed.vue'
import AddRecord from '@/views/AddRecord.vue'
import Profile from '@/views/Profile.vue'
import OtherProfile from '@/views/OtherProfile.vue'
import Login from '@/views/Login.vue'

const routes = [
  { path: '/',        name: 'Home',        component: Home },
  { path: '/feed',   name: 'Feed',       component: Feed },
  { path: '/add',    name: 'AddRecord',  component: AddRecord },
  { path: '/profile',name: 'Profile',    component: Profile },
  { path: '/user/:id',name:'OtherProfile',component: OtherProfile },
  { path: '/login',  name: 'Login',      component: Login },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!token && to.name !== 'Login') {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
