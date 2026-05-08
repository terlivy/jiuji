import { defineStore } from 'pinia'
import api from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user:  null,
    myRank: null,
  }),
  actions: {
    async login(phone) {
      const res = await api.login({ phone })
      if (res.code === 0) {
        this.token = res.data.token
        this.user  = res.data.user
        localStorage.setItem('token', this.token)
      }
      return res
    },
    async register(data) {
      const res = await api.register(data)
      if (res.code === 0) {
        this.token = res.data.token
        localStorage.setItem('token', this.token)
      }
      return res
    },
    async fetchProfile() {
      const res = await api.getProfile()
      if (res.code === 0) this.user = res.data
      return res
    },
    async fetchMyRank(params) {
      const res = await api.getMyRank(params)
      if (res.code === 0) this.myRank = res.data
      return res
    },
    logout() {
      this.token = ''
      this.user  = null
      localStorage.removeItem('token')
    }
  }
})
