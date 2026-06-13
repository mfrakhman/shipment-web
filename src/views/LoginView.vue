<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppFooter from '@/components/AppFooter.vue'

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
  const popup = window.open('/api/auth/oauth/google', 'google-oauth', 'width=500,height=620,left=400,top=100')
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
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="/" @click.prevent="router.push('/')">
          <span class="material-symbols-outlined">local_shipping</span>
          LogiTrack
        </a>
      </div>
    </header>

    <main class="main">
      <div class="card-wrapper">
        <div class="blur-1" aria-hidden="true"></div>
        <div class="blur-2" aria-hidden="true"></div>

        <div class="card">
          <div class="tabs">
            <button :class="{ active: mode === 'login' }" @click="mode = 'login'">LOGIN</button>
            <button :class="{ active: mode === 'register' }" @click="mode = 'register'">REGISTER</button>
          </div>

          <div class="identity">
            <h1>{{ mode === 'login' ? 'Welcome back' : 'Create an account' }}</h1>
            <p>{{ mode === 'login'
              ? 'Log in to manage your shipments and track logistics in real-time.'
              : 'Join LogiTrack to streamline your logistics operations today.' }}</p>
          </div>

          <form @submit.prevent="submit">
            <div v-if="mode === 'register'" class="field">
              <label for="name">Full Name</label>
              <div class="input-wrap">
                <span class="material-symbols-outlined">person</span>
                <input id="name" v-model="name" type="text" placeholder="Your name" required />
              </div>
            </div>

            <div class="field">
              <label for="email">Email Address</label>
              <div class="input-wrap">
                <span class="material-symbols-outlined">mail</span>
                <input id="email" v-model="email" type="email" placeholder="name@company.com" required />
              </div>
            </div>

            <div class="field">
              <div class="field-header">
                <label for="password">Password</label>
                <a v-if="mode === 'login'" class="forgot" href="#">Forgot Password?</a>
              </div>
              <div class="input-wrap">
                <span class="material-symbols-outlined">lock</span>
                <input id="password" v-model="password" type="password" placeholder="••••••••" required />
              </div>
            </div>

            <div v-if="error" class="error-banner">
              <span class="material-symbols-outlined">error</span>
              {{ error }}
            </div>

            <button type="submit" class="btn-submit" :disabled="loading">
              {{ loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register' }}
            </button>
          </form>

          <div class="divider"><span>OR CONTINUE WITH</span></div>

          <button class="btn-google" type="button" @click="openGooglePopup">
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>SIGN IN WITH GOOGLE</span>
          </button>
        </div>

        <p class="terms">
          By logging in, you agree to our
          <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

/* Header */
.header {
  background: var(--surface-container-lowest);
  border-bottom: 1px solid var(--outline-variant);
  height: 64px;
  display: flex;
  align-items: center;
}
.header-inner {
  max-width: 1140px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
  text-decoration: none;
  letter-spacing: -0.02em;
}
.brand .material-symbols-outlined { font-size: 28px; }

/* Main / Card */
.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}
.card-wrapper {
  position: relative;
  width: 100%;
  max-width: 440px;
}
.blur-1 {
  position: absolute;
  top: -48px;
  left: -48px;
  width: 192px;
  height: 192px;
  background: rgba(189, 194, 255, 0.2);
  border-radius: 50%;
  filter: blur(48px);
  pointer-events: none;
}
.blur-2 {
  position: absolute;
  bottom: -48px;
  right: -48px;
  width: 192px;
  height: 192px;
  background: rgba(222, 224, 255, 0.3);
  border-radius: 50%;
  filter: blur(48px);
  pointer-events: none;
}
.card {
  position: relative;
  z-index: 1;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(94, 106, 210, 0.15);
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--outline-variant);
  margin-bottom: 32px;
}
.tabs button {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.tabs button.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.tabs button:hover:not(.active) { color: var(--primary); }

/* Identity */
.identity { margin-bottom: 32px; }
.identity h1 {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin-bottom: 8px;
}
.identity p {
  font-size: 14px;
  line-height: 20px;
  color: var(--on-surface-variant);
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
}
.forgot {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
}
.forgot:hover { text-decoration: underline; }

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrap .material-symbols-outlined {
  position: absolute;
  left: 16px;
  font-size: 20px;
  color: var(--outline);
  pointer-events: none;
  transition: color 0.15s;
}
.input-wrap:focus-within .material-symbols-outlined { color: var(--primary); }
.input-wrap input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  background: var(--surface);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  color: var(--on-surface);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-wrap input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(68, 80, 183, 0.12);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--error-container);
  border-radius: 4px;
  font-size: 13px;
  color: #93000a;
}
.error-banner .material-symbols-outlined { font-size: 18px; color: var(--error); }

.btn-submit {
  width: 100%;
  padding: 16px;
  background: var(--primary-container);
  color: var(--on-primary);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(94, 106, 210, 0.25);
  transition: background 0.15s, transform 0.1s;
}
.btn-submit:hover:not(:disabled) { background: var(--primary); }
.btn-submit:active:not(:disabled) { transform: scale(0.98); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* Divider */
.divider {
  position: relative;
  margin: 8px 0;
  text-align: center;
}
.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--outline-variant);
}
.divider span {
  position: relative;
  background: var(--surface-container-lowest);
  padding: 0 16px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
  letter-spacing: 0.03em;
}

/* Google button */
.btn-google {
  width: 100%;
  padding: 14px 16px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.btn-google:hover { background: var(--surface-container); }
.btn-google:active { transform: scale(0.98); }
.btn-google span {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--on-surface);
}

/* Footer terms */
.terms {
  text-align: center;
  font-size: 14px;
  color: var(--on-surface-variant);
  margin-top: 24px;
}
.terms a { color: var(--primary); text-decoration: none; }
.terms a:hover { text-decoration: underline; }
</style>
