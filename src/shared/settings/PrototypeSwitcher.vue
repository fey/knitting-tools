<script setup lang="ts">
/** ПРОТОТИП: плашка переключения вариантов. Только в dev-сборке. */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { VARIANTS, setVariant, variant } from './variant'

const index = computed(() => VARIANTS.findIndex((v) => v.key === variant.value))
const current = computed(() => VARIANTS[index.value])
function step(d: number): void {
  setVariant(VARIANTS[(index.value + d + VARIANTS.length) % VARIANTS.length].key)
}
function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement
  if (t.closest('input, textarea, [contenteditable]')) return
  if (e.key === 'ArrowLeft') step(-1)
  if (e.key === 'ArrowRight') step(1)
}
onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="fixed right-2 bottom-24 z-50 flex items-center gap-1 rounded-full bg-fuchsia-700 px-1 py-1 text-xs font-medium text-white shadow-lg"
  >
    <button type="button" class="size-8 rounded-full hover:bg-fuchsia-600" @click="step(-1)">←</button>
    <span class="px-2 whitespace-nowrap">{{ current.key }} · {{ current.name }}</span>
    <button type="button" class="size-8 rounded-full hover:bg-fuchsia-600" @click="step(1)">→</button>
  </div>
</template>
