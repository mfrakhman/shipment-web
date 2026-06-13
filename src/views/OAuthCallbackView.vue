<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(() => {
  const token = route.query.token as string

  if (window.opener) {
    if (token) {
      window.opener.postMessage({ type: 'oauth_success', token }, window.location.origin)
    } else {
      window.opener.postMessage({ type: 'oauth_error' }, window.location.origin)
    }
    window.close()
    return
  }

  // fallback: opened directly (not as popup)
  if (!token) { router.replace('/login?error=oauth_failed'); return }
  auth.setFromToken(token)
  router.replace('/')
})
</script>

<template>
  <div class="callback">
    <p>Signing you in...</p>
  </div>
</template>

<style scoped>
.callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--surface);
  color: var(--on-surface-variant);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 15px;
}
</style>
