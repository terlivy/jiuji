import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      location.hash = '#/login'
    }
    return Promise.reject(err)
  }
)

export default {
  // auth
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       () => api.get('/auth/me'),

  // users
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUserById: (id) => api.get(`/users/${id}`),

  // records
  getFeed:    (params) => api.get('/records', { params }),
  getMyRecords: () => api.get('/records/mine'),
  postRecord: (data) => api.post('/records', data),

  // rankings
  getRankings: (params) => api.get('/rankings', { params }),
  getMyRank:   (params) => api.get('/rankings/my', { params }),

  // achievements
  getAchievements: () => api.get('/achievements'),

  // follows
  follow:       (id) => api.post('/follows', { following_id: id }),
  unfollow:     (id) => api.delete(`/follows/${id}`),
  getFollowers: () => api.get('/follows/followers'),
  getFollowing: () => api.get('/follows/following'),
}
