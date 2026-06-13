<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import AppFooter from '@/components/AppFooter.vue'
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
  <div class="page">
    <AppNav />

    <main class="main">
      <!-- Hero -->
      <section class="hero">
        <h1>Shipping Calculator</h1>
        <p>Estimate rates and delivery times for your shipment accurately and efficiently.</p>
      </section>

      <!-- Calculator form card -->
      <section class="form-card">
        <div class="form-grid">
          <LocationSelector
            label="Origin"
            icon="location_on"
            :saved-addresses="auth.isLoggedIn ? savedAddresses : undefined"
            @select="(v) => (origin = v)"
            @save="onSaveAddress"
          />
          <LocationSelector
            label="Destination"
            icon="local_shipping"
            :saved-addresses="auth.isLoggedIn ? savedAddresses : undefined"
            @select="(v) => (destination = v)"
            @save="onSaveAddress"
          />
        </div>

        <!-- Action row: weight + calculate (logged in) or login prompt -->
        <div class="action-row">
          <template v-if="auth.isLoggedIn">
            <div class="weight-field">
              <label class="field-label">Weight (grams)</label>
              <div class="weight-input">
                <input
                  v-model.number="weight"
                  type="number"
                  min="1"
                  placeholder="e.g. 1000"
                />
                <span class="unit">g</span>
              </div>
            </div>
            <button
              class="btn-calc"
              :disabled="!origin || !destination || !weight || loading"
              @click="calculate"
            >
              <span class="material-symbols-outlined">calculate</span>
              {{ loading ? 'Calculating…' : 'Calculate Rates' }}
            </button>
          </template>

          <div v-else class="login-prompt">
            <span class="material-symbols-outlined prompt-icon">lock</span>
            <span class="prompt-text">Login to calculate shipping costs</span>
            <button class="btn-login-google" @click="openGooglePopup">
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login with Google
            </button>
            <span class="prompt-or">or</span>
            <button class="btn-login-email" @click="router.push('/login')">Login with email</button>
          </div>
        </div>

        <div v-if="error" class="error-banner">
          <span class="material-symbols-outlined">error</span>
          {{ error }}
        </div>
      </section>

      <!-- Results -->
      <section v-if="result" class="results">
        <div class="results-meta">
          <h3 class="results-title">
            <span class="material-symbols-outlined">list_alt</span>
            Available Services
          </h3>
          <div class="route-pill">
            <span class="material-symbols-outlined">route</span>
            {{ result.origin }} → {{ result.destination }}
            <span class="pill-sep">•</span>
            {{ result.weight }}g
            <span v-if="result.fromCache" class="cached-badge">cached</span>
          </div>
        </div>

        <div class="results-actions">
          <button class="toggle-btn" @click="showAll = !showAll">
            {{ showAll ? 'Show regular only' : 'Show all services' }}
          </button>
        </div>

        <div class="couriers-grid">
          <div
            v-for="c in visibleCouriers(result.couriers)"
            :key="c.code + c.service"
            class="courier-card"
          >
            <div class="courier-top">
              <div class="courier-info">
                <p class="courier-name">{{ c.name }}</p>
                <p class="courier-desc">{{ c.description }}</p>
              </div>
              <span class="service-badge">{{ c.service }}</span>
            </div>
            <div class="courier-bottom">
              <div class="etd-row" v-if="c.etd">
                <span class="material-symbols-outlined">schedule</span>
                <span class="etd">{{ c.etd }}</span>
              </div>
              <p class="courier-cost">{{ formatCost(c.cost) }}</p>
            </div>
          </div>
        </div>
      </section>
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

.main {
  flex: 1;
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* Hero */
.hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.hero h1 {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
}
.hero p {
  font-size: 16px;
  line-height: 24px;
  color: var(--on-surface-variant);
  max-width: 480px;
}

/* Form card */
.form-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

/* Action row */
.action-row {
  padding-top: 20px;
  border-top: 1px solid var(--outline-variant);
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
  display: block;
  margin-bottom: 6px;
}
.weight-field {
  display: flex;
  flex-direction: column;
}
.weight-input {
  position: relative;
  display: flex;
  align-items: center;
}
.weight-input input {
  padding: 10px 36px 10px 12px;
  border: 1px solid var(--outline-variant);
  border-radius: 2px;
  background: var(--surface-container-lowest);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 16px;
  color: var(--on-surface);
  outline: none;
  width: 160px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.weight-input input:focus {
  border-color: var(--primary-container);
  box-shadow: 0 0 0 1px var(--primary-container);
}
.unit {
  position: absolute;
  right: 12px;
  font-size: 14px;
  color: var(--on-surface-variant);
  pointer-events: none;
}

.btn-calc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 32px;
  background: var(--primary-container);
  color: var(--on-primary);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(94, 106, 210, 0.25);
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.btn-calc .material-symbols-outlined { font-size: 20px; }
.btn-calc:hover:not(:disabled) { background: var(--primary); }
.btn-calc:active:not(:disabled) { transform: scale(0.98); }
.btn-calc:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

/* Login prompt */
.login-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--surface-container-low);
  border-radius: 4px;
  width: 100%;
}
.prompt-icon {
  font-size: 20px;
  color: var(--outline);
}
.prompt-text {
  font-size: 14px;
  color: var(--on-surface-variant);
  flex: 1;
}
.prompt-or {
  font-size: 13px;
  color: var(--outline);
}
.btn-login-google {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface);
  cursor: pointer;
  transition: background 0.15s;
}
.btn-login-google:hover { background: var(--surface-container); }
.btn-login-email {
  background: none;
  border: none;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-container);
  cursor: pointer;
  padding: 0;
}
.btn-login-email:hover { text-decoration: underline; }

/* Error */
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

/* Results section */
.results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.results-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--on-surface);
}
.results-title .material-symbols-outlined { color: var(--on-surface-variant); font-size: 22px; }

.route-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--surface-container-low);
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
}
.route-pill .material-symbols-outlined { font-size: 16px; }
.pill-sep { color: var(--outline); }
.cached-badge {
  padding: 2px 8px;
  background: #dcfce7;
  color: #15803d;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.results-actions { display: flex; justify-content: flex-end; }
.toggle-btn {
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-container);
  cursor: pointer;
  padding: 0;
}
.toggle-btn:hover { text-decoration: underline; }

/* Courier cards grid */
.couriers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.courier-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: default;
}
.courier-card:hover {
  border-color: var(--primary-container);
  box-shadow: 0 2px 8px rgba(94, 106, 210, 0.12);
}

.courier-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.courier-info { flex: 1; }
.courier-name {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 1.3;
}
.courier-desc {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin-top: 2px;
}
.service-badge {
  padding: 4px 8px;
  background: var(--surface-container-low);
  color: var(--on-primary-fixed-variant);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 2px;
  text-transform: uppercase;
  white-space: nowrap;
}

.courier-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed var(--surface-container);
}
.etd-row {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--on-surface-variant);
}
.etd-row .material-symbols-outlined { font-size: 16px; }
.etd {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
}
.courier-cost {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--primary-container);
}

/* Responsive */
@media (max-width: 768px) {
  .main { padding: 24px 16px; gap: 32px; }
  .form-grid { grid-template-columns: 1fr; gap: 24px; }
  .hero h1 { font-size: 24px; }
  .action-row { flex-direction: column; align-items: stretch; }
  .btn-calc { justify-content: center; }
  .weight-input input { width: 100%; }
}
</style>
