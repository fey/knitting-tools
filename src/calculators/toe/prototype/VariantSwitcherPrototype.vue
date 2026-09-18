<script setup lang="ts">
/**
 * ПРОТОТИП, тикет #27. Плавающая полоса переключения вариантов: стрелки, имя варианта,
 * `?variant=` в адресе. Намеренно не похожа на страницу — это не часть оцениваемого.
 */
import { onMounted, onUnmounted } from 'vue'
import { VARIANT_NAMES, cycleVariant, variant } from './gauge'

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  const tag = t?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) return
  if (e.key === 'ArrowLeft') cycleVariant(-1)
  if (e.key === 'ArrowRight') cycleVariant(1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-2 py-1 text-white shadow-lg"
    data-testid="proto-switcher"
  >
    <button type="button" class="h-9 w-9 rounded-full text-lg" aria-label="Предыдущий вариант" @click="cycleVariant(-1)">←</button>
    <span class="px-1 text-sm whitespace-nowrap">ПРОТОТИП #27 · {{ variant }} — {{ VARIANT_NAMES[variant] }}</span>
    <button type="button" class="h-9 w-9 rounded-full text-lg" aria-label="Следующий вариант" @click="cycleVariant(1)">→</button>
  </div>
</template>
