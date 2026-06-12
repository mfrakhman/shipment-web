<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { locationApi, type Province, type City, type District, type Subdistrict } from '@/api/location'

const props = defineProps<{ label: string }>()

const emit = defineEmits<{
  select: [payload: { id: string; label: string }]
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

onMounted(async () => {
  loading.value.provinces = true
  try {
    provinces.value = await locationApi.getProvinces()
  } catch (e) {
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
  emit('select', { id: selectedSubdistrict.value, label })
}
</script>

<template>
  <div class="location-selector">
    <p class="selector-label">{{ props.label }}</p>

    <div class="selects">
      <div class="select-group">
        <label>Province</label>
        <select
          v-model="selectedProvince"
          @change="onProvinceChange"
          :disabled="loading.provinces"
        >
          <option value="">{{ loading.provinces ? 'Loading...' : 'Select province' }}</option>
          <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div class="select-group">
        <label>City</label>
        <select
          v-model="selectedCity"
          @change="onCityChange"
          :disabled="!selectedProvince || loading.cities"
        >
          <option value="">{{ loading.cities ? 'Loading...' : 'Select city' }}</option>
          <option v-for="c in cities" :key="c.id" :value="c.id">
            {{ c.type }} {{ c.name }}
          </option>
        </select>
      </div>

      <div class="select-group">
        <label>District</label>
        <select
          v-model="selectedDistrict"
          @change="onDistrictChange"
          :disabled="!selectedCity || loading.districts"
        >
          <option value="">{{ loading.districts ? 'Loading...' : 'Select district' }}</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="select-group">
        <label>Subdistrict</label>
        <select
          v-model="selectedSubdistrict"
          @change="onSubdistrictChange"
          :disabled="!selectedDistrict || loading.subdistricts"
        >
          <option value="">{{ loading.subdistricts ? 'Loading...' : 'Select subdistrict' }}</option>
          <option v-for="s in subdistricts" :key="s.id" :value="s.id">
            {{ s.name }} ({{ s.postalCode }})
          </option>
        </select>
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

.selector-label {
  font-weight: 600;
  margin: 0 0 12px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
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

.error {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: #ef4444;
}
</style>
