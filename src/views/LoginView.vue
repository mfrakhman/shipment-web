<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref(route.query.error === 'oauth_failed' ? 'Google sign-in failed. Please try again.' : '')
const loading = ref(false)

function openGooglePopup() {
  const popup = window.open(
    '/api/auth/oauth/google',
    'google-oauth',
    'width=500,height=620,left=400,top=100',
  )
  if (!popup) { error.value = 'Popup blocked. Please allow popups and try again.'; return }

  function onMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return
    if (event.data?.type === 'oauth_success') {
      auth.setFromToken(event.data.token)
      router.push('/')
    } else if (event.data?.type === 'oauth_error') {
      error.value = 'Google sign-in failed. Please try again.'
    }
    window.removeEventListener('message', onMessage)
  }

  window.addEventListener('message', onMessage)
}

onUnmounted(() => {
  // listener self-removes on message received; nothing extra needed
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(email.value, password.value)
    } else {
      await auth.register(name.value, email.value, password.value)
    }
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h1>Shipping Calculator</h1>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Login</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Register</button>
      </div>

      <form @submit.prevent="submit">
        <div v-if="mode === 'register'" class="field">
          <label>Name</label>
          <input v-model="name" type="text" placeholder="Your name" required />
        </div>

        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="submit" :disabled="loading">
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register' }}
        </button>
      </form>

      <p class="oauth-hint">
        or
        <button class="google-btn" @click="openGooglePopup">Continue with Google</button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
}

h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 24px;
  text-align: center;
}

.tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: #64748b;
  transition: all 0.15s;
}

.tabs button.active {
  background: #fff;
  color: #1e293b;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.8rem;
  color: #475569;
}

.field input {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: #6366f1;
}

.error {
  font-size: 0.8rem;
  color: #ef4444;
  margin: 0;
}

.submit {
  padding: 10px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.submit:hover:not(:disabled) {
  background: #4f46e5;
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.oauth-hint {
  text-align: center;
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 16px 0 0;
}

.google-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
}

.google-btn:hover {
  text-decoration: underline;
}
</style>
