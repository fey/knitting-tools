<script setup lang="ts">
/**
 * ПРОТОТИП. Полоса переключения вариантов. Сверху, а не снизу: снизу прибита плашка
 * прогресса — ровно тот контрол, который варианты и проверяют. Во всю ширину и своей
 * высотой в 36 px: варианты отступают под неё сами (`pt-12`, липкая шапка C — `top-9`),
 * иначе полоса накрывала бы их собственные кнопки сверху.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { VARIANTS, setVariant, variant } from './variant'

const index = computed(() => VARIANTS.findIndex((v) => v.key === variant.value))
const current = computed(() => VARIANTS[index.value])

function cycle(delta: number): void {
  const next = (index.value + delta + VARIANTS.length) % VARIANTS.length
  setVariant(VARIANTS[next].key)
}

function onKey(e: KeyboardEvent): void {
  const el = document.activeElement
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
  if (el instanceof HTMLElement && el.isContentEditable) return
  if (e.key === 'ArrowLeft') cycle(-1)
  else if (e.key === 'ArrowRight') cycle(1)
}

/**
 * Вариант A уводит схему в нативный фуллскрин, а там видно только содержимое
 * развёрнутого элемента — полоса, оставленная снаружи, пропала бы вместе с ходом
 * назад. Переезжает внутрь, пока фуллскрин держится. Это леса стенда, не находка.
 */
const fsEl = ref<Element | null>(null)
function onFs(): void {
  fsEl.value = document.fullscreenElement
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFs)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFs)
})
</script>

<template>
  <Teleport :to="fsEl ?? 'body'" :disabled="!fsEl">
    <div
      class="fixed inset-x-0 top-0 z-[100] flex h-9 items-center justify-center gap-1 bg-fuchsia-900 text-white"
      data-testid="prototype-switcher"
    >
      <button type="button" class="h-8 w-8 rounded-full hover:bg-fuchsia-700" @click="cycle(-1)">←</button>
      <span class="px-2 text-xs whitespace-nowrap">
        прототип · {{ current.key }} — {{ current.name }}
      </span>
      <button type="button" class="h-8 w-8 rounded-full hover:bg-fuchsia-700" @click="cycle(1)">→</button>
    </div>
  </Teleport>
</template>
