<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const menuOpen = ref(false)

watch(() => route.path, () => { menuOpen.value = false })

function logout() {
  auth.logout()
  router.push('/login')
}

function navigate(path: string) {
  menuOpen.value = false
  router.push(path)
}
</script>

<template>
  <nav class="nav">
    <div class="inner">
      <a class="brand" href="/" @click.prevent="navigate('/')">
        <span class="material-symbols-outlined">local_shipping</span>
        LogiTrack
      </a>

      <!-- Desktop links -->
      <div class="links desktop">
        <a :class="{ active: route.path === '/' }" href="/" @click.prevent="navigate('/')">Shipments</a>
        <a :class="{ active: route.path === '/tracking' }" href="/tracking" @click.prevent="navigate('/tracking')">Track</a>
        <a v-if="auth.isLoggedIn" :class="{ active: route.path === '/history' }" href="/history" @click.prevent="navigate('/history')">History</a>
      </div>

      <!-- Desktop right -->
      <div class="right desktop">
        <template v-if="auth.isLoggedIn">
          <span class="username">{{ auth.user?.name }}</span>
          <button class="btn-outline" @click="logout">Logout</button>
        </template>
        <template v-else>
          <button class="btn-outline" @click="navigate('/login')">Login</button>
        </template>
      </div>

      <!-- Hamburger -->
      <button class="hamburger mobile" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
        <span class="material-symbols-outlined">{{ menuOpen ? 'close' : 'menu' }}</span>
      </button>
    </div>

    <!-- Mobile dropdown -->
    <div class="dropdown mobile" :class="{ open: menuOpen }">
      <a :class="{ active: route.path === '/' }" href="/" @click.prevent="navigate('/')">Shipments</a>
      <a :class="{ active: route.path === '/tracking' }" href="/tracking" @click.prevent="navigate('/tracking')">Track</a>
      <a v-if="auth.isLoggedIn" :class="{ active: route.path === '/history' }" href="/history" @click.prevent="navigate('/history')">History</a>
      <div class="dropdown-divider"></div>
      <template v-if="auth.isLoggedIn">
        <span class="dropdown-user">{{ auth.user?.name }}</span>
        <button class="btn-outline" @click="logout">Logout</button>
      </template>
      <template v-else>
        <button class="btn-outline" @click="navigate('/login')">Login</button>
      </template>
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
.links a:hover { color: var(--primary); background: var(--surface-container-low); }
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
.btn-outline:hover { background: var(--surface-container-low); border-color: var(--primary); }

/* Hamburger */
.hamburger {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--on-surface);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}
.hamburger:hover { background: var(--surface-container-low); }
.hamburger .material-symbols-outlined { font-size: 26px; }

/* Dropdown */
.dropdown {
  background: var(--surface-container-lowest);
  border-top: 1px solid var(--outline-variant);
  display: flex;
  flex-direction: column;
  padding: 8px 24px 16px;
  gap: 4px;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.25s ease, opacity 0.2s ease;
}
.dropdown.open {
  max-height: 400px;
  opacity: 1;
}
.dropdown a {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 16px;
  color: var(--on-surface-variant);
  text-decoration: none;
  padding: 12px 8px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.dropdown a:hover { color: var(--primary); background: var(--surface-container-low); }
.dropdown a.active { color: var(--primary); font-weight: 700; }
.dropdown-divider {
  height: 1px;
  background: var(--outline-variant);
  margin: 8px 0;
}
.dropdown-user {
  font-size: 14px;
  color: var(--on-surface-variant);
  padding: 4px 8px;
}
.dropdown .btn-outline {
  width: 100%;
  padding: 10px 16px;
  margin-top: 4px;
}

/* Responsive */
.desktop { display: flex; }
.mobile { display: none; }

@media (max-width: 768px) {
  .desktop { display: none !important; }
  .mobile { display: flex; }
}
</style>
