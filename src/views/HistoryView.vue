<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { shippingApi, type HistoryItem, type CostResult } from '@/api/shipping'

const router = useRouter()
const auth = useAuthStore()

const history = ref<HistoryItem[]>([])
const expanded = ref<Record<string, CostResult | null>>({})
const loadingList = ref(true)
const loadingDetail = ref<Record<string, boolean>>({})
const error = ref('')

onMounted(async () => {
  if (!auth.isLoggedIn) { loadingList.value = false; return }
  try {
    history.value = await shippingApi.getHistory(auth.token)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load history'
  } finally {
    loadingList.value = false
  }
})

async function toggle(item: HistoryItem) {
  if (item.id in expanded.value) {
    delete expanded.value[item.id]
    return
  }
  loadingDetail.value[item.id] = true
  try {
    expanded.value[item.id] = await shippingApi.getHistoryById(item.id, auth.token)
  } finally {
    delete loadingDetail.value[item.id]
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function formatCost(cost: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(cost)
}

const CARGO_PATTERNS = /^(JTR|T\d+|TRC|GOKIL|POS KARGO|SPS)/i
</script>

<template>
  <main>
    <header>
      <button class="back-btn" @click="router.push('/')">← Back</button>
      <h1>Calculation History</h1>
    </header>

    <div v-if="!auth.isLoggedIn" class="login-prompt">
      <span>Login to view your calculation history</span>
      <button class="login-link" @click="router.push('/login')">Login / Register</button>
    </div>

    <p v-else-if="loadingList" class="state-msg">Loading...</p>
    <p v-else-if="error" class="state-msg error">{{ error }}</p>
    <p v-else-if="history.length === 0" class="state-msg">No history yet.</p>

    <div v-else-if="auth.isLoggedIn" class="list">
      <div v-for="item in history" :key="item.id" class="item">
        <button class="item-header" @click="toggle(item)">
          <div class="item-info">
            <span class="route">{{ item.origin }} → {{ item.destination }}</span>
            <span class="meta">{{ item.weight }}g · {{ formatDate(item.createdAt) }}</span>
          </div>
          <span class="chevron" :class="{ open: item.id in expanded }">›</span>
        </button>

        <div v-if="loadingDetail[item.id]" class="detail-loading">Loading...</div>

        <div v-if="expanded[item.id]" class="couriers">
          <div
            v-for="c in expanded[item.id]!.couriers.filter((c) => !CARGO_PATTERNS.test(c.service))"
            :key="c.code + c.service"
            class="courier-row"
          >
            <span class="courier-name">{{ c.name }}</span>
            <span class="service-tag">{{ c.service }}</span>
            <span class="etd">{{ c.etd || '—' }}</span>
            <span class="cost">{{ formatCost(c.cost) }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px;
}

header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.back-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #64748b;
}

.back-btn:hover {
  border-color: #94a3b8;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #64748b;
}

.login-link {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.login-link:hover {
  text-decoration: underline;
}

.state-msg {
  color: #94a3b8;
  font-size: 0.875rem;
}

.state-msg.error {
  color: #ef4444;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.item-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.item-header:hover {
  background: #f8fafc;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.route {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.chevron {
  font-size: 1.2rem;
  color: #94a3b8;
  transition: transform 0.2s;
  transform: rotate(0deg);
}

.chevron.open {
  transform: rotate(90deg);
}

.detail-loading {
  padding: 12px 16px;
  font-size: 0.8rem;
  color: #94a3b8;
  background: #f8fafc;
}

.couriers {
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.courier-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8rem;
}

.courier-row:last-child {
  border-bottom: none;
}

.courier-name {
  color: #475569;
}

.service-tag {
  padding: 2px 7px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.etd {
  color: #94a3b8;
  min-width: 50px;
  text-align: right;
}

.cost {
  font-weight: 700;
  color: #1e293b;
  min-width: 90px;
  text-align: right;
}
</style>
