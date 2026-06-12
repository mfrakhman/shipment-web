<script setup lang="ts">
import { ref } from 'vue'
import LocationSelector from '@/components/LocationSelector.vue'

const origin = ref<{ id: string; label: string } | null>(null)
const destination = ref<{ id: string; label: string } | null>(null)
</script>

<template>
  <main>
    <h1>Shipping Calculator</h1>

    <div class="selectors">
      <LocationSelector label="Origin" @select="(v) => (origin = v)" />
      <LocationSelector label="Destination" @select="(v) => (destination = v)" />
    </div>

    <div v-if="origin || destination" class="summary">
      <p v-if="origin"><strong>Origin:</strong> {{ origin.label }} (ID: {{ origin.id }})</p>
      <p v-if="destination">
        <strong>Destination:</strong> {{ destination.label }} (ID: {{ destination.id }})
      </p>
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 32px;
}

.selectors {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary {
  margin-top: 24px;
  padding: 14px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
