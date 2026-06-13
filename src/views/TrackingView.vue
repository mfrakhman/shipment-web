<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { trackingApi, type TrackResult, COURIERS } from '@/api/tracking'

const router = useRouter()
const auth = useAuthStore()

const awb = ref('')
const courier = ref('')
const lastPhone = ref('')

const result = ref<TrackResult | null>(null)
const loading = ref(false)
const error = ref('')


async function track() {
  if (!awb.value.trim() || !courier.value) return
  error.value = ''
  result.value = null
  loading.value = true
  try {
    result.value = await trackingApi.track(
      {
        awb: awb.value.trim(),
        courier: courier.value,
        lastPhoneNumber: lastPhone.value.trim() || undefined,
      },
      auth.token,
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Tracking failed'
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

function statusColor(status: string) {
  const s = status.toUpperCase()
  if (s.includes('DELIVERED') || s.includes('TERKIRIM')) return 'delivered'
  if (s.includes('RETURN')) return 'returned'
  return 'transit'
}
</script>

<template>
  <div class="page">
    <AppNav />

    <main class="main">
      <!-- Hero -->
      <section class="hero">
        <h1>Track Shipment</h1>
        <p>Enter your waybill number to get real-time delivery updates.</p>
      </section>

      <!-- Search card -->
      <section class="search-card">
        <div class="search-grid">
          <div class="field">
            <label for="awb">Waybill / Resi Number</label>
            <div class="input-wrap">
              <span class="material-symbols-outlined">barcode_scanner</span>
              <input
                id="awb"
                v-model="awb"
                type="text"
                placeholder="e.g. JD00000000000000000000"
                @keyup.enter="track"
              />
            </div>
          </div>

          <div class="field">
            <label for="courier">Courier</label>
            <div class="select-wrap">
              <span class="material-symbols-outlined">local_shipping</span>
              <select id="courier" v-model="courier">
                <option value="">Select courier</option>
                <option v-for="c in COURIERS" :key="c.code" :value="c.code">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="phone">Last 5 Digits of Recipient Phone <span class="optional-hint">(optional)</span></label>
            <div class="input-wrap">
              <span class="material-symbols-outlined">phone</span>
              <input
                id="phone"
                v-model="lastPhone"
                type="text"
                maxlength="5"
                placeholder="e.g. 12345"
                @keyup.enter="track"
              />
            </div>
          </div>
        </div>

        <div class="search-action">
          <div v-if="error" class="error-banner">
            <span class="material-symbols-outlined">error</span>
            {{ error }}
          </div>

          <template v-if="auth.isLoggedIn">
            <button class="btn-track" :disabled="!awb.trim() || !courier || loading" @click="track">
              <span class="material-symbols-outlined">{{ loading ? 'progress_activity' : 'search' }}</span>
              {{ loading ? 'Tracking…' : 'Track Shipment' }}
            </button>
          </template>

          <div v-else class="login-prompt">
            <span class="material-symbols-outlined prompt-icon">lock</span>
            <span class="prompt-text">Login to track shipments</span>
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
      </section>

      <!-- Result -->
      <template v-if="result">
        <!-- Status banner -->
        <div class="status-banner" :class="statusColor(result.summary.status)">
          <div class="status-left">
            <span class="material-symbols-outlined status-icon">
              {{ result.delivered ? 'check_circle' : 'local_shipping' }}
            </span>
            <div>
              <p class="status-label">{{ result.summary.status }}</p>
              <p class="status-sub">{{ result.summary.courierName }} · {{ result.summary.waybillNumber }}</p>
            </div>
          </div>
          <span class="delivered-badge" v-if="result.delivered">Delivered</span>
        </div>

        <div class="result-grid">
          <!-- Summary card -->
          <div class="info-card">
            <h3 class="card-title">
              <span class="material-symbols-outlined">info</span>
              Shipment Info
            </h3>
            <dl class="info-list">
              <div class="info-row">
                <dt>Service</dt>
                <dd>{{ result.summary.courierName }} <span class="badge">{{ result.summary.serviceCode }}</span></dd>
              </div>
              <div class="info-row">
                <dt>Waybill Date</dt>
                <dd>{{ result.summary.waybillDate || '—' }}</dd>
              </div>
              <div class="info-row">
                <dt>Origin</dt>
                <dd>{{ result.summary.origin || '—' }}</dd>
              </div>
              <div class="info-row">
                <dt>Destination</dt>
                <dd>{{ result.summary.destination || '—' }}</dd>
              </div>
              <div class="info-row">
                <dt>Shipper</dt>
                <dd>{{ result.summary.shipperName || '—' }}</dd>
              </div>
              <div class="info-row">
                <dt>Receiver</dt>
                <dd>{{ result.summary.receiverName || '—' }}</dd>
              </div>
              <template v-if="result.delivered && result.deliveryStatus.podReceiver">
                <div class="info-row">
                  <dt>Received by</dt>
                  <dd>{{ result.deliveryStatus.podReceiver }}</dd>
                </div>
                <div class="info-row">
                  <dt>Delivery time</dt>
                  <dd>{{ result.deliveryStatus.podDate }} {{ result.deliveryStatus.podTime }}</dd>
                </div>
              </template>
            </dl>
          </div>

          <!-- Manifest timeline -->
          <div class="manifest-card">
            <h3 class="card-title">
              <span class="material-symbols-outlined">timeline</span>
              Tracking History
              <span class="count-badge">{{ result.manifest.length }}</span>
            </h3>

            <div v-if="result.manifest.length === 0" class="no-manifest">
              <span class="material-symbols-outlined">history</span>
              No tracking events yet
            </div>

            <ol v-else class="manifest-list">
              <li
                v-for="(entry, i) in result.manifest"
                :key="i"
                class="manifest-entry"
                :class="{ latest: i === 0 }"
              >
                <div class="timeline-dot">
                  <span class="material-symbols-outlined">
                    {{ i === 0 ? 'radio_button_checked' : 'radio_button_unchecked' }}
                  </span>
                </div>
                <div class="entry-content">
                  <p class="entry-desc">{{ entry.description }}</p>
                  <div class="entry-meta">
                    <span v-if="entry.cityName" class="entry-city">
                      <span class="material-symbols-outlined">location_on</span>
                      {{ entry.cityName }}
                    </span>
                    <span class="entry-time">{{ entry.date }} {{ entry.time }}</span>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </template>
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
  gap: 32px;
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
  letter-spacing: -0.02em;
  color: var(--on-surface);
}
.hero p {
  font-size: 16px;
  color: var(--on-surface-variant);
}

/* Search card */
.search-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: opacity 0.2s;
}

.field label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
}
.required-hint { color: var(--error); font-weight: 700; }
.optional-hint { color: var(--outline); }

.input-wrap, .select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrap .material-symbols-outlined,
.select-wrap .material-symbols-outlined {
  position: absolute;
  left: 12px;
  font-size: 20px;
  color: var(--outline);
  pointer-events: none;
  transition: color 0.15s;
}
.input-wrap:focus-within .material-symbols-outlined,
.select-wrap:focus-within .material-symbols-outlined {
  color: var(--primary-container);
}
.input-wrap input,
.select-wrap select {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid var(--outline-variant);
  border-radius: 2px;
  background: var(--surface-container-lowest);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  color: var(--on-surface);
  outline: none;
  appearance: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-wrap input:focus,
.select-wrap select:focus {
  border-color: var(--primary-container);
  box-shadow: 0 0 0 1px var(--primary-container);
}

.search-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

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
.prompt-icon { font-size: 20px; color: var(--outline); }
.prompt-text { font-size: 14px; color: var(--on-surface-variant); flex: 1; }
.prompt-or { font-size: 13px; color: var(--outline); }
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

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--error-container);
  border-radius: 4px;
  font-size: 13px;
  color: #93000a;
  flex: 1;
}
.error-banner .material-symbols-outlined { font-size: 18px; color: var(--error); }

.btn-track {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
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
  margin-left: auto;
}
.btn-track .material-symbols-outlined { font-size: 20px; }
.btn-track:hover:not(:disabled) { background: var(--primary); }
.btn-track:active:not(:disabled) { transform: scale(0.98); }
.btn-track:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

/* Status banner */
.status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-radius: 8px;
  border: 1px solid;
  gap: 16px;
}
.status-banner.delivered {
  background: #f0fdf4;
  border-color: #86efac;
}
.status-banner.transit {
  background: #eff6ff;
  border-color: var(--primary-fixed-dim);
}
.status-banner.returned {
  background: #fff7ed;
  border-color: #fdba74;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.status-icon {
  font-size: 36px;
}
.delivered .status-icon { color: #16a34a; }
.transit .status-icon { color: var(--primary); }
.returned .status-icon { color: #ea580c; }

.status-label {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--on-surface);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.status-sub {
  font-size: 13px;
  color: var(--on-surface-variant);
  margin-top: 2px;
}

.delivered-badge {
  padding: 6px 16px;
  background: #16a34a;
  color: #fff;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* Result grid */
.result-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}

/* Info card */
.info-card, .manifest-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  padding: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--on-surface);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--outline-variant);
}
.card-title .material-symbols-outlined {
  font-size: 20px;
  color: var(--primary-container);
}

.count-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: var(--surface-container);
  color: var(--on-surface-variant);
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.info-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--surface-container);
  font-size: 14px;
}
.info-row:last-child { border-bottom: none; }
dt {
  color: var(--on-surface-variant);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding-top: 1px;
}
dd {
  color: var(--on-surface);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge {
  padding: 2px 7px;
  background: var(--primary-fixed);
  color: var(--on-primary-fixed-variant);
  border-radius: 2px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Manifest timeline */
.no-manifest {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 32px;
  color: var(--outline);
  font-size: 14px;
}
.no-manifest .material-symbols-outlined { font-size: 24px; }

.manifest-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.manifest-entry {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  position: relative;
}
.manifest-entry:last-child { padding-bottom: 0; }

.timeline-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.timeline-dot .material-symbols-outlined {
  font-size: 18px;
  color: var(--outline);
  position: relative;
  z-index: 1;
}
.manifest-entry.latest .timeline-dot .material-symbols-outlined {
  color: var(--primary-container);
}
.manifest-entry:not(:last-child) .timeline-dot::after {
  content: '';
  position: absolute;
  top: 18px;
  left: 9px;
  width: 1px;
  height: calc(100% - 18px);
  background: var(--outline-variant);
}

.entry-content { flex: 1; padding-top: 1px; }
.entry-desc {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
  line-height: 1.4;
}
.manifest-entry.latest .entry-desc { font-weight: 600; }

.entry-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.entry-city {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--primary-container);
}
.entry-city .material-symbols-outlined { font-size: 13px; }
.entry-time {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--outline);
}

/* Responsive */
@media (max-width: 900px) {
  .search-grid { grid-template-columns: 1fr 1fr; }
  .result-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .main { padding: 24px 16px; }
  .search-grid { grid-template-columns: 1fr; }
  .search-action { flex-direction: column; align-items: stretch; }
  .btn-track { margin-left: 0; justify-content: center; }
}
</style>
