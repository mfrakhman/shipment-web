<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { locationApi, type Province, type City, type District, type Subdistrict } from '@/api/location'
import type { SavedAddress } from '@/api/address'

const props = defineProps<{
  label: string
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

  // Restore province
  selectedProvince.value = addr.provinceId
  loading.value.cities = true
  try { cities.value = await locationApi.getCities(addr.provinceId) }
  catch { error.value = 'Failed to restore address' ; return }
  finally { loading.value.cities = false }

  // Restore city
  selectedCity.value = addr.cityId
  loading.value.districts = true
  try { districts.value = await locationApi.getDistricts(addr.cityId) }
  catch { error.value = 'Failed to restore address' ; return }
  finally { loading.value.districts = false }

  // Restore district
  selectedDistrict.value = addr.districtId
  loading.value.subdistricts = true
  try { subdistricts.value = await locationApi.getSubdistricts(addr.districtId) }
  catch { error.value = 'Failed to restore address' ; return }
  finally { loading.value.subdistricts = false }

  // Restore subdistrict
  selectedSubdistrict.value = String(addr.subdistrictId)
  street.value = addr.street ?? ''
  emit('select', { id: String(addr.subdistrictId), label: `${addr.subdistrictLabel}, ${addr.cityLabel}`, street: addr.street || undefined })
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
  <div class="location-selector">
    <div class="selector-header">
      <p class="selector-label">{{ props.label }}</p>

      <div v-if="props.savedAddresses && props.savedAddresses.length > 0" class="saved-row">
        <select class="saved-select" @change="applysaved(($event.target as HTMLSelectElement).value)">
          <option value="">Use saved address...</option>
          <option v-for="a in props.savedAddresses" :key="a.id" :value="a.id">
            {{ a.label }} — {{ a.subdistrictLabel }}, {{ a.cityLabel }}
          </option>
        </select>
      </div>
    </div>

    <div class="selects">
      <div class="select-group">
        <label>Province</label>
        <select v-model="selectedProvince" @change="onProvinceChange" :disabled="loading.provinces">
          <option value="">{{ loading.provinces ? 'Loading...' : 'Select province' }}</option>
          <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div class="select-group">
        <label>City</label>
        <select v-model="selectedCity" @change="onCityChange" :disabled="!selectedProvince || loading.cities">
          <option value="">{{ loading.cities ? 'Loading...' : 'Select city' }}</option>
          <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.type }} {{ c.name }}</option>
        </select>
      </div>

      <div class="select-group">
        <label>District</label>
        <select v-model="selectedDistrict" @change="onDistrictChange" :disabled="!selectedCity || loading.districts">
          <option value="">{{ loading.districts ? 'Loading...' : 'Select district' }}</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="select-group">
        <label>Subdistrict</label>
        <select v-model="selectedSubdistrict" @change="onSubdistrictChange" :disabled="!selectedDistrict || loading.subdistricts">
          <option value="">{{ loading.subdistricts ? 'Loading...' : 'Select subdistrict' }}</option>
          <option v-for="s in subdistricts" :key="s.id" :value="s.id">
            {{ s.name }} ({{ s.postalCode }})
          </option>
        </select>
      </div>
    </div>

    <div class="street-row">
      <input
        v-model="street"
        type="text"
        placeholder="Street address (optional)"
        @input="onStreetInput"
      />
    </div>

    <div v-if="selectedSubdistrict && props.savedAddresses !== undefined" class="save-row">
      <button v-if="!showSaveInput" class="save-link" @click="showSaveInput = true">
        + Save this address
      </button>
      <div v-else class="save-input-row">
        <input v-model="saveLabel" type="text" placeholder="Label (e.g. Home)" @keyup.enter="submitSave" />
        <button class="save-btn" @click="submitSave">Save</button>
        <button class="cancel-btn" @click="showSaveInput = false; saveLabel = ''">Cancel</button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.location-selector {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.selector-label {
  font-weight: 600;
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  white-space: nowrap;
}

.saved-select {
  padding: 5px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  background: #fff;
  cursor: pointer;
  outline: none;
  color: #475569;
  max-width: 260px;
}

.saved-select:focus {
  border-color: #6366f1;
}

.selects {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.select-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.select-group label {
  font-size: 0.8rem;
  color: #475569;
}

.select-group select {
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.select-group select:focus {
  border-color: #6366f1;
}

.select-group select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.street-row {
  margin-top: 10px;
}

.street-row input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.street-row input:focus {
  border-color: #6366f1;
}

.save-row {
  margin-top: 10px;
}

.save-link {
  background: none;
  border: none;
  font-size: 0.8rem;
  color: #6366f1;
  cursor: pointer;
  padding: 0;
}

.save-link:hover {
  text-decoration: underline;
}

.save-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.save-input-row input {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  outline: none;
  flex: 1;
  max-width: 180px;
}

.save-input-row input:focus {
  border-color: #6366f1;
}

.save-btn {
  padding: 6px 12px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.cancel-btn {
  padding: 6px 10px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #64748b;
}

.error {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: #ef4444;
}
</style>
