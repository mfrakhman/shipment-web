<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

function logout() {
  auth.logout()
  router.push('/login')
}

</script>

<template>
  <nav class="nav">
    <div class="inner">
      <div class="left">
        <a class="brand" href="/" @click.prevent="router.push('/')">
          <span class="material-symbols-outlined">local_shipping</span>
          LogiTrack
        </a>
        <div class="links">
          <a :class="{ active: route.path === '/' }" href="/" @click.prevent="router.push('/')">Shipments</a>
          <a :class="{ active: route.path === '/tracking' }" href="/tracking" @click.prevent="router.push('/tracking')">Track</a>
          <a
            v-if="auth.isLoggedIn"
            :class="{ active: route.path === '/history' }"
            href="/history"
            @click.prevent="router.push('/history')"
          >History</a>
        </div>
      </div>
      <div class="right">
        <template v-if="auth.isLoggedIn">
          <span class="username">{{ auth.user?.name }}</span>
          <button class="btn-outline" @click="logout">Logout</button>
        </template>
        <template v-else>
          <button class="btn-outline" @click="router.push('/login')">Login</button>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  background: var(--surface-container-lowest);
  border-bottom: 1px solid var(--outline-variant);
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
}
.inner {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.left {
  display: flex;
  align-items: center;
  gap: 32px;
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
  white-space: nowrap;
}
.brand .material-symbols-outlined { font-size: 28px; }
.links {
  display: flex;
  gap: 4px;
}
.links a {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 15px;
  color: var(--on-surface-variant);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  border-bottom: 2px solid transparent;
}
.links a:hover {
  color: var(--primary);
  background: var(--surface-container-low);
}
.links a.active {
  color: var(--primary);
  font-weight: 700;
  border-bottom-color: var(--primary);
  border-radius: 4px 4px 0 0;
}
.right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.username {
  font-size: 14px;
  color: var(--on-surface-variant);
}
.btn-outline {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  background: none;
  border: 1px solid var(--outline-variant);
  border-radius: 6px;
  padding: 6px 16px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.btn-outline:hover {
  background: var(--surface-container-low);
  border-color: var(--primary);
}
</style>
