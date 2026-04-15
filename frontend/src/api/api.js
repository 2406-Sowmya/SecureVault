import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 → clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthHandshake = url.startsWith('/auth/login') ||
      url.startsWith('/auth/face-verify') ||
      url.startsWith('/auth/verify-otp')

    if (err.response?.status === 401 && !isAuthHandshake) {
      localStorage.removeItem('sv_token')
      localStorage.removeItem('sv_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:            (data)          => api.post('/auth/register', data),
  login:               (data)          => api.post('/auth/login', data),
  faceVerify:          (data)          => api.post('/auth/face-verify', data),
  verifyOtp:           (data)          => api.post('/auth/verify-otp', data),
  resendOtp:           (data)          => api.post('/auth/resend-otp', data),
  forgotPassword:      (data)          => api.post('/auth/forgot-password', data),
  validateResetToken:  (token)         => api.get(`/auth/validate-reset-token/${token}`),
  resetPassword:       (data)          => api.post('/auth/reset-password', data),
  me:                  ()              => api.get('/auth/me'),
}

// ── User ──────────────────────────────────────────────────────────────────────
export const userAPI = {
  dashboard: () => api.get('/user/dashboard'),
  attempts:  () => api.get('/user/attempts'),
}

// ── Vault ─────────────────────────────────────────────────────────────────────
export const vaultAPI = {
  listFiles:  ()         => api.get('/vault/files'),
  stats:      ()         => api.get('/vault/stats'),
  upload:     (formData) => api.post('/vault/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: formData._onProgress || undefined,
  }),
  download:   (fileId)   => api.get(`/vault/download/${fileId}`, { responseType: 'blob' }),
  deleteFile: (fileId)   => api.delete(`/vault/delete/${fileId}`),
}

export default api
