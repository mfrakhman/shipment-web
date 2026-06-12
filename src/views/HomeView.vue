<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LocationSelector from '@/components/LocationSelector.vue'
import { useAuthStore } from '@/stores/auth'
import { shippingApi, type CostResult } from '@/api/shipping'
import { addressApi, type SavedAddress, type SavedAddressRequest } from '@/api/address'

const router = useRouter()
const auth = useAuthStore()

const savedAddresses = ref<SavedAddress[]>([])

async function fetchAddresses() {
  if (!auth.isLoggedIn) return
  try { savedAddresses.value = await addressApi.getAll(auth.token) } catch {}
}

watch(() => auth.isLoggedIn, (loggedIn) => { if (loggedIn) fetchAddresses() }, { immediate: true })

async function onSaveAddress(req: Omit<SavedAddress, 'id'>) {
  try {
    const saved = await addressApi.save(req as SavedAddressRequest, auth.token)
    savedAddresses.value.unshift(saved)
  } catch {}
}

const origin = ref<{ id: string; label: string; street?: string } | null>(null)
const destination = ref<{ id: string; label: string; street?: string } | null>(null)
const weight = ref<number | null>(null)

const result = ref<CostResult | null>(null)
const loading = ref(false)
const error = ref('')
const showAll = ref(false)

const CARGO_PATTERNS = /^(JTR|T\d+|TRC|GOKIL|POS KARGO|SPS)/i

function visibleCouriers(couriers: CostResult['couriers']) {
  if (showAll.value) return couriers
  return couriers.filter((c) => !CARGO_PATTERNS.test(c.service))
}

async function calculate() {
  if (!origin.value || !destination.value || !weight.value) return
  error.value = ''
  result.value = null
  loading.value = true
  try {
    result.value = await shippingApi.calculateCost(
      {
        originId: Number(origin.value.id),
        originLabel: origin.value.label,
        originStreet: origin.value.street,
        destinationId: Number(destination.value.id),
        destinationLabel: destination.value.label,
        destinationStreet: destination.value.street,
        weight: weight.value,
      },
      auth.token,
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to calculate cost'
  } finally {
    loading.value = false
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}

function openGooglePopup() {
  const popup = window.open('/api/auth/oauth/google', 'google-oauth', 'width=500,height=620,left=400,top=100')
  if (!popup) return
  function onMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return
    if (event.data?.type === 'oauth_success') auth.setFromToken(event.data.token)
    window.removeEventListener('message', onMessage)
  }
  window.addEventListener('message', onMessage)
}

function formatCost(cost: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cost)
}
</script>

<template>
  <main>
    <header>
      <h1>Shipping Calculator</h1>
      <div class="user-info">
        <template v-if="auth.isLoggedIn">
          <span>{{ auth.user?.name }}</span>
          <button @click="router.push('/history')" class="history-btn">History</button>
          <button @click="logout" class="logout-btn">Logout</button>
        </template>
        <button v-else @click="openGooglePopup" class="history-btn">Login</button>
      </div>
    </header>

    <div class="selectors">
      <LocationSelector
        label="Origin"
        :saved-addresses="auth.isLoggedIn ? savedAddresses : undefined"
        @select="(v) => (origin = v)"
        @save="onSaveAddress"
      />
      <LocationSelector
        label="Destination"
        :saved-addresses="auth.isLoggedIn ? savedAddresses : undefined"
        @select="(v) => (destination = v)"
        @save="onSaveAddress"
      />
    </div>

    <div v-if="auth.isLoggedIn" class="weight-row">
      <div class="weight-field">
        <label>Weight (grams)</label>
        <input v-model.number="weight" type="number" min="1" placeholder="e.g. 1000" />
      </div>
      <button
        class="calc-btn"
        :disabled="!origin || !destination || !weight || loading"
        @click="calculate"
      >
        {{ loading ? 'Calculating...' : 'Calculate' }}
      </button>
    </div>

    <div v-else class="login-prompt">
      <span>Login to calculate shipping cost</span>
      <button class="login-link" @click="openGooglePopup">Login with Google</button>
      <button class="login-link" @click="router.push('/login')">Login with email</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <section v-if="result" class="results">
      <div class="results-header">
        <span>{{ result.origin }} → {{ result.destination }}</span>
        <span class="weight-badge">{{ result.weight }}g</span>
        <span v-if="result.fromCache" class="cache-badge">cached</span>
      </div>

      <div class="results-footer">
        <button class="toggle-btn" @click="showAll = !showAll">
          {{ showAll ? 'Show regular only' : 'Show all services' }}
        </button>
      </div>

      <div class="couriers">
        <div v-for="c in visibleCouriers(result.couriers)" :key="c.code + c.service" class="courier-card">
          <div class="courier-top">
            <span class="courier-name">{{ c.name }}</span>
            <span class="courier-cost">{{ formatCost(c.cost) }}</span>
          </div>
          <div class="courier-bottom">
            <span class="service-tag">{{ c.service }}</span>
            <span class="description">{{ c.description }}</span>
            <span v-if="c.etd" class="etd">{{ c.etd }}</span>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
main {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  color: #475569;
}

.history-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  color: #6366f1;
  transition: all 0.15s;
}

.history-btn:hover {
  border-color: #6366f1;
}

.logout-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s;
}

.logout-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.selectors {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.weight-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.weight-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  max-width: 200px;
}

.weight-field label {
  font-size: 0.8rem;
  color: #475569;
}

.weight-field input {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}

.weight-field input:focus {
  border-color: #6366f1;
}

.calc-btn {
  padding: 9px 24px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.calc-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.calc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
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

.error {
  font-size: 0.875rem;
  color: #ef4444;
  margin: 0 0 16px;
}

.results {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  font-weight: 600;
}

.weight-badge,
.cache-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.weight-badge {
  background: #e0e7ff;
  color: #4338ca;
}

.cache-badge {
  background: #dcfce7;
  color: #16a34a;
}

.results-footer {
  padding: 8px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  color: #6366f1;
  cursor: pointer;
  padding: 0;
}

.toggle-btn:hover {
  text-decoration: underline;
}

.couriers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1px;
  background: #e2e8f0;
}

.courier-card {
  background: #fff;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.courier-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.courier-name {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.3;
}

.courier-cost {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e293b;
  white-space: nowrap;
}

.courier-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.service-tag {
  padding: 2px 7px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
}

.description {
  font-size: 0.75rem;
  color: #94a3b8;
}

.etd {
  margin-left: auto;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
