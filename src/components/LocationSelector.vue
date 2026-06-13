<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { locationApi, type Province, type City, type District, type Subdistrict } from '@/api/location'
import type { SavedAddress } from '@/api/address'

const props = defineProps<{
  label: string
  icon?: string
  savedAddresses?: SavedAddress[]
}>()

const emit = defineEmits<{
  select: [payload: { id: string; label: string; street?: string }]
  save: [payload: Omit<SavedAddress, 'id'>]
}>()

const provinces = ref<Province[]>([])
const cities = ref<City[]>([])
const districts = ref<District[]>([])
const subdistricts = ref<Subdistrict[]>([])

const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')
const selectedSubdistrict = ref('')

const loading = ref({ provinces: false, cities: false, districts: false, subdistricts: false })
const error = ref('')

const street = ref('')
const showSaveInput = ref(false)
const saveLabel = ref('')

onMounted(async () => {
  loading.value.provinces = true
  try {
    provinces.value = await locationApi.getProvinces()
  } catch {
    error.value = 'Failed to load provinces'
  } finally {
    loading.value.provinces = false
  }
})

async function onProvinceChange() {
  selectedCity.value = ''
  selectedDistrict.value = ''
  selectedSubdistrict.value = ''
  cities.value = []
  districts.value = []
  subdistricts.value = []
  showSaveInput.value = false
  if (!selectedProvince.value) return
  loading.value.cities = true
  try {
    cities.value = await locationApi.getCities(selectedProvince.value)
  } catch {
    error.value = 'Failed to load cities'
  } finally {
    loading.value.cities = false
  }
}

async function onCityChange() {
  selectedDistrict.value = ''
  selectedSubdistrict.value = ''
  districts.value = []
  subdistricts.value = []
  showSaveInput.value = false
  if (!selectedCity.value) return
  loading.value.districts = true
  try {
    districts.value = await locationApi.getDistricts(selectedCity.value)
  } catch {
    error.value = 'Failed to load districts'
  } finally {
    loading.value.districts = false
  }
}

async function onDistrictChange() {
  selectedSubdistrict.value = ''
  subdistricts.value = []
  showSaveInput.value = false
  if (!selectedDistrict.value) return
  loading.value.subdistricts = true
  try {
    subdistricts.value = await locationApi.getSubdistricts(selectedDistrict.value)
  } catch {
    error.value = 'Failed to load subdistricts'
  } finally {
    loading.value.subdistricts = false
  }
}

function onSubdistrictChange() {
  if (!selectedSubdistrict.value) return
  const sub = subdistricts.value.find((s) => s.id === selectedSubdistrict.value)
  if (!sub) return
  const city = cities.value.find((c) => c.id === selectedCity.value)
  const label = `${sub.name}, ${city?.name ?? ''}`
  emit('select', { id: selectedSubdistrict.value, label, street: street.value || undefined })
  showSaveInput.value = false
}

async function applysaved(id: string) {
  if (!id) return
  const addr = props.savedAddresses?.find((a) => a.id === id)
  if (!addr) return
  error.value = ''

  selectedProvince.value = addr.provinceId
  loading.value.cities = true
  try { cities.value = await locationApi.getCities(addr.provinceId) }
  catch { error.value = 'Failed to restore address'; return }
  finally { loading.value.cities = false }

  selectedCity.value = addr.cityId
  loading.value.districts = true
  try { districts.value = await locationApi.getDistricts(addr.cityId) }
  catch { error.value = 'Failed to restore address'; return }
  finally { loading.value.districts = false }

  selectedDistrict.value = addr.districtId
  loading.value.subdistricts = true
  try { subdistricts.value = await locationApi.getSubdistricts(addr.districtId) }
  catch { error.value = 'Failed to restore address'; return }
  finally { loading.value.subdistricts = false }

  selectedSubdistrict.value = String(addr.subdistrictId)
  street.value = addr.street ?? ''
  emit('select', {
    id: String(addr.subdistrictId),
    label: `${addr.subdistrictLabel}, ${addr.cityLabel}`,
    street: addr.street || undefined,
  })
  showSaveInput.value = false
}

function onStreetInput() {
  if (!selectedSubdistrict.value) return
  const sub = subdistricts.value.find((s) => s.id === selectedSubdistrict.value)
  if (!sub) return
  const city = cities.value.find((c) => c.id === selectedCity.value)
  emit('select', {
    id: selectedSubdistrict.value,
    label: `${sub.name}, ${city?.name ?? ''}`,
    street: street.value || undefined,
  })
}

function submitSave() {
  if (!saveLabel.value.trim() || !selectedSubdistrict.value) return
  const province = provinces.value.find((p) => p.id === selectedProvince.value)
  const city = cities.value.find((c) => c.id === selectedCity.value)
  const district = districts.value.find((d) => d.id === selectedDistrict.value)
  const sub = subdistricts.value.find((s) => s.id === selectedSubdistrict.value)
  if (!province || !city || !district || !sub) return
  emit('save', {
    label: saveLabel.value.trim(),
    provinceId: province.id,
    provinceLabel: province.name,
    cityId: city.id,
    cityLabel: city.name,
    districtId: district.id,
    districtLabel: district.name,
    subdistrictId: Number(sub.id),
    subdistrictLabel: sub.name,
    street: street.value || undefined,
  })
  showSaveInput.value = false
  saveLabel.value = ''
}
</script>

<template>
  <div class="loc">
    <!-- Section header -->
    <div class="loc-header">
      <span class="material-symbols-outlined loc-icon">{{ props.icon ?? 'location_on' }}</span>
      <h2 class="loc-label">{{ props.label }}</h2>
    </div>

    <!-- Saved address picker -->
    <div v-if="props.savedAddresses && props.savedAddresses.length > 0" class="saved-row">
      <select class="saved-select" @change="applysaved(($event.target as HTMLSelectElement).value)">
        <option value="">Use saved address…</option>
        <option v-for="a in props.savedAddresses" :key="a.id" :value="a.id">
          {{ a.label }} — {{ a.subdistrictLabel }}, {{ a.cityLabel }}
        </option>
      </select>
    </div>

    <!-- Cascade selects -->
    <div class="fields">
      <div class="field">
        <label>Province</label>
        <select v-model="selectedProvince" :disabled="loading.provinces" @change="onProvinceChange">
          <option value="">{{ loading.provinces ? 'Loading…' : 'Select province' }}</option>
          <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div class="field">
        <label>City</label>
        <select v-model="selectedCity" :disabled="!selectedProvince || loading.cities" @change="onCityChange">
          <option value="">{{ loading.cities ? 'Loading…' : 'Select city' }}</option>
          <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.type }} {{ c.name }}</option>
        </select>
      </div>

      <div class="field">
        <label>District</label>
        <select v-model="selectedDistrict" :disabled="!selectedCity || loading.districts" @change="onDistrictChange">
          <option value="">{{ loading.districts ? 'Loading…' : 'Select district' }}</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="field">
        <label>Subdistrict / ZIP</label>
        <select v-model="selectedSubdistrict" :disabled="!selectedDistrict || loading.subdistricts" @change="onSubdistrictChange">
          <option value="">{{ loading.subdistricts ? 'Loading…' : 'Select subdistrict' }}</option>
          <option v-for="s in subdistricts" :key="s.id" :value="s.id">{{ s.name }} ({{ s.postalCode }})</option>
        </select>
      </div>
    </div>

    <!-- Street address -->
    <div class="field street-field">
      <label>Street Address (Optional)</label>
      <textarea
        v-model="street"
        placeholder="e.g. Jl. Jend. Sudirman No. 123"
        rows="2"
        @input="onStreetInput"
      />
    </div>

    <!-- Save address -->
    <div v-if="selectedSubdistrict && props.savedAddresses !== undefined" class="save-row">
      <button v-if="!showSaveInput" class="save-link" @click="showSaveInput = true">
        + Save this address
      </button>
      <div v-else class="save-input-row">
        <input v-model="saveLabel" type="text" placeholder="Label (e.g. Home)" @keyup.enter="submitSave" />
        <button class="btn-save" @click="submitSave">Save</button>
        <button class="btn-cancel" @click="showSaveInput = false; saveLabel = ''">Cancel</button>
      </div>
    </div>

    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<style scoped>
.loc {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Header */
.loc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--surface-container);
}
.loc-icon {
  font-size: 22px;
  color: var(--primary-container);
}
.loc-label {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--on-surface);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Saved address */
.saved-row { display: flex; }
.saved-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  background: var(--surface-container-lowest);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 13px;
  color: var(--on-surface-variant);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.saved-select:focus { border-color: var(--primary-container); }

/* Cascade fields grid */
.fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
}
.field select,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--outline-variant);
  border-radius: 2px;
  background: var(--surface-container-lowest);
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  color: var(--on-surface);
  outline: none;
  appearance: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;
}
.field select:focus,
.field textarea:focus {
  border-color: var(--primary-container);
  box-shadow: 0 0 0 1px var(--primary-container);
}
.field select:disabled {
  background: var(--surface-container-low);
  color: var(--outline);
  cursor: not-allowed;
}

/* Street field spans full width */
.street-field {
  grid-column: 1 / -1;
}
.field textarea {
  resize: none;
  line-height: 1.5;
}

/* Save address */
.save-row { display: flex; align-items: center; }
.save-link {
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-container);
  cursor: pointer;
  padding: 0;
}
.save-link:hover { text-decoration: underline; }
.save-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}
.save-input-row input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.save-input-row input:focus { border-color: var(--primary-container); }
.btn-save {
  padding: 8px 14px;
  background: var(--primary-container);
  color: var(--on-primary);
  border: none;
  border-radius: 4px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-save:hover { background: var(--primary); }
.btn-cancel {
  padding: 8px 12px;
  background: none;
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 13px;
  color: var(--on-surface-variant);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: var(--outline); }

.err {
  font-size: 13px;
  color: var(--error);
}
</style>
