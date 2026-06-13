<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { shippingApi, type HistoryItem, type CostResult } from '@/api/shipping'
import { trackingApi, type TrackingHistoryItem } from '@/api/tracking'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref<'calculations' | 'tracking'>('calculations')

// Calculation history
const calcHistory = ref<HistoryItem[]>([])
const expanded = ref<Record<string, CostResult | null>>({})
const loadingCalc = ref(true)
const loadingDetail = ref<Record<string, boolean>>({})
const calcError = ref('')

// Tracking history
const trackHistory = ref<TrackingHistoryItem[]>([])
const trackExpanded = ref<Set<string>>(new Set())
const loadingTrack = ref(true)
const trackError = ref('')

const CARGO_PATTERNS = /^(JTR|T\d+|TRC|GOKIL|POS KARGO|SPS)/i

onMounted(async () => {
  if (!auth.isLoggedIn) {
    loadingCalc.value = false
    loadingTrack.value = false
    return
  }
  fetchCalcHistory()
  fetchTrackHistory()
})

async function fetchCalcHistory() {
  try {
    calcHistory.value = await shippingApi.getHistory(auth.token)
  } catch (e) {
    calcError.value = e instanceof Error ? e.message : 'Failed to load history'
  } finally {
    loadingCalc.value = false
  }
}

async function fetchTrackHistory() {
  try {
    trackHistory.value = await trackingApi.getHistory(auth.token)
  } catch (e) {
    trackError.value = e instanceof Error ? e.message : 'Failed to load tracking history'
  } finally {
    loadingTrack.value = false
  }
}

async function toggleCalc(item: HistoryItem) {
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

function toggleTrack(id: string) {
  if (trackExpanded.value.has(id)) trackExpanded.value.delete(id)
  else trackExpanded.value.add(id)
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
      <div class="page-header">
        <h1>History</h1>
        <p>Your past calculations and tracked shipments</p>
      </div>

      <!-- Not logged in -->
      <div v-if="!auth.isLoggedIn" class="state-card">
        <span class="material-symbols-outlined state-icon">lock</span>
        <p class="state-title">Login required</p>
        <p class="state-desc">Login to view your history</p>
        <button class="btn-primary" @click="router.push('/login')">Login / Register</button>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div class="tabs">
          <button :class="{ active: activeTab === 'calculations' }" @click="activeTab = 'calculations'">
            <span class="material-symbols-outlined">calculate</span>
            Calculations
          </button>
          <button :class="{ active: activeTab === 'tracking' }" @click="activeTab = 'tracking'">
            <span class="material-symbols-outlined">local_shipping</span>
            Tracking
          </button>
        </div>

        <!-- ── Calculation History ── -->
        <div v-show="activeTab === 'calculations'">
          <div v-if="loadingCalc" class="state-card">
            <span class="material-symbols-outlined state-icon spin">progress_activity</span>
            <p class="state-title">Loading…</p>
          </div>
          <div v-else-if="calcError" class="state-card error">
            <span class="material-symbols-outlined state-icon">error</span>
            <p class="state-title">{{ calcError }}</p>
          </div>
          <div v-else-if="calcHistory.length === 0" class="state-card">
            <span class="material-symbols-outlined state-icon">calculate</span>
            <p class="state-title">No calculations yet</p>
            <p class="state-desc">Your shipping cost calculations will appear here</p>
            <button class="btn-primary" @click="router.push('/')">Calculate a shipment</button>
          </div>
          <div v-else class="history-list">
            <div v-for="item in calcHistory" :key="item.id" class="history-item">
              <button class="item-header" @click="toggleCalc(item)">
                <div class="item-left">
                  <span class="material-symbols-outlined item-icon calc-icon">calculate</span>
                  <div class="item-info">
                    <span class="route">{{ item.origin }} → {{ item.destination }}</span>
                    <span class="meta">{{ item.weight }}g · {{ formatDate(item.createdAt) }}</span>
                  </div>
                </div>
                <span class="chevron material-symbols-outlined" :class="{ open: item.id in expanded }">
                  chevron_right
                </span>
              </button>

              <div v-if="loadingDetail[item.id]" class="detail-loading">
                <span class="material-symbols-outlined spin">progress_activity</span>
                Loading…
              </div>

              <div v-if="expanded[item.id]" class="courier-table">
                <div
                  v-for="c in expanded[item.id]!.couriers.filter((c) => !CARGO_PATTERNS.test(c.service))"
                  :key="c.code + c.service"
                  class="courier-row"
                >
                  <span class="c-name">{{ c.name }}</span>
                  <span class="c-badge">{{ c.service }}</span>
                  <span class="c-etd">{{ c.etd || '—' }}</span>
                  <span class="c-cost">{{ formatCost(c.cost) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Tracking History ── -->
        <div v-show="activeTab === 'tracking'">
          <div v-if="loadingTrack" class="state-card">
            <span class="material-symbols-outlined state-icon spin">progress_activity</span>
            <p class="state-title">Loading…</p>
          </div>
          <div v-else-if="trackError" class="state-card error">
            <span class="material-symbols-outlined state-icon">error</span>
            <p class="state-title">{{ trackError }}</p>
          </div>
          <div v-else-if="trackHistory.length === 0" class="state-card">
            <span class="material-symbols-outlined state-icon">local_shipping</span>
            <p class="state-title">No tracked shipments yet</p>
            <p class="state-desc">Shipments you track will appear here</p>
            <button class="btn-primary" @click="router.push('/tracking')">Track a shipment</button>
          </div>
          <div v-else class="history-list">
            <div v-for="item in trackHistory" :key="item.id" class="history-item">
              <button class="item-header" @click="toggleTrack(item.id)">
                <div class="item-left">
                  <span class="material-symbols-outlined item-icon track-icon">
                    {{ item.delivered ? 'check_circle' : 'local_shipping' }}
                  </span>
                  <div class="item-info">
                    <span class="route">{{ item.awb }}</span>
                    <span class="meta">{{ item.courierName || item.courier }}</span>
                  </div>
                </div>
                <div class="item-right">
                  <span class="status-chip" :class="statusColor(item.status)">{{ item.status || 'Unknown' }}</span>
                  <span class="meta date-meta">{{ formatDate(item.createdAt) }}</span>
                  <span class="chevron material-symbols-outlined" :class="{ open: trackExpanded.has(item.id) }">
                    chevron_right
                  </span>
                </div>
              </button>

              <div v-if="trackExpanded.has(item.id)" class="manifest-panel">
                <div v-if="item.manifest.length === 0" class="no-manifest">
                  No tracking events
                </div>
                <ol v-else class="manifest-list">
                  <li
                    v-for="(entry, i) in item.manifest"
                    :key="i"
                    class="manifest-entry"
                    :class="{ latest: i === 0 }"
                  >
                    <div class="dot-col">
                      <span class="material-symbols-outlined dot-icon">
                        {{ i === 0 ? 'radio_button_checked' : 'radio_button_unchecked' }}
                      </span>
                    </div>
                    <div class="entry-body">
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
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h1 {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--on-surface);
  margin-bottom: 4px;
}
.page-header p {
  font-size: 14px;
  color: var(--on-surface-variant);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--outline-variant);
  padding-bottom: 0;
}
.tabs button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  border-radius: 4px 4px 0 0;
}
.tabs button .material-symbols-outlined { font-size: 18px; }
.tabs button:hover { color: var(--primary); background: var(--surface-container-low); }
.tabs button.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* State cards */
.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 24px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  text-align: center;
}
.state-card.error { border-color: var(--error); }
.state-icon { font-size: 40px; color: var(--outline); }
.state-card.error .state-icon { color: var(--error); }
.state-title {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--on-surface);
}
.state-desc { font-size: 14px; color: var(--on-surface-variant); }
.btn-primary {
  margin-top: 4px;
  padding: 10px 24px;
  background: var(--primary-container);
  color: var(--on-primary);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: var(--primary); }

/* History list */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.history-item:has(.item-header:hover) { border-color: var(--primary-container); }

.item-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  gap: 12px;
}
.item-header:hover { background: var(--surface-container-low); }

.item-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}
.item-icon { font-size: 22px; }
.calc-icon { color: var(--primary-container); }
.track-icon { color: var(--secondary); }

.item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.route {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--outline);
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.date-meta { white-space: nowrap; }

.status-chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.status-chip.delivered { background: #dcfce7; color: #15803d; }
.status-chip.transit { background: var(--primary-fixed); color: var(--on-primary-fixed-variant); }
.status-chip.returned { background: #ffedd5; color: #c2410c; }

.chevron {
  font-size: 22px;
  color: var(--outline);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.chevron.open { transform: rotate(90deg); }

/* Loading row */
.detail-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 13px;
  color: var(--outline);
  border-top: 1px solid var(--outline-variant);
  background: var(--surface-container-low);
}

/* Calculation courier table */
.courier-table {
  border-top: 1px solid var(--outline-variant);
  background: var(--surface-container-low);
}
.courier-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--outline-variant);
  transition: background 0.1s;
}
.courier-row:last-child { border-bottom: none; }
.courier-row:hover { background: var(--surface-container); }
.c-name { font-size: 14px; color: var(--on-surface-variant); }
.c-badge {
  padding: 3px 8px;
  background: var(--primary-fixed);
  color: var(--on-primary-fixed-variant);
  border-radius: 2px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.c-etd {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--outline);
  min-width: 48px;
  text-align: right;
}
.c-cost {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--on-surface);
  min-width: 100px;
  text-align: right;
}

/* Tracking manifest panel */
.manifest-panel {
  border-top: 1px solid var(--outline-variant);
  background: var(--surface-container-low);
  padding: 16px 20px;
}
.no-manifest {
  font-size: 13px;
  color: var(--outline);
  text-align: center;
  padding: 12px 0;
}
.manifest-list { list-style: none; display: flex; flex-direction: column; }
.manifest-entry {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  position: relative;
}
.manifest-entry:last-child { padding-bottom: 0; }
.dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.dot-icon { font-size: 16px; color: var(--outline); position: relative; z-index: 1; }
.manifest-entry.latest .dot-icon { color: var(--primary-container); }
.manifest-entry:not(:last-child) .dot-col::after {
  content: '';
  position: absolute;
  top: 16px;
  left: 8px;
  width: 1px;
  height: calc(100% - 16px);
  background: var(--outline-variant);
}
.entry-body { flex: 1; padding-top: 1px; }
.entry-desc {
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface);
  line-height: 1.4;
}
.manifest-entry.latest .entry-desc { font-weight: 600; }
.entry-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 3px;
  flex-wrap: wrap;
}
.entry-city {
  display: flex;
  align-items: center;
  gap: 2px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--primary-container);
}
.entry-city .material-symbols-outlined { font-size: 12px; }
.entry-time {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--outline);
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; display: inline-block; }

@media (max-width: 600px) {
  .main { padding: 24px 16px; }
  .courier-row { grid-template-columns: 1fr auto; }
  .c-etd { display: none; }
  .item-right { flex-direction: column; align-items: flex-end; gap: 4px; }
  .date-meta { display: none; }
}
</style>
