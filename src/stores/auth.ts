import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

interface UserInfo {
  email: string
  name: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') ?? '')
  const user = ref<UserInfo | null>((() => {
    try { return JSON.parse(localStorage.getItem('user') ?? 'null') }
    catch { localStorage.removeItem('user'); return null }
  })())

  const isLoggedIn = computed(() => {
    if (!token.value) return false
    try {
      const base64 = token.value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      return payload.exp * 1000 > Date.now()
    } catch { return false }
  })

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function setFromToken(newToken: string) {
    try {
      const base64 = newToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      token.value = newToken
      user.value = {
        email: payload.email,
        name: payload.name,
        role: Array.isArray(payload.groups) ? payload.groups[0] : payload.groups,
      }
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      logout()
    }
  }

  async function login(email: string, password: string) {
    const data = await authApi.login(email, password)
    setFromToken(data.token)
  }

  async function register(name: string, email: string, password: string) {
    const data = await authApi.register(name, email, password)
    setFromToken(data.token)
  }

  return { token, user, isLoggedIn, login, register, logout, setFromToken }
})
