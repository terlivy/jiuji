import { defineStore } from 'pinia'
import api from '@/api'

export const usePointsStore = defineStore('points', {
  state: () => ({
    points: 0,
    totalEarned: 0,
    totalSpent: 0,
    rank: null,
    history: [],
    historyPage: 1,
    historyHasMore: true,
  }),
  actions: {
    async fetchPoints() {
      const res = await api.get('/points')
      if (res.code === 0) {
        this.points = res.data.points
        this.totalEarned = res.data.totalEarned
        this.totalSpent = res.data.totalSpent
        this.rank = res.data.rank
      }
      return res
    },
    async fetchHistory(page = 1) {
      const res = await api.get('/points/history', { params: { page, limit: 20 } })
      if (res.code === 0) {
        if (page === 1) this.history = res.data
        else this.history.push(...res.data)
        this.historyPage = page
        this.historyHasMore = res.data.length === 20
      }
      return res
    },
  }
})
